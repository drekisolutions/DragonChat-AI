import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";

const BRONZE = "#C9922A";
const SILVER = "#C0C0C0";
const MUTED = "#7A7A7A";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";

interface CallRecord {
  id: string;
  contact: string;
  company?: string;
  direction: "inbound" | "outbound";
  duration: string;
  date: string;
  hasTranscript: boolean;
  summary?: string;
  actionItems?: string[];
  transcript?: string;
}

const MOCK_CALLS: CallRecord[] = [
  {
    id: "1",
    contact: "John Acme",
    company: "Acme Corp",
    direction: "inbound",
    duration: "42 min",
    date: "Today 2:00 PM",
    hasTranscript: true,
    summary: "Quarterly business review. Acme is happy with the product. Discussed renewal at $14,800/yr (up from $12,400). John wants a custom SLA added to the contract.",
    actionItems: [
      "Send updated contract with custom SLA by Friday",
      "Schedule follow-up call for contract signing",
      "Loop in legal team on SLA terms",
    ],
    transcript: "John: Thanks for joining. We've been really happy with the platform...\nYou: Great to hear. Let's talk about the renewal...\nJohn: We'd like to continue, but we need a custom SLA for 99.9% uptime...",
  },
  {
    id: "2",
    contact: "David Park",
    company: "TechVentures",
    direction: "outbound",
    duration: "18 min",
    date: "Today 11:30 AM",
    hasTranscript: true,
    summary: "Initial partnership exploration call. TechVentures wants to build an integration. Agreed to share API documentation and schedule a technical deep-dive.",
    actionItems: [
      "Send API documentation to David",
      "Schedule technical deep-dive with engineering team",
    ],
    transcript: "You: Hi David, thanks for making time...\nDavid: Absolutely. We've been looking at your API...",
  },
  {
    id: "3",
    contact: "Unknown Caller",
    direction: "inbound",
    duration: "0 min",
    date: "Yesterday 3:15 PM",
    hasTranscript: false,
    summary: "Call screened by Marcus. Caller did not identify themselves. Call declined.",
  },
  {
    id: "4",
    contact: "Sarah Chen",
    direction: "inbound",
    duration: "8 min",
    date: "Yesterday 9:00 AM",
    hasTranscript: true,
    summary: "Quick sync on Q3 report. Sarah confirmed the numbers are finalized. Needs sign-off before Friday board meeting.",
    actionItems: [
      "Review and sign off on Q3 report by Thursday",
    ],
    transcript: "Sarah: Hey, just a quick update on the Q3 numbers...\nYou: Great, I'll review it today...",
  },
];

export default function CallsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<CallRecord | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const renderCall = ({ item }: { item: CallRecord }) => (
    <Pressable
      style={({ pressed }) => [styles.callRow, pressed && { opacity: 0.75 }]}
      onPress={() => setSelected(item)}
    >
      <View style={[
        styles.directionIcon,
        { backgroundColor: item.direction === "inbound" ? "rgba(76,175,80,0.12)" : "rgba(201,146,42,0.12)" },
      ]}>
        <IconSymbol
          name={item.direction === "inbound" ? "phone.fill" : "paperplane.fill"}
          size={16}
          color={item.direction === "inbound" ? "#4CAF50" : BRONZE}
        />
      </View>
      <View style={styles.callInfo}>
        <Text style={styles.callContact}>{item.contact}</Text>
        {item.company && <Text style={styles.callCompany}>{item.company}</Text>}
        <Text style={styles.callMeta}>{item.date} · {item.duration}</Text>
      </View>
      <View style={styles.callRight}>
        {item.hasTranscript && (
          <View style={styles.transcriptBadge}>
            <Text style={styles.transcriptBadgeText}>Transcript</Text>
          </View>
        )}
        <IconSymbol name="chevron.right" size={14} color={MUTED} />
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.right" size={20} color={BRONZE} style={{ transform: [{ rotate: "180deg" }] }} />
        </Pressable>
        <Text style={styles.headerTitle}>Call Log</Text>
      </View>

      <FlatList
        data={MOCK_CALLS}
        keyExtractor={item => item.id}
        renderItem={renderCall}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Call detail modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setSelected(null); setShowTranscript(false); }}
      >
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => { setSelected(null); setShowTranscript(false); }}>
                <IconSymbol name="xmark.circle.fill" size={24} color={MUTED} />
              </Pressable>
              <View style={styles.modalTitleBlock}>
                <Text style={styles.modalTitle}>{selected.contact}</Text>
                {selected.company && <Text style={styles.modalSub}>{selected.company}</Text>}
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.callMetaRow}>
                <Text style={styles.callMetaItem}>{selected.direction === "inbound" ? "Inbound" : "Outbound"}</Text>
                <Text style={styles.callMetaDot}>·</Text>
                <Text style={styles.callMetaItem}>{selected.duration}</Text>
                <Text style={styles.callMetaDot}>·</Text>
                <Text style={styles.callMetaItem}>{selected.date}</Text>
              </View>

              {selected.summary && (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryLabel}>AI SUMMARY</Text>
                  <Text style={styles.summaryText}>{selected.summary}</Text>
                </View>
              )}

              {selected.actionItems && selected.actionItems.length > 0 && (
                <View style={styles.actionItemsBox}>
                  <Text style={styles.actionItemsLabel}>ACTION ITEMS</Text>
                  {selected.actionItems.map((item, i) => (
                    <View key={i} style={styles.actionItem}>
                      <View style={styles.actionItemDot} />
                      <Text style={styles.actionItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {selected.hasTranscript && (
                <Pressable
                  style={styles.transcriptToggle}
                  onPress={() => setShowTranscript(!showTranscript)}
                >
                  <Text style={styles.transcriptToggleText}>
                    {showTranscript ? "Hide Transcript" : "View Transcript"}
                  </Text>
                  <IconSymbol
                    name="chevron.right"
                    size={14}
                    color={BRONZE}
                    style={{ transform: [{ rotate: showTranscript ? "90deg" : "0deg" }] }}
                  />
                </Pressable>
              )}

              {showTranscript && selected.transcript && (
                <View style={styles.transcriptBox}>
                  <Text style={styles.transcriptText}>{selected.transcript}</Text>
                </View>
              )}

              <Pressable style={styles.followUpBtn}>
                <IconSymbol name="square.and.pencil" size={16} color="#0A0A0A" />
                <Text style={styles.followUpBtnText}>Create Follow-Up Task</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F0EDE8",
    letterSpacing: 0.3,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
  },
  callRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
    gap: 12,
  },
  directionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  callInfo: {
    flex: 1,
    gap: 2,
  },
  callContact: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F0EDE8",
  },
  callCompany: {
    fontSize: 12,
    color: SILVER,
  },
  callMeta: {
    fontSize: 11,
    color: MUTED,
  },
  callRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  transcriptBadge: {
    backgroundColor: "rgba(201,146,42,0.12)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: "rgba(201,146,42,0.3)",
  },
  transcriptBadgeText: {
    fontSize: 9,
    color: BRONZE,
    fontWeight: "700",
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
  modalTitleBlock: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F0EDE8",
  },
  modalSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  modalBody: {
    padding: 16,
    gap: 14,
  },
  callMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  callMetaItem: {
    fontSize: 12,
    color: MUTED,
  },
  callMetaDot: {
    fontSize: 12,
    color: BORDER,
  },
  summaryBox: {
    backgroundColor: "#1C1508",
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "#3A2A10",
    gap: 8,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: BRONZE,
  },
  summaryText: {
    fontSize: 14,
    color: "#D0CCC6",
    lineHeight: 21,
  },
  actionItemsBox: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
    gap: 8,
  },
  actionItemsLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: SILVER,
    marginBottom: 4,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  actionItemDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: BRONZE,
    marginTop: 7,
    flexShrink: 0,
  },
  actionItemText: {
    flex: 1,
    fontSize: 13,
    color: "#D0CCC6",
    lineHeight: 19,
  },
  transcriptToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  transcriptToggleText: {
    fontSize: 13,
    color: BRONZE,
    fontWeight: "600",
  },
  transcriptBox: {
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  transcriptText: {
    fontSize: 13,
    color: "#D0CCC6",
    lineHeight: 21,
    fontFamily: "monospace",
  },
  followUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRONZE,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  followUpBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A0A0A",
  },
});
