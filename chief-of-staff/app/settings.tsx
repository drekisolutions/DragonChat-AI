import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
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

export default function SettingsScreen() {
  const router = useRouter();
  const [wakeWord, setWakeWord] = useState("Hey Marcus");
  const [voiceSpeed, setVoiceSpeed] = useState("Normal");
  const [briefingTime, setBriefingTime] = useState("8:00 AM");
  const [callAlerts, setCallAlerts] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [agentAlerts, setAgentAlerts] = useState(true);
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const Section = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  const SettingRow = ({
    label,
    sub,
    value,
    toggle,
    onToggle,
    onPress,
  }: {
    label: string;
    sub?: string;
    value?: string;
    toggle?: boolean;
    onToggle?: (v: boolean) => void;
    onPress?: () => void;
  }) => (
    <Pressable
      style={({ pressed }) => [styles.settingRow, pressed && onPress && { opacity: 0.75 }]}
      onPress={onPress}
      disabled={!onPress && toggle === undefined}
    >
      <View style={styles.settingLeft}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sub && <Text style={styles.settingSub}>{sub}</Text>}
      </View>
      {toggle !== undefined && onToggle ? (
        <Switch
          value={toggle}
          onValueChange={onToggle}
          trackColor={{ false: BORDER, true: `${BRONZE}66` }}
          thumbColor={toggle ? BRONZE : MUTED}
        />
      ) : value ? (
        <View style={styles.settingValue}>
          <Text style={styles.settingValueText}>{value}</Text>
          {onPress && <IconSymbol name="chevron.right" size={14} color={MUTED} />}
        </View>
      ) : onPress ? (
        <IconSymbol name="chevron.right" size={14} color={MUTED} />
      ) : null}
    </Pressable>
  );

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.right" size={20} color={BRONZE} style={{ transform: [{ rotate: "180deg" }] }} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>

        {/* Voice */}
        <Section title="Voice" />
        <View style={styles.card}>
          <SettingRow
            label="Wake Word"
            sub="Phrase to activate Marcus hands-free"
            value={wakeWord}
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Voice Speed"
            sub="How fast Marcus speaks"
            value={voiceSpeed}
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Auto-Transcribe Calls"
            sub="Transcribe and summarize all calls"
            toggle={autoTranscribe}
            onToggle={setAutoTranscribe}
          />
        </View>

        {/* Notifications */}
        <Section title="Notifications" />
        <View style={styles.card}>
          <SettingRow
            label="Daily Briefing"
            sub="Morning summary from Marcus"
            value={briefingTime}
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Call Alerts"
            sub="Notify on incoming and missed calls"
            toggle={callAlerts}
            onToggle={setCallAlerts}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Email Alerts"
            sub="Notify on urgent and action emails"
            toggle={emailAlerts}
            onToggle={setEmailAlerts}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Agent Alerts"
            sub="Notify when agents complete tasks"
            toggle={agentAlerts}
            onToggle={setAgentAlerts}
          />
        </View>

        {/* Integrations */}
        <Section title="Integrations" />
        <View style={styles.card}>
          <View style={styles.integrationRow}>
            <View style={styles.integrationLeft}>
              <Text style={styles.settingLabel}>Google Account</Text>
              <Text style={styles.connectedText}>Connected</Text>
            </View>
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedBadgeText}>Active</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.integrationRow}>
            <View style={styles.integrationLeft}>
              <Text style={styles.settingLabel}>Gmail</Text>
              <Text style={styles.connectedText}>Read, compose, send</Text>
            </View>
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedBadgeText}>Active</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.integrationRow}>
            <View style={styles.integrationLeft}>
              <Text style={styles.settingLabel}>Google Calendar</Text>
              <Text style={styles.connectedText}>Read, create, update events</Text>
            </View>
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedBadgeText}>Active</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.integrationRow}>
            <View style={styles.integrationLeft}>
              <Text style={styles.settingLabel}>Google Drive</Text>
              <Text style={styles.connectedText}>Search and read files</Text>
            </View>
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedBadgeText}>Active</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <SettingRow
            label="Manus API"
            sub="Agent orchestration and connector bridge"
            value="Configured"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Zapier"
            sub="Business workflow automation"
            value="No actions enabled"
            onPress={() => {}}
          />
        </View>

        {/* Appearance */}
        <Section title="Appearance" />
        <View style={styles.card}>
          <SettingRow
            label="Dark Mode"
            sub="Matte black executive theme"
            toggle={darkMode}
            onToggle={setDarkMode}
          />
        </View>

        {/* About */}
        <Section title="About" />
        <View style={styles.card}>
          <SettingRow label="Version" value="MARCUS v1.0.0" />
          <View style={styles.divider} />
          <SettingRow label="Built by" value="Dreki Solutions" />
          <View style={styles.divider} />
          <SettingRow label="Privacy Policy" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow label="Terms of Service" onPress={() => {}} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: MUTED,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
    overflow: "hidden",
  },
  divider: {
    height: 0.5,
    backgroundColor: BORDER,
    marginLeft: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  settingLeft: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F0EDE8",
  },
  settingSub: {
    fontSize: 11,
    color: MUTED,
  },
  settingValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  settingValueText: {
    fontSize: 13,
    color: MUTED,
  },
  integrationRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  integrationLeft: {
    flex: 1,
    gap: 2,
  },
  connectedText: {
    fontSize: 11,
    color: MUTED,
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(76,175,80,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  connectedBadgeText: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "600",
  },
});
