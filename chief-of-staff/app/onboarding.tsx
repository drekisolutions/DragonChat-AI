/**
 * Onboarding Screen — Chief of Staff
 * Shown only on first launch. Introduces Marcus, key features, requests
 * microphone permission on the Voice slide, and collects user profile info.
 * Saves flags to AsyncStorage on completion.
 */
import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/ui/icon-symbol";

const { width: SCREEN_W } = Dimensions.get("window");

const BRONZE = "#C9922A";
const SILVER = "#C0C0C0";
const MUTED = "#7A7A7A";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";
const BG = "#0A0A0A";
const ERROR = "#EF5350";
const SUCCESS = "#4CAF50";

export const ONBOARDING_COMPLETE_KEY = "@chief_of_staff:onboarding_complete";
export const USER_PROFILE_KEY = "@chief_of_staff:user_profile";

export interface UserProfile {
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  greeting: "formal" | "casual" | "direct";
}

type MicStatus = "unknown" | "requesting" | "granted" | "denied";

interface SlideBase {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  body: string;
}

const SLIDES: SlideBase[] = [
  {
    id: "welcome",
    icon: "waveform",
    iconColor: BRONZE,
    title: "Meet Marcus",
    subtitle: "Your Chief of Staff",
    body: "Marcus is an AI-powered executive assistant built for Dreki Solutions. He manages your emails, calendar, business calls, and coordinates your team of specialized agents — so you can focus on what matters.",
  },
  {
    id: "voice",
    icon: "mic.fill",
    iconColor: BRONZE,
    title: "Voice First",
    subtitle: "Say \"Hey Marcus\" to begin",
    body: "Speak naturally to Marcus from your phone or computer. He listens, understands context, and responds with a natural male voice powered by Google Cloud TTS.",
  },
  {
    id: "profile",
    icon: "person.fill",
    iconColor: SILVER,
    title: "Tell Marcus About You",
    subtitle: "Personalize your experience",
    body: "Marcus will address you by name and tailor his briefings to your role and preferences.",
  },
  {
    id: "email",
    icon: "envelope.fill",
    iconColor: "#4A90D9",
    title: "Email & Calendar",
    subtitle: "Inbox zero, effortlessly",
    body: "Marcus reads and prioritizes your Gmail, drafts replies in your voice, and keeps your Google Calendar organized. He flags urgent items and handles routine correspondence autonomously.",
  },
  {
    id: "agents",
    icon: "person.3.fill",
    iconColor: SILVER,
    title: "Your Agent Team",
    subtitle: "Five specialists, one command",
    body: "Atlas handles research. Sterling drives sales. Aria manages customer support. Ledger tracks bookkeeping. Sage handles personal tasks. Each agent has a name, a voice, and a specialty — all customizable.",
  },
  {
    id: "rules",
    icon: "shield.fill",
    iconColor: ERROR,
    title: "Governed Autonomy",
    subtitle: "Marcus acts within your rules",
    body: "You define what Marcus can do autonomously and what requires your approval. Set rules by domain — email, calendar, agents, calls, and files. You stay in control at all times.",
  },
  {
    id: "ready",
    icon: "checkmark.circle.fill",
    iconColor: BRONZE,
    title: "Ready to Begin",
    subtitle: "Chief of Staff · Dreki Solutions",
    body: "Marcus is ready to serve. Tap the microphone on the Listen tab to speak your first command, or explore the Home tab for your daily briefing. Your team is standing by.",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [micStatus, setMicStatus] = useState<MicStatus>("unknown");
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    company: "Dreki Solutions",
    title: "",
    greeting: "formal",
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const haptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, []);

  const animateTransition = useCallback(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.4, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim]);

  const goToSlide = useCallback(
    (index: number) => {
      haptic();
      animateTransition();
      setCurrentIndex(index);
    },
    [haptic, animateTransition]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      goToSlide(currentIndex + 1);
    }
  }, [currentIndex, goToSlide]);

  const handleBack = useCallback(() => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  }, [currentIndex, goToSlide]);

  const requestMicPermission = useCallback(async () => {
    if (Platform.OS === "web") {
      setMicStatus("granted");
      return;
    }
    setMicStatus("requesting");
    try {
      const { requestRecordingPermissionsAsync } = await import("expo-audio");
      const result = await requestRecordingPermissionsAsync();
      setMicStatus(result.granted ? "granted" : "denied");
      if (result.granted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch {
      setMicStatus("denied");
    }
  }, []);

  const handleComplete = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore storage errors
    }
    router.replace("/(tabs)");
  }, [profile]);

  const handleSkip = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
      if (profile.firstName) {
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      }
    } catch {
      // ignore
    }
    router.replace("/(tabs)");
  }, [profile]);

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;
  const isFirst = currentIndex === 0;
  const isVoiceSlide = slide.id === "voice";
  const isProfileSlide = slide.id === "profile";

  // Disable Next on profile slide if first name is empty
  const canProceed = isProfileSlide ? profile.firstName.trim().length > 0 : true;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Skip button */}
      {!isLast && (
        <Pressable
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      {/* Slide content */}
      <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
        {/* Icon */}
        <View style={[styles.iconCircle, { borderColor: slide.iconColor + "40" }]}>
          <View style={[styles.iconInner, { backgroundColor: slide.iconColor + "18" }]}>
            <IconSymbol name={slide.icon as any} size={48} color={slide.iconColor} />
          </View>
        </View>

        <Text style={styles.title}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: slide.iconColor }]}>{slide.subtitle}</Text>
        <Text style={styles.body}>{slide.body}</Text>

        {/* ── Voice slide: mic permission ── */}
        {isVoiceSlide && (
          <View style={styles.permissionCard}>
            {micStatus === "granted" ? (
              <View style={styles.permissionGranted}>
                <IconSymbol name="checkmark.circle.fill" size={22} color={SUCCESS} />
                <Text style={[styles.permissionText, { color: SUCCESS }]}>
                  Microphone access granted
                </Text>
              </View>
            ) : micStatus === "denied" ? (
              <View style={styles.permissionDenied}>
                <IconSymbol name="exclamationmark.triangle.fill" size={22} color={ERROR} />
                <Text style={[styles.permissionText, { color: ERROR }]}>
                  Mic access denied — enable it in Settings to use voice commands
                </Text>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.micPermBtn,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                  micStatus === "requesting" && { opacity: 0.6 },
                ]}
                onPress={requestMicPermission}
                disabled={micStatus === "requesting"}
              >
                <IconSymbol name="mic.fill" size={20} color={BG} />
                <Text style={styles.micPermBtnText}>
                  {micStatus === "requesting" ? "Requesting…" : "Allow Microphone Access"}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── Profile slide: name, company, title, greeting ── */}
        {isProfileSlide && (
          <ScrollView
            style={styles.profileForm}
            contentContainerStyle={styles.profileFormContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
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

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Greeting Style</Text>
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
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <Pressable key={i} onPress={() => goToSlide(i)}>
            <View
              style={[
                styles.dot,
                i === currentIndex
                  ? { backgroundColor: BRONZE, width: 20 }
                  : { backgroundColor: BORDER, width: 8 },
              ]}
            />
          </Pressable>
        ))}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {!isFirst ? (
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
            onPress={handleBack}
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}

        <Pressable
          style={({ pressed }) => [
            styles.nextBtn,
            isLast && styles.nextBtnLast,
            !canProceed && styles.nextBtnDisabled,
            pressed && canProceed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
          onPress={isLast ? handleComplete : handleNext}
          disabled={!canProceed}
        >
          <Text style={[styles.nextText, isLast && styles.nextTextLast]}>
            {isLast ? "Get Started" : "Next"}
          </Text>
          {!isLast && (
            <IconSymbol name="chevron.right" size={18} color={canProceed ? BRONZE : MUTED} />
          )}
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentIndex + 1) / SLIDES.length) * 100}%` },
          ]}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  skipBtn: {
    position: "absolute",
    top: 56,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  slideContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: 16,
    paddingBottom: 12,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F0EDE8",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    color: SILVER,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 340,
  },
  // Mic permission
  permissionCard: {
    width: "100%",
    marginTop: 8,
    alignItems: "center",
  },
  micPermBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: BRONZE,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    minWidth: 240,
    justifyContent: "center",
  },
  micPermBtnText: {
    color: BG,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  permissionGranted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: SUCCESS + "18",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SUCCESS + "40",
  },
  permissionDenied: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: ERROR + "18",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ERROR + "40",
    maxWidth: 320,
  },
  permissionText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    lineHeight: 18,
  },
  // Profile form
  profileForm: {
    width: "100%",
    maxHeight: 280,
  },
  profileFormContent: {
    gap: 14,
    paddingBottom: 8,
  },
  fieldRow: {
    flexDirection: "row",
    width: "100%",
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
    backgroundColor: SURFACE,
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
    backgroundColor: SURFACE,
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
  // Navigation
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  backBtn: {
    width: 80,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: MUTED,
    fontSize: 15,
    fontWeight: "500",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BRONZE,
    backgroundColor: "rgba(201,146,42,0.08)",
    minWidth: 120,
    justifyContent: "center",
  },
  nextBtnLast: {
    backgroundColor: BRONZE,
    borderColor: BRONZE,
    minWidth: 160,
  },
  nextBtnDisabled: {
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },
  nextText: {
    color: BRONZE,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  nextTextLast: {
    color: BG,
  },
  progressBar: {
    width: "100%",
    height: 3,
    backgroundColor: SURFACE,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: BRONZE,
    borderRadius: 2,
  },
});
