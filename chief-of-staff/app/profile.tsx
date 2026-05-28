/**
 * User Profile Screen — Chief of Staff
 * Lets the user update their name, company, title, and greeting style.
 * Marcus uses this data to address the user personally in voice responses
 * and the daily briefing.
 */
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { USER_PROFILE_KEY, type UserProfile } from "@/app/onboarding";

const BRONZE = "#C9922A";
const SILVER = "#C0C0C0";
const MUTED = "#7A7A7A";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";
const BG = "#0A0A0A";
const SUCCESS = "#4CAF50";

const DEFAULT_PROFILE: UserProfile = {
  firstName: "",
  lastName: "",
  company: "Dreki Solutions",
  title: "",
  greeting: "formal",
};

const GREETING_DESCRIPTIONS: Record<UserProfile["greeting"], string> = {
  formal: "Good morning, Mr. Johnson. Here is your briefing.",
  casual: "Hey Alex! Here's what's on your plate today.",
  direct: "Alex. Three urgent items. Here's the rundown.",
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (raw) {
          setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) });
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const haptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!profile.firstName.trim()) {
      Alert.alert("First Name Required", "Please enter your first name so Marcus can address you.");
      return;
    }
    haptic();
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      setSaved(true);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setTimeout(() => setSaved(false), 2500);
    } catch {
      Alert.alert("Error", "Could not save profile. Please try again.");
    }
  }, [profile, haptic]);

  const displayName = profile.firstName
    ? profile.greeting === "formal" && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile.firstName
    : "You";

  const previewGreeting =
    profile.firstName
      ? GREETING_DESCRIPTIONS[profile.greeting]
          .replace("Alex", profile.firstName)
          .replace("Mr. Johnson", profile.lastName ? `${profile.firstName[0]}. ${profile.lastName}` : profile.firstName)
      : GREETING_DESCRIPTIONS[profile.greeting];

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-[#0A0A0A]">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={BRONZE} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar / Identity card */}
          <View style={styles.identityCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.firstName ? profile.firstName[0].toUpperCase() : "?"}
                {profile.lastName ? profile.lastName[0].toUpperCase() : ""}
              </Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={styles.identityName}>
                {profile.firstName || "Your Name"}
                {profile.lastName ? ` ${profile.lastName}` : ""}
              </Text>
              {profile.title ? (
                <Text style={styles.identityTitle}>{profile.title}</Text>
              ) : null}
              {profile.company ? (
                <Text style={styles.identityCompany}>{profile.company}</Text>
              ) : null}
            </View>
          </View>

          {/* Section: Personal Info */}
          <Text style={styles.sectionLabel}>Personal Information</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.fieldLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Alex"
                  placeholderTextColor={MUTED}
                  value={profile.firstName}
                  onChangeText={v => setProfile(p => ({ ...p, firstName: v }))}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Johnson"
                  placeholderTextColor={MUTED}
                  value={profile.lastName}
                  onChangeText={v => setProfile(p => ({ ...p, lastName: v }))}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Company</Text>
              <TextInput
                style={styles.input}
                placeholder="Dreki Solutions"
                placeholderTextColor={MUTED}
                value={profile.company}
                onChangeText={v => setProfile(p => ({ ...p, company: v }))}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Your Title</Text>
              <TextInput
                style={styles.input}
                placeholder="CEO, Founder, Director…"
                placeholderTextColor={MUTED}
                value={profile.title}
                onChangeText={v => setProfile(p => ({ ...p, title: v }))}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Section: Greeting Style */}
          <Text style={styles.sectionLabel}>Marcus Greeting Style</Text>
          <View style={styles.card}>
            <View style={styles.greetingRow}>
              {(["formal", "casual", "direct"] as const).map(g => (
                <Pressable
                  key={g}
                  style={[
                    styles.greetingChip,
                    profile.greeting === g && styles.greetingChipActive,
                  ]}
                  onPress={() => {
                    haptic();
                    setProfile(p => ({ ...p, greeting: g }));
                  }}
                >
                  <Text
                    style={[
                      styles.greetingChipText,
                      profile.greeting === g && styles.greetingChipTextActive,
                    ]}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Preview */}
            <View style={styles.previewBox}>
              <Text style={styles.previewLabel}>Preview</Text>
              <View style={styles.previewBubble}>
                <IconSymbol name="waveform" size={14} color={BRONZE} />
                <Text style={styles.previewText}>"{previewGreeting}"</Text>
              </View>
            </View>
          </View>

          {/* Save button */}
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              saved && styles.saveBtnSuccess,
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleSave}
          >
            {saved ? (
              <>
                <IconSymbol name="checkmark.circle.fill" size={20} color={BG} />
                <Text style={styles.saveBtnText}>Profile Saved</Text>
              </>
            ) : (
              <Text style={styles.saveBtnText}>Save Profile</Text>
            )}
          </Pressable>

          <Text style={styles.hint}>
            Marcus will use this information to address you personally in voice responses,
            the daily briefing, and agent communications.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: MUTED,
    fontSize: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 60,
  },
  backText: {
    color: BRONZE,
    fontSize: 15,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#F0EDE8",
    letterSpacing: 0.3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRONZE + "22",
    borderWidth: 2,
    borderColor: BRONZE,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800",
    color: BRONZE,
    letterSpacing: 1,
  },
  identityInfo: {
    flex: 1,
    gap: 2,
  },
  identityName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F0EDE8",
  },
  identityTitle: {
    fontSize: 13,
    color: BRONZE,
    fontWeight: "500",
  },
  identityCompany: {
    fontSize: 12,
    color: MUTED,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: -8,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 14,
  },
  fieldRow: {
    flexDirection: "row",
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    color: MUTED,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#F0EDE8",
  },
  greetingRow: {
    flexDirection: "row",
    gap: 8,
  },
  greetingChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    backgroundColor: BG,
  },
  greetingChipActive: {
    borderColor: BRONZE,
    backgroundColor: BRONZE + "18",
  },
  greetingChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: MUTED,
  },
  greetingChipTextActive: {
    color: BRONZE,
  },
  previewBox: {
    gap: 8,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    color: MUTED,
    textTransform: "uppercase",
  },
  previewBubble: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: BRONZE + "12",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: BRONZE + "30",
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    color: SILVER,
    lineHeight: 20,
    fontStyle: "italic",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BRONZE,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
  },
  saveBtnSuccess: {
    backgroundColor: SUCCESS,
  },
  saveBtnText: {
    color: BG,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  hint: {
    fontSize: 12,
    color: MUTED,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
