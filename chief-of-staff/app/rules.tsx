import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
  Modal,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";

const BRONZE = "#C9922A";
const SILVER = "#C0C0C0";
const MUTED = "#7A7A7A";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";

type Domain = "Email" | "Calendar" | "Agents" | "Files" | "Calls";

interface Rule {
  id: string;
  domain: Domain;
  condition: string;
  action: string;
  enabled: boolean;
  risk: "low" | "medium" | "high";
}

const INITIAL_RULES: Rule[] = [
  {
    id: "e1",
    domain: "Email",
    condition: "Email is from a known contact and subject contains 'invoice'",
    action: "Forward to Bookkeeping Agent automatically",
    enabled: true,
    risk: "low",
  },
  {
    id: "e2",
    domain: "Email",
    condition: "Email is marked spam or from unknown sender",
    action: "Archive and notify me with a summary",
    enabled: true,
    risk: "low",
  },
  {
    id: "e3",
    domain: "Email",
    condition: "Email contains 'urgent' or 'ASAP' in subject",
    action: "Flag as Urgent and send me a push notification",
    enabled: true,
    risk: "low",
  },
  {
    id: "c1",
    domain: "Calendar",
    condition: "Meeting request from a known contact with no conflict",
    action: "Accept automatically and add to calendar",
    enabled: false,
    risk: "medium",
  },
  {
    id: "c2",
    domain: "Calendar",
    condition: "Event is cancelled by organizer",
    action: "Remove from calendar and notify me",
    enabled: true,
    risk: "low",
  },
  {
    id: "a1",
    domain: "Agents",
    condition: "Research Agent completes a task",
    action: "Send me a summary notification",
    enabled: true,
    risk: "low",
  },
  {
    id: "a2",
    domain: "Agents",
    condition: "Sales Agent drafts a proposal",
    action: "Send to me for review before sending to client",
    enabled: true,
    risk: "medium",
  },
  {
    id: "f1",
    domain: "Files",
    condition: "New file shared with me on Google Drive",
    action: "Notify me and add to recent files list",
    enabled: true,
    risk: "low",
  },
  {
    id: "l1",
    domain: "Calls",
    condition: "Incoming call from unknown number",
    action: "Screen the call and ask for name and purpose",
    enabled: false,
    risk: "high",
  },
  {
    id: "l2",
    domain: "Calls",
    condition: "Call ends",
    action: "Transcribe and generate summary with action items",
    enabled: true,
    risk: "low",
  },
];

const domainColors: Record<Domain, string> = {
  Email:    BRONZE,
  Calendar: "#4CAF50",
  Agents:   SILVER,
  Files:    "#FF9800",
  Calls:    "#EF5350",
};

const riskConfig = {
  low:    { label: "Low Risk",    color: "#4CAF50" },
  medium: { label: "Med Risk",    color: "#FF9800" },
  high:   { label: "High Risk",   color: "#EF5350" },
};

export default function RulesScreen() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(INITIAL_RULES);
  const [showBuilder, setShowBuilder] = useState(false);
  const [newCondition, setNewCondition] = useState("");
  const [newAction, setNewAction] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<Domain>("Email");

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const addRule = () => {
    if (!newCondition || !newAction) return;
    const newRule: Rule = {
      id: `custom_${Date.now()}`,
      domain: selectedDomain,
      condition: newCondition,
      action: newAction,
      enabled: true,
      risk: "medium",
    };
    setRules(prev => [...prev, newRule]);
    setNewCondition("");
    setNewAction("");
    setShowBuilder(false);
  };

  const domains: Domain[] = ["Email", "Calendar", "Agents", "Files", "Calls"];
  const grouped = domains.map(d => ({
    domain: d,
    rules: rules.filter(r => r.domain === d),
  }));

  const enabledCount = rules.filter(r => r.enabled).length;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.right" size={20} color={BRONZE} style={{ transform: [{ rotate: "180deg" }] }} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Autonomy Rules</Text>
          <Text style={styles.headerSub}>{enabledCount} of {rules.length} active</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowBuilder(true)}>
          <IconSymbol name="plus.circle.fill" size={26} color={BRONZE} />
        </Pressable>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <IconSymbol name="shield.fill" size={14} color={BRONZE} />
        <Text style={styles.infoText}>
          Rules define what Marcus can do autonomously. High-risk rules require your explicit confirmation.
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {grouped.map(({ domain, rules: domainRules }) => (
          <View key={domain} style={styles.domainSection}>
            <View style={styles.domainHeader}>
              <View style={[styles.domainDot, { backgroundColor: domainColors[domain] }]} />
              <Text style={[styles.domainLabel, { color: domainColors[domain] }]}>{domain}</Text>
              <Text style={styles.domainCount}>{domainRules.filter(r => r.enabled).length}/{domainRules.length} active</Text>
            </View>

            {domainRules.map((rule) => {
              const risk = riskConfig[rule.risk];
              return (
                <View key={rule.id} style={[styles.ruleCard, !rule.enabled && styles.ruleCardDisabled]}>
                  <View style={styles.ruleTop}>
                    <View style={[styles.riskBadge, { backgroundColor: `${risk.color}18` }]}>
                      <Text style={[styles.riskText, { color: risk.color }]}>{risk.label}</Text>
                    </View>
                    <Switch
                      value={rule.enabled}
                      onValueChange={() => toggleRule(rule.id)}
                      trackColor={{ false: BORDER, true: `${BRONZE}66` }}
                      thumbColor={rule.enabled ? BRONZE : MUTED}
                    />
                  </View>
                  <Text style={styles.ruleConditionLabel}>IF</Text>
                  <Text style={styles.ruleCondition}>{rule.condition}</Text>
                  <Text style={styles.ruleActionLabel}>THEN</Text>
                  <Text style={styles.ruleAction}>{rule.action}</Text>
                </View>
              );
            })}
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Rule builder modal */}
      <Modal
        visible={showBuilder}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBuilder(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowBuilder(false)}>
              <IconSymbol name="xmark.circle.fill" size={24} color={MUTED} />
            </Pressable>
            <Text style={styles.modalTitle}>Add Rule</Text>
            <Pressable style={styles.saveBtn} onPress={addRule}>
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.builderForm}>
            <Text style={styles.builderLabel}>Domain</Text>
            <View style={styles.domainPicker}>
              {(["Email", "Calendar", "Agents", "Files", "Calls"] as Domain[]).map(d => (
                <Pressable
                  key={d}
                  style={[
                    styles.domainPickerBtn,
                    selectedDomain === d && { borderColor: domainColors[d], backgroundColor: `${domainColors[d]}18` },
                  ]}
                  onPress={() => setSelectedDomain(d)}
                >
                  <Text style={[styles.domainPickerText, selectedDomain === d && { color: domainColors[d] }]}>{d}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.builderLabel}>IF (Condition)</Text>
            <TextInput
              style={styles.builderInput}
              multiline
              placeholder="e.g. Email is from a VIP contact"
              placeholderTextColor={MUTED}
              value={newCondition}
              onChangeText={setNewCondition}
              textAlignVertical="top"
            />

            <Text style={styles.builderLabel}>THEN (Action)</Text>
            <TextInput
              style={styles.builderInput}
              multiline
              placeholder="e.g. Flag as urgent and notify me immediately"
              placeholderTextColor={MUTED}
              value={newAction}
              onChangeText={setNewAction}
              textAlignVertical="top"
            />

            <Pressable style={styles.voiceRuleBtn}>
              <IconSymbol name="mic.fill" size={16} color={BRONZE} />
              <Text style={styles.voiceRuleText}>Describe the rule to Marcus</Text>
            </Pressable>
          </ScrollView>
        </View>
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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#F0EDE8",
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  addBtn: {
    padding: 4,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "rgba(201,146,42,0.08)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "rgba(201,146,42,0.25)",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#D0CCC6",
    lineHeight: 18,
  },
  list: {
    paddingHorizontal: 16,
  },
  domainSection: {
    marginBottom: 20,
  },
  domainHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  domainDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  domainLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    flex: 1,
  },
  domainCount: {
    fontSize: 11,
    color: MUTED,
  },
  ruleCard: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: BORDER,
    gap: 6,
  },
  ruleCardDisabled: {
    opacity: 0.5,
  },
  ruleTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  riskBadge: {
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  riskText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  ruleConditionLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: BRONZE,
  },
  ruleCondition: {
    fontSize: 13,
    color: "#D0CCC6",
    lineHeight: 19,
  },
  ruleActionLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: SILVER,
    marginTop: 4,
  },
  ruleAction: {
    fontSize: 13,
    color: "#D0CCC6",
    lineHeight: 19,
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
  saveBtn: {
    backgroundColor: BRONZE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  builderForm: {
    padding: 16,
    gap: 8,
  },
  builderLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: MUTED,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
  },
  domainPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  domainPickerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: SURFACE,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  domainPickerText: {
    fontSize: 12,
    fontWeight: "600",
    color: MUTED,
  },
  builderInput: {
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 14,
    color: "#F0EDE8",
    fontSize: 14,
    minHeight: 80,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  voiceRuleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(201,146,42,0.10)",
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: BRONZE,
    marginTop: 8,
  },
  voiceRuleText: {
    fontSize: 14,
    color: BRONZE,
    fontWeight: "600",
  },
});
