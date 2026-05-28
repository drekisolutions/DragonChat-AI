/**
 * AgentNamesContext
 *
 * Provides customizable names for Marcus (Chief of Staff) and all 5 sub-agents.
 * Names are persisted in AsyncStorage so they survive app restarts.
 *
 * Default names:
 *   Chief of Staff : Marcus
 *   Research       : Atlas
 *   Sales          : Sterling
 *   Support        : Aria
 *   Bookkeeping    : Ledger
 *   Personal       : Sage
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentKey =
  | "chiefOfStaff"
  | "research"
  | "sales"
  | "support"
  | "bookkeeping"
  | "personal";

export interface AgentProfile {
  key: AgentKey;
  name: string;
  role: string;
  description: string;
  defaultName: string;
  /** Chirp 3 HD voice name for this agent (all male) */
  voiceName: string;
  /** Bronze accent color or a distinct color per agent */
  color: string;
}

export type AgentNames = Record<AgentKey, string>;

interface AgentNamesContextValue {
  agents: Record<AgentKey, AgentProfile>;
  names: AgentNames;
  updateName: (key: AgentKey, name: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isLoaded: boolean;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const AGENT_DEFAULTS: Record<AgentKey, Omit<AgentProfile, "name">> = {
  chiefOfStaff: {
    key: "chiefOfStaff",
    role: "Chief of Staff",
    description:
      "Your primary AI executive assistant. Manages email, calendar, calls, and coordinates all sub-agents.",
    defaultName: "Marcus",
    voiceName: "en-US-Chirp3-HD-Charon",
    color: "#C9A84C", // Bronze
  },
  research: {
    key: "research",
    role: "Research Director",
    description:
      "Deep-dives into topics, competitors, markets, and trends. Delivers structured intelligence briefs.",
    defaultName: "Atlas",
    voiceName: "en-US-Chirp3-HD-Algenib",
    color: "#4A90D9", // Steel blue
  },
  sales: {
    key: "sales",
    role: "Sales Strategist",
    description:
      "Manages pipeline, drafts proposals, tracks follow-ups, and prepares deal briefs.",
    defaultName: "Sterling",
    voiceName: "en-US-Chirp3-HD-Fenrir",
    color: "#27AE60", // Emerald
  },
  support: {
    key: "support",
    role: "Customer Support Lead",
    description:
      "Handles customer inquiries, drafts responses, escalates issues, and tracks resolution status.",
    defaultName: "Aria",
    voiceName: "en-US-Chirp3-HD-Orus",
    color: "#8E44AD", // Violet
  },
  bookkeeping: {
    key: "bookkeeping",
    role: "Financial Controller",
    description:
      "Tracks expenses, invoices, reconciles accounts, and generates financial summaries.",
    defaultName: "Ledger",
    voiceName: "en-US-Chirp3-HD-Iapetus",
    color: "#E67E22", // Amber
  },
  personal: {
    key: "personal",
    role: "Personal Assistant",
    description:
      "Manages personal tasks, reminders, travel, reservations, and lifestyle requests.",
    defaultName: "Sage",
    voiceName: "en-US-Chirp3-HD-Sadaltager",
    color: "#16A085", // Teal
  },
};

const STORAGE_KEY = "@marcus:agent_names";

const DEFAULT_NAMES: AgentNames = Object.fromEntries(
  Object.entries(AGENT_DEFAULTS).map(([k, v]) => [k, v.defaultName])
) as AgentNames;

// ─── Context ──────────────────────────────────────────────────────────────────

const AgentNamesContext = createContext<AgentNamesContextValue | null>(null);

export function AgentNamesProvider({ children }: { children: ReactNode }) {
  const [names, setNames] = useState<AgentNames>(DEFAULT_NAMES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted names on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<AgentNames>;
          setNames(prev => ({ ...prev, ...parsed }));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const updateName = useCallback(async (key: AgentKey, name: string) => {
    const trimmed = name.trim().slice(0, 30);
    if (!trimmed) return;
    setNames(prev => {
      const next = { ...prev, [key]: trimmed };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetToDefaults = useCallback(async () => {
    setNames(DEFAULT_NAMES);
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  // Build full agent profiles with current names
  const agents: Record<AgentKey, AgentProfile> = Object.fromEntries(
    Object.entries(AGENT_DEFAULTS).map(([k, defaults]) => [
      k,
      { ...defaults, name: names[k as AgentKey] },
    ])
  ) as Record<AgentKey, AgentProfile>;

  return (
    <AgentNamesContext.Provider
      value={{ agents, names, updateName, resetToDefaults, isLoaded }}
    >
      {children}
    </AgentNamesContext.Provider>
  );
}

export function useAgentNames(): AgentNamesContextValue {
  const ctx = useContext(AgentNamesContext);
  if (!ctx) {
    throw new Error("useAgentNames must be used within AgentNamesProvider");
  }
  return ctx;
}
