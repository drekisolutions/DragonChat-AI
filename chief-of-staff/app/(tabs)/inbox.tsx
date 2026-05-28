import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const BRONZE = "#C9922A";
const SILVER = "#C0C0C0";
const MUTED = "#7A7A7A";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";

type Priority = "urgent" | "action" | "fyi" | "low";

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  priority: Priority;
  read: boolean;
}

const MOCK_EMAILS: Email[] = [
  {
    id: "1",
    from: "Sarah Chen",
    subject: "Q3 Revenue Report — Action Required",
    preview: "Please review the attached projections before Friday's board meeting.",
    body: "Hi,\n\nPlease review the attached Q3 revenue projections before Friday's board meeting. The numbers look strong but we need your sign-off on the growth targets.\n\nKey highlights:\n• Revenue up 34% YoY\n• ARR now at $4.2M\n• Churn reduced to 2.1%\n\nLet me know if you have questions.\n\nSarah",
    time: "8:42 AM",
    priority: "urgent",
    read: false,
  },
  {
    id: "2",
    from: "James Okafor",
    subject: "New enterprise lead: Meridian Corp",
    preview: "They're ready to move forward. Need a proposal by EOD.",
    body: "Hey,\n\nJust got off a call with Meridian Corp. They're ready to move forward with the enterprise plan. They need a proposal by end of day today.\n\nKey requirements:\n• 500 seats\n• SSO integration\n• Dedicated support SLA\n\nI'll have the Sales Agent start drafting unless you want to handle this personally.\n\nJames",
    time: "7:15 AM",
    priority: "action",
    read: false,
  },
  {
    id: "3",
    from: "Acme Corp Billing",
    subject: "Invoice #4821 — Payment Confirmation",
    preview: "Your payment of $12,400 has been received.",
    body: "Dear Customer,\n\nThis email confirms that your payment of $12,400.00 for Invoice #4821 has been received and processed.\n\nThank you for your business.\n\nAcme Corp Billing Team",
    time: "Yesterday",
    priority: "fyi",
    read: true,
  },
  {
    id: "4",
    from: "LinkedIn Notifications",
    subject: "You have 5 new connection requests",
    preview: "See who wants to connect with you on LinkedIn.",
    body: "You have 5 new connection requests waiting for your response.",
    time: "Yesterday",
    priority: "low",
    read: true,
  },
  {
    id: "5",
    from: "David Park",
    subject: "Partnership opportunity — TechVentures",
    preview: "Would love to explore a potential integration partnership.",
    body: "Hi,\n\nI'm the CEO of TechVentures. We've been following your work and believe there's a strong integration opportunity between our platforms.\n\nWould you be open to a 30-minute call next week?\n\nBest,\nDavid",
    time: "Mon",
    priority: "action",
    read: true,
  },
];

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  urgent: { label: "URGENT", color: "#EF5350", bg: "rgba(239,83,80,0.12)" },
  action: { label: "ACTION", color: BRONZE, bg: "rgba(201,146,42,0.12)" },
  fyi:    { label: "FYI",    color: SILVER, bg: "rgba(192,192,192,0.10)" },
  low:    { label: "LOW",    color: MUTED,  bg: "rgba(122,122,122,0.10)" },
};

export default function InboxScreen() {
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS);
  const [selected, setSelected] = useState<Email | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [filter, setFilter] = useState<Priority | "all">("all");

  const filtered = filter === "all" ? emails : emails.filter(e => e.priority === filter);

  const openEmail = (email: Email) => {
    setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read: true } : e));
    setSelected(email);
  };

  const handleDelegate = (email: Email) => {
    setEmails(prev => prev.filter(e => e.id !== email.id));
    setSelected(null);
  };

  const handleSend = () => {
    setShowReply(false);
    setReplyText("");
    setSelected(null);
  };

  const handleMarcusDraft = () => {
    setReplyText("Thank you for reaching out. I've reviewed the details and will follow up with a comprehensive response shortly. Please let me know if you need anything in the meantime.");
    setShowReply(true);
  };

  const renderEmail = ({ item }: { item: Email }) => {
    const p = priorityConfig[item.priority];
    return (
      <Pressable
        style={({ pressed }) => [
          styles.emailRow,
          !item.read && styles.unread,
          pressed && { opacity: 0.75 },
        ]}
        onPress={() => openEmail(item)}
      >
        <View style={styles.emailLeft}>
          <View style={styles.emailTopRow}>
            <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
              <Text style={[styles.priorityText, { color: p.color }]}>{p.label}</Text>
            </View>
            <Text style={styles.emailTime}>{item.time}</Text>
          </View>
          <Text style={[styles.emailFrom, !item.read && styles.unreadText]}>{item.from}</Text>
          <Text style={styles.emailSubject} numberOfLines={1}>{item.subject}</Text>
          <Text style={styles.emailPreview} numberOfLines={1}>{item.preview}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <Text style={styles.headerCount}>{emails.filter(e => !e.read).length} unread</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(["all", "urgent", "action", "fyi", "low"] as const).map(f => (
          <Pressable
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && { color: BRONZE }]}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderEmail}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Email detail modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <KeyboardAvoidingView
            style={styles.modal}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setSelected(null)} style={styles.closeBtn}>
                <IconSymbol name="xmark.circle.fill" size={24} color={MUTED} />
              </Pressable>
              <Text style={styles.modalTitle} numberOfLines={1}>{selected.subject}</Text>
              <Pressable onPress={() => handleDelegate(selected)} style={styles.delegateBtn}>
                <Text style={styles.delegateBtnText}>Delegate</Text>
              </Pressable>
            </View>

            <View style={styles.modalMeta}>
              <Text style={styles.modalFrom}>From: {selected.from}</Text>
              <Text style={styles.modalTime}>{selected.time}</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalBodyText}>{selected.body}</Text>
            </View>

            {showReply ? (
              <View style={styles.replyContainer}>
                <TextInput
                  style={styles.replyInput}
                  multiline
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="Type your reply..."
                  placeholderTextColor={MUTED}
                  textAlignVertical="top"
                />
                <View style={styles.replyActions}>
                  <Pressable style={styles.cancelBtn} onPress={() => setShowReply(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.sendBtn} onPress={handleSend}>
                    <IconSymbol name="paperplane.fill" size={16} color="#0A0A0A" />
                    <Text style={styles.sendBtnText}>Send</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.replyBar}>
                <Pressable style={styles.marcusDraftBtn} onPress={handleMarcusDraft}>
                  <Text style={styles.marcusDraftText}>Let Marcus Draft</Text>
                </Pressable>
                <Pressable style={styles.replyBtn} onPress={() => setShowReply(true)}>
                  <IconSymbol name="arrow.uturn.left" size={16} color={BRONZE} />
                  <Text style={styles.replyBtnText}>Reply</Text>
                </Pressable>
              </View>
            )}
          </KeyboardAvoidingView>
        )}
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerCount: {
    fontSize: 12,
    color: BRONZE,
    fontWeight: "600",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  filterActive: {
    borderColor: BRONZE,
    backgroundColor: "rgba(201,146,42,0.10)",
  },
  filterText: {
    fontSize: 11,
    fontWeight: "600",
    color: MUTED,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emailRow: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  unread: {
    borderColor: "#3A2A10",
    backgroundColor: "#1C1508",
  },
  emailLeft: {
    gap: 4,
  },
  emailTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  priorityBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  emailTime: {
    fontSize: 11,
    color: MUTED,
  },
  emailFrom: {
    fontSize: 14,
    fontWeight: "600",
    color: SILVER,
  },
  unreadText: {
    color: "#F0EDE8",
    fontWeight: "700",
  },
  emailSubject: {
    fontSize: 13,
    color: "#D0CCC6",
    fontWeight: "500",
  },
  emailPreview: {
    fontSize: 12,
    color: MUTED,
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
  closeBtn: {
    flexShrink: 0,
  },
  modalTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#F0EDE8",
  },
  delegateBtn: {
    backgroundColor: "rgba(201,146,42,0.12)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: BRONZE,
  },
  delegateBtnText: {
    fontSize: 12,
    color: BRONZE,
    fontWeight: "600",
  },
  modalMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  modalFrom: {
    fontSize: 13,
    color: SILVER,
  },
  modalTime: {
    fontSize: 12,
    color: MUTED,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  modalBodyText: {
    fontSize: 15,
    color: "#D0CCC6",
    lineHeight: 24,
  },
  replyBar: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
  },
  marcusDraftBtn: {
    flex: 1,
    backgroundColor: BRONZE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  marcusDraftText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  replyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: SURFACE,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: BRONZE,
  },
  replyBtnText: {
    fontSize: 14,
    color: BRONZE,
    fontWeight: "600",
  },
  replyContainer: {
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    padding: 16,
    gap: 10,
  },
  replyInput: {
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 12,
    color: "#F0EDE8",
    fontSize: 14,
    minHeight: 100,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  replyActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: MUTED,
    fontSize: 14,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BRONZE,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A0A0A",
  },
});
