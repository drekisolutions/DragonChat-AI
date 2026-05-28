import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const BRONZE = "#C9922A";
const SILVER = "#C0C0C0";
const MUTED = "#7A7A7A";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";

interface MenuItem {
  label: string;
  sub: string;
  icon: "slider.horizontal.3" | "phone.fill" | "folder.fill" | "gearshape.fill" | "shield.fill" | "bell.fill" | "person.2.fill" | "exclamationmark.triangle.fill" | "person.fill";
  route: string;
  color: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    label: "My Profile",
    sub: "Name, company, title, and Marcus greeting style",
    icon: "person.fill",
    route: "/profile",
    color: SILVER,
  },
  {
    label: "Names & Voices",
    sub: "Rename Marcus and all sub-agents, choose voices",
    icon: "person.2.fill",
    route: "/names",
    color: BRONZE,
  },
  {
    label: "Red Team Agent",
    sub: "Stress-test strategies with adversarial AI analysis",
    icon: "exclamationmark.triangle.fill",
    route: "/redteam",
    color: "#EF5350",
  },
  {
    label: "Autonomy Rules",
    sub: "Define what Marcus can do without asking",
    icon: "slider.horizontal.3",
    route: "/rules",
    color: BRONZE,
  },
  {
    label: "Call Log",
    sub: "Business call history, transcripts & follow-ups",
    icon: "phone.fill",
    route: "/calls",
    color: "#4CAF50",
  },
  {
    label: "File Browser",
    sub: "Search and access Google Drive files",
    icon: "folder.fill",
    route: "/files",
    color: SILVER,
  },
  {
    label: "Notifications",
    sub: "Briefing schedule and alert preferences",
    icon: "bell.fill",
    route: "/settings",
    color: "#FF9800",
  },
  {
    label: "Security & Privacy",
    sub: "Permissions, data access, and audit log",
    icon: "shield.fill",
    route: "/settings",
    color: "#EF5350",
  },
  {
    label: "Settings",
    sub: "Voice, integrations, and account",
    icon: "gearshape.fill",
    route: "/settings",
    color: MUTED,
  },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <ScreenContainer containerClassName="bg-background">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.label}
            style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.75 }]}
            onPress={() => (router as any).push(item.route)}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${item.color}18` }]}>
              <IconSymbol name={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={MUTED} />
          </Pressable>
        ))}

        {/* Dreki Solutions footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>DREKI SOLUTIONS</Text>
          <Text style={styles.footerVersion}>MARCUS v1.0 · Chief of Staff</Text>
        </View>
      </ScrollView>
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 16,
    borderWidth: 0.5,
    borderColor: BORDER,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  menuInfo: {
    flex: 1,
    gap: 3,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F0EDE8",
  },
  menuSub: {
    fontSize: 12,
    color: MUTED,
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
    gap: 4,
  },
  footerBrand: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    color: BRONZE,
  },
  footerVersion: {
    fontSize: 10,
    color: MUTED,
    letterSpacing: 1,
  },
  // v1.3 — Google TTS + Agent Names

});
