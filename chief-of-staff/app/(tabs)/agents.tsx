import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAgentNames } from "@/lib/agent-names-context";
import { useRouter } from "expo-router";

const BRONZE = "#C9922A";
const SILVER = "#C0C0C0";
const MUTED = "#7A7A7A";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";

type AgentStatus = "idle" | "running" | "needs_input" | "completed";

interface AgentTask {
  id: string;
  brief: string;
  status: AgentStatus;
  createdAt: string;
  result?: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  icon: "magnifyingglass" | "chart.bar.fill" | "text.bubble.fill" | "dollarsign.circle.fill" | "person.fill";
  tasks: AgentTask[];
}

const AGENTS: Agent[] = [
  {
    id: "research",
    name: "Research",
    role: "Intelligence & Analysis",
    description: "Conducts deep research on markets, competitors, topics, and people. Synthesizes findings into actionable reports.",
    status: "idle",
    icon: "magnifyingglass",
    tasks: [
      { id: "r1", brief: "Competitor analysis: AI scheduling tools", status: "completed", createdAt: "Today 8:00 AM", result: "Identified 7 key competitors. Top 3: Reclaim.ai, Motion, Clockwise. Full report ready." },
      { id: "r2", brief: "Market sizing: Enterprise AI assistants 2025", status: "completed", createdAt: "Yesterday", result: "TAM estimated at $4.2B. Growing at 34% CAGR. Key segments: legal, finance, executive." },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    role: "Revenue & Proposals",
    description: "Drafts proposals, follows up on leads, tracks pipeline, and prepares client-facing materials.",
    status: "running",
    icon: "chart.bar.fill",
    tasks: [
      { id: "s1", brief: "Draft enterprise proposal for Meridian Corp", status: "running", createdAt: "Today 7:30 AM" },
      { id: "s2", brief: "Follow up with TechVentures partnership inquiry", status: "idle", createdAt: "Today 9:00 AM" },
    ],
  },
  {
    id: "support",
    name: "Support",
    role: "Customer Success",
    description: "Handles customer inquiries, resolves tickets, drafts responses, and escalates critical issues.",
    status: "idle",
    icon: "text.bubble.fill",
    tasks: [
      { id: "su1", brief: "Resolve billing dispute — Acme Corp", status: "completed", createdAt: "Yesterday", result: "Issued credit of $240. Customer confirmed satisfied." },
      { id: "su2", brief: "Respond to 3 pending support tickets", status: "completed", createdAt: "Yesterday", result: "All 3 tickets resolved. Avg response time: 12 minutes." },
    ],
  },
  {
    id: "bookkeeping",
    name: "Bookkeeping",
    role: "Finance & Accounting",
    description: "Tracks invoices, monitors expenses, reconciles accounts, and generates financial summaries.",
    status: "idle",
    icon: "dollarsign.circle.fill",
    tasks: [
      { id: "b1", brief: "Reconcile May invoices", status: "completed", createdAt: "Mon", result: "12 invoices reconciled. 1 discrepancy flagged for review." },
    ],
  },
  {
    id: "personal",
    name: "Personal",
    role: "Personal Tasks & Errands",
    description: "Manages personal appointments, reminders, travel arrangements, and miscellaneous tasks.",
    status: "needs_input",
    icon: "person.fill",
    tasks: [
      { id: "p1", brief: "Book dinner reservation for Friday", status: "needs_input", createdAt: "Today 10:00 AM", result: "Found 3 options. Which do you prefer: Nobu (7 PM), Alinea (8 PM), or Le Bernardin (7:30 PM)?" },
    ],
  },
];

const statusConfig: Record<AgentStatus, { label: string; color: string }> = {
  idle:        { label: "Idle",        color: MUTED },
  running:     { label: "Running",     color: "#4CAF50" },
  needs_input: { label: "Needs Input", color: "#FF9800" },
  completed:   { label: "Completed",   color: SILVER },
};

export default function AgentsScreen() {
  const { agents: agentProfiles } = useAgentNames();
  const router = useRouter();
  const [selected, setSelected] = useState<Agent | null>(null);
  const [showDispatch, setShowDispatch] = useState(false);
  const [taskBrief, setTaskBrief] = useState("");
  const [dispatchTarget, setDispatchTarget] = useState<Agent | null>(null);

  // Merge live names from context into the static agent list
  const AGENTS_LIVE: Agent[] = AGENTS.map(a => ({
    ...a,
    name: agentProfiles[a.id as keyof typeof agentProfiles]?.name ?? a.name,
  }));

  const openDispatch = (agent: Agent) => {
    setDispatchTarget(agent);
    setShowDispatch(true);
  };

  const handleDispatch = () => {
    setShowDispatch(false);
    setTaskBrief("");
    setDispatchTarget(null);
  };

  const renderTask = ({ item }: { item: AgentTask }) => {
    const s = statusConfig[item.status];
    return (
      <View style={styles.taskRow}>
        <View style={styles.taskLeft}>
          <Text style={styles.taskBrief}>{item.brief}</Text>
          <Text style={styles.taskTime}>{item.createdAt}</Text>
          {item.result && (
            <Text style={styles.taskResult}>{item.result}</Text>
          )}
        </View>
        <View style={[styles.taskBadge, { backgroundColor: `${s.color}22` }]}>
          <Text style={[styles.taskBadgeText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agents</Text>
        <Text style={styles.headerSub}>5 specialized agents</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {AGENTS.map((agent) => {
          const s = statusConfig[agent.status];
          return (
            <Pressable
              key={agent.id}
              style={({ pressed }) => [styles.agentCard, pressed && { opacity: 0.8 }]}
              onPress={() => setSelected(agent)}
            >
              <View style={styles.agentTop}>
                <View style={styles.agentIconWrap}>
                  <IconSymbol name={agent.icon} size={22} color={BRONZE} />
                </View>
                <View style={styles.agentInfo}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentRole}>{agent.role}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${s.color}22` }]}>
                  <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                  <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                </View>
              </View>
              <Text style={styles.agentDesc} numberOfLines={2}>{agent.description}</Text>
              <View style={styles.agentFooter}>
                <Text style={styles.agentTaskCount}>
                  {agent.tasks.length} task{agent.tasks.length !== 1 ? "s" : ""}
                </Text>
                <Pressable
                  style={styles.dispatchBtn}
                  onPress={() => openDispatch(agent)}
                >
                  <IconSymbol name="bolt.fill" size={13} color="#0A0A0A" />
                  <Text style={styles.dispatchBtnText}>Dispatch</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Agent detail modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setSelected(null)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={MUTED} />
              </Pressable>
              <Text style={styles.modalTitle}>{selected.name} Agent</Text>
              <Pressable
                style={styles.dispatchHeaderBtn}
                onPress={() => {
                  setSelected(null);
                  openDispatch(selected);
                }}
              >
                <Text style={styles.dispatchHeaderBtnText}>Dispatch</Text>
              </Pressable>
            </View>

            <View style={styles.agentDetailMeta}>
              <Text style={styles.agentDetailRole}>{selected.role}</Text>
              <Text style={styles.agentDetailDesc}>{selected.description}</Text>
            </View>

            <Text style={styles.taskHistoryLabel}>Task History</Text>
            <FlatList
              data={selected.tasks}
              keyExtractor={item => item.id}
              renderItem={renderTask}
              contentContainerStyle={styles.taskList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </Modal>

      {/* Dispatch modal */}
      <Modal
        visible={showDispatch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDispatch(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowDispatch(false)}>
              <IconSymbol name="xmark.circle.fill" size={24} color={MUTED} />
            </Pressable>
            <Text style={styles.modalTitle}>
              Dispatch to {dispatchTarget?.name}
            </Text>
            <Pressable style={styles.dispatchHeaderBtn} onPress={handleDispatch}>
              <Text style={styles.dispatchHeaderBtnText}>Send</Text>
            </Pressable>
          </View>
          <View style={styles.dispatchForm}>
            <Text style={styles.dispatchLabel}>Task Brief</Text>
            <TextInput
              style={styles.dispatchInput}
              multiline
              placeholder={`Describe what you need the ${dispatchTarget?.name} agent to do...`}
              placeholderTextColor={MUTED}
              value={taskBrief}
              onChangeText={setTaskBrief}
              textAlignVertical="top"
            />
            <Pressable style={styles.voiceDispatchBtn}>
              <IconSymbol name="mic.fill" size={16} color={BRONZE} />
              <Text style={styles.voiceDispatchText}>Dictate to Marcus</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F0EDE8",
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  agentCard: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: BORDER,
    gap: 10,
  },
  agentTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  agentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(201,146,42,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: BRONZE,
    flexShrink: 0,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F0EDE8",
  },
  agentRole: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  agentDesc: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 19,
  },
  agentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agentTaskCount: {
    fontSize: 11,
    color: MUTED,
  },
  dispatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: BRONZE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  dispatchBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  modal: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#F0EDE8",
  },
  dispatchHeaderBtn: {
    backgroundColor: BRONZE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dispatchHeaderBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  agentDetailMeta: {
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    gap: 6,
  },
  agentDetailRole: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: BRONZE,
    textTransform: "uppercase",
  },
  agentDetailDesc: {
    fontSize: 14,
    color: "#D0CCC6",
    lineHeight: 21,
  },
  taskHistoryLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: MUTED,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  taskList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  taskRow: {
    flexDirection: "row",
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 12,
    borderWidth: 0.5,
    borderColor: BORDER,
    gap: 10,
    alignItems: "flex-start",
  },
  taskLeft: {
    flex: 1,
    gap: 3,
  },
  taskBrief: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F0EDE8",
  },
  taskTime: {
    fontSize: 11,
    color: MUTED,
  },
  taskResult: {
    fontSize: 12,
    color: "#D0CCC6",
    marginTop: 4,
    lineHeight: 18,
  },
  taskBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  dispatchForm: {
    padding: 16,
    gap: 12,
  },
  dispatchLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: MUTED,
    textTransform: "uppercase",
  },
  dispatchInput: {
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 14,
    color: "#F0EDE8",
    fontSize: 15,
    minHeight: 120,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  voiceDispatchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(201,146,42,0.10)",
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: BRONZE,
  },
  voiceDispatchText: {
    fontSize: 14,
    color: BRONZE,
    fontWeight: "600",
  },
});
