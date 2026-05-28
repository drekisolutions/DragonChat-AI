import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { useUserProfile } from "@/hooks/use-user-profile";

const BRONZE = "#C9922A";
const SILVER = "#C0C0C0";
const MUTED = "#7A7A7A";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";
const DEEP_BRONZE_BG = "#1C1508";
const DEEP_BRONZE_BORDER = "#3A2A10";

type Priority = "urgent" | "action" | "fyi" | "low";
type EventType = "meeting" | "call" | "deadline" | "personal";
type AgentStatus = "idle" | "running" | "needs_input";

const MOCK_EMAILS = [
  { id: "1", from: "Sarah Chen", subject: "Q3 Revenue Report — Action Required", preview: "Please review the attached projections before Friday's board meeting.", time: "8:42 AM", priority: "urgent" as Priority },
  { id: "2", from: "James Okafor", subject: "New enterprise lead: Meridian Corp", preview: "They're ready to move forward. Need a proposal by EOD.", time: "7:15 AM", priority: "action" as Priority },
  { id: "3", from: "Acme Corp Billing", subject: "Invoice #4821 — Payment Confirmation", preview: "Your payment of $12,400 has been received.", time: "Yesterday", priority: "fyi" as Priority },
];

const MOCK_EVENTS = [
  { id: "1", title: "Daily Standup", time: "9:00 AM", duration: "30 min", attendees: 5, type: "meeting" as EventType },
  { id: "2", title: "Client Call — Acme Corp", time: "2:00 PM", duration: "1 hr", attendees: 3, type: "call" as EventType },
  { id: "3", title: "Team Review", time: "5:00 PM", duration: "45 min", attendees: 8, type: "meeting" as EventType },
];

const MOCK_AGENTS = [
  { id: "research", name: "Research", status: "idle" as AgentStatus, lastAction: "Completed competitor analysis" },
  { id: "sales", name: "Sales", status: "running" as AgentStatus, lastAction: "Drafting proposal for Meridian Corp" },
  { id: "support", name: "Support", status: "idle" as AgentStatus, lastAction: "Resolved 3 tickets" },
];

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  urgent: { label: "URGENT", color: "#EF5350", bg: "rgba(239,83,80,0.12)" },
  action: { label: "ACTION", color: BRONZE,    bg: "rgba(201,146,42,0.12)" },
  fyi:    { label: "FYI",    color: SILVER,    bg: "rgba(192,192,192,0.10)" },
  low:    { label: "LOW",    color: MUTED,     bg: "rgba(122,122,122,0.10)" },
};

const eventTypeColor: Record<EventType, string> = {
  meeting:  BRONZE,
  call:     "#4CAF50",
  deadline: "#FF9800",
  personal: SILVER,
};

const agentStatusConfig: Record<AgentStatus, { label: string; color: string }> = {
  idle:        { label: "Idle",        color: MUTED },
  running:     { label: "Running",     color: "#4CAF50" },
  needs_input: { label: "Needs Input", color: "#FF9800" },
};

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { salutation, profile } = useUserProfile();

  const now = new Date();
  const hour = now.getHours();
  const greetingBase = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const greeting = salutation || greetingBase;
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleQuickAction = useCallback(async (action: string) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (action === "inbox") (router as any).push("/(tabs)/inbox");
    else if (action === "calendar") (router as any).push("/(tabs)/calendar");
    else if (action === "agents") (router as any).push("/(tabs)/agents");
    else if (action === "calls") (router as any).push("/calls");
  }, [router]);

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRONZE} />
        }
      >
        <View style={styles.container}>

          {/* Greeting + Briefing */}
          <View style={styles.briefingCard}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.dateStr}>{dateStr}</Text>
            <View style={styles.divider} />
            <Text style={styles.briefingLabel}>DAILY BRIEFING</Text>
            <Text style={styles.briefingText}>
              You have 3 calendar events, 2 emails requiring action, and 1 agent actively working on the Meridian Corp proposal. Your most time-sensitive item is the Q3 Revenue Report review due before Friday.
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {[
              { icon: "square.and.pencil" as const, label: "Compose", action: "inbox" },
              { icon: "calendar" as const, label: "Schedule", action: "calendar" },
              { icon: "person.3.fill" as const, label: "Delegate", action: "agents" },
              { icon: "phone.fill" as const, label: "Call Log", action: "calls" },
            ].map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
                onPress={() => handleQuickAction(item.action)}
              >
                <IconSymbol name={item.icon} size={22} color={BRONZE} />
                <Text style={styles.quickBtnLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Email Summary */}
          <SectionHeader
            title="Priority Inbox"
            action="View All"
            onAction={() => (router as any).push("/(tabs)/inbox")}
          />
          {MOCK_EMAILS.map((email) => {
            const p = priorityConfig[email.priority];
            return (
              <Pressable
                key={email.id}
                style={({ pressed }) => [styles.emailRow, pressed && { opacity: 0.75 }]}
                onPress={() => (router as any).push("/(tabs)/inbox")}
              >
                <View style={styles.emailLeft}>
                  <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
                    <Text style={[styles.priorityText, { color: p.color }]}>{p.label}</Text>
                  </View>
                  <Text style={styles.emailFrom} numberOfLines={1}>{email.from}</Text>
                  <Text style={styles.emailSubject} numberOfLines={1}>{email.subject}</Text>
                  <Text style={styles.emailPreview} numberOfLines={1}>{email.preview}</Text>
                </View>
                <Text style={styles.emailTime}>{email.time}</Text>
              </Pressable>
            );
          })}

          {/* Calendar Preview */}
          <SectionHeader
            title="Today's Schedule"
            action="View All"
            onAction={() => (router as any).push("/(tabs)/calendar")}
          />
          {MOCK_EVENTS.map((event) => (
            <Pressable
              key={event.id}
              style={({ pressed }) => [styles.eventRow, pressed && { opacity: 0.75 }]}
              onPress={() => (router as any).push("/(tabs)/calendar")}
            >
              <View style={[styles.eventDot, { backgroundColor: eventTypeColor[event.type] }]} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMeta}>{event.time} · {event.duration} · {event.attendees} attendees</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={MUTED} />
            </Pressable>
          ))}

          {/* Active Agents */}
          <SectionHeader
            title="Active Agents"
            action="Manage"
            onAction={() => (router as any).push("/(tabs)/agents")}
          />
          {MOCK_AGENTS.map((agent) => {
            const s = agentStatusConfig[agent.status];
            return (
              <Pressable
                key={agent.id}
                style={({ pressed }) => [styles.agentRow, pressed && { opacity: 0.75 }]}
                onPress={() => (router as any).push("/(tabs)/agents")}
              >
                <View style={styles.agentLeft}>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentLast}>{agent.lastAction}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${s.color}22` }]}>
                  <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                  <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                </View>
              </Pressable>
            );
          })}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  briefingCard: {
    backgroundColor: DEEP_BRONZE_BG,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: DEEP_BRONZE_BORDER,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F0EDE8",
    letterSpacing: 0.3,
  },
  dateStr: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  divider: {
    height: 0.5,
    backgroundColor: DEEP_BRONZE_BORDER,
    marginVertical: 14,
  },
  briefingLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: BRONZE,
    marginBottom: 8,
  },
  briefingText: {
    fontSize: 14,
    color: "#D0CCC6",
    lineHeight: 21,
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  quickBtnLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: SILVER,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: MUTED,
    textTransform: "uppercase",
  },
  sectionAction: {
    fontSize: 11,
    color: BRONZE,
    fontWeight: "600",
  },
  emailRow: {
    flexDirection: "row",
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: BORDER,
    alignItems: "flex-start",
  },
  emailLeft: {
    flex: 1,
    gap: 3,
  },
  priorityBadge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  emailFrom: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F0EDE8",
  },
  emailSubject: {
    fontSize: 13,
    color: SILVER,
    fontWeight: "500",
  },
  emailPreview: {
    fontSize: 12,
    color: MUTED,
  },
  emailTime: {
    fontSize: 11,
    color: MUTED,
    marginLeft: 10,
    marginTop: 2,
    flexShrink: 0,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: BORDER,
    gap: 12,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  eventInfo: {
    flex: 1,
    gap: 3,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F0EDE8",
  },
  eventMeta: {
    fontSize: 12,
    color: MUTED,
  },
  agentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  agentLeft: {
    flex: 1,
    gap: 3,
  },
  agentName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F0EDE8",
  },
  agentLast: {
    fontSize: 12,
    color: MUTED,
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
});
