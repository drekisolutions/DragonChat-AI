import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";
import { useVoiceCommand } from "@/hooks/use-voice-command";
import { useMarcus } from "@/hooks/use-marcus";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useAgentNames } from "@/lib/agent-names-context";

type UiState = "idle" | "recording" | "processing" | "speaking";

const BRONZE = "#C9922A";
const SILVER = "#C0C0C0";
const MUTED = "#7A7A7A";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";

export default function WakeScreen() {
  const [uiState, setUiState] = useState<UiState>("idle");
  const [conversation, setConversation] = useState<{ role: "user" | "marcus"; text: string }[]>([]);

  const bars = useRef(Array.from({ length: 9 }, () => new Animated.Value(0.15))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const { recordState, result, error, startRecording, stopAndProcess, reset } = useVoiceCommand();
  const marcus = useMarcus();
  const { salutation } = useUserProfile();
  const { agents } = useAgentNames();
  const chiefName = agents.marcus?.name ?? "Marcus";

  // Sync uiState with hook states
  useEffect(() => {
    if (recordState === "recording") setUiState("recording");
    else if (recordState === "processing") setUiState("processing");
    else if (marcus.isSpeaking) setUiState("speaking");
    else setUiState("idle");
  }, [recordState, marcus.isSpeaking]);

  // Handle completed voice command result — add to conversation and speak
  useEffect(() => {
    if (!result) return;
    setConversation(prev => [
      ...prev,
      { role: "user", text: result.transcript },
      { role: "marcus", text: result.response },
    ]);
    marcus.speak(result.response).catch(() => {});
    reset();
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Waveform animation
  const animateWaveform = useCallback(
    (active: boolean) => {
      if (active) {
        const animations = bars.map((bar, i) =>
          Animated.loop(
            Animated.sequence([
              Animated.timing(bar, {
                toValue: 0.2 + Math.random() * 0.8,
                duration: 200 + i * 40,
                useNativeDriver: true,
              }),
              Animated.timing(bar, {
                toValue: 0.15 + Math.random() * 0.4,
                duration: 200 + i * 30,
                useNativeDriver: true,
              }),
            ])
          )
        );
        Animated.parallel(animations).start();
      } else {
        bars.forEach(bar =>
          Animated.timing(bar, { toValue: 0.15, duration: 400, useNativeDriver: true }).start()
        );
      }
    },
    [bars]
  );

  const animatePulse = useCallback(
    (active: boolean) => {
      if (active) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
          ])
        ).start();
      } else {
        pulseAnim.stopAnimation();
        Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }
    },
    [pulseAnim]
  );

  useEffect(() => {
    const active = uiState === "recording" || uiState === "speaking";
    animateWaveform(active);
    animatePulse(active);
  }, [uiState, animateWaveform, animatePulse]);

  const handleMicPress = useCallback(async () => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (uiState === "idle") {
      if (Platform.OS === "web") {
        // Web demo: simulate the pipeline
        setUiState("recording");
        setTimeout(() => {
          setUiState("processing");
          setTimeout(() => {
            const reply = `Good day. You have three events today: a 9 AM standup, a 2 PM client call, and a 5 PM team review. Shall I prepare a full briefing?`;
            setConversation(prev => [
              ...prev,
              { role: "user", text: "What's on my calendar today?" },
              { role: "marcus", text: reply },
            ]);
            setUiState("idle");
          }, 1500);
        }, 2000);
      } else {
        await startRecording();
      }
    } else if (uiState === "recording") {
      await stopAndProcess();
    } else if (uiState === "speaking") {
      marcus.stopSpeaking();
      setUiState("idle");
    }
    // Ignore taps while processing
  }, [uiState, startRecording, stopAndProcess, marcus]);

  const stateLabel: Record<UiState, string> = {
    idle: `Say  "${chiefName}"  or tap to speak`,
    recording: "Recording... tap again to stop",
    processing: "Processing command...",
    speaking: `${chiefName} is speaking... tap to stop`,
  };

  const stateColor: Record<UiState, string> = {
    idle: MUTED,
    recording: "#EF5350",
    processing: SILVER,
    speaking: BRONZE,
  };

  const micColor: Record<UiState, string> = {
    idle: BRONZE,
    recording: "#EF5350",
    processing: SILVER,
    speaking: BRONZE,
  };

  const micBg: Record<UiState, string> = {
    idle: "rgba(201,146,42,0.10)",
    recording: "rgba(239,83,80,0.14)",
    processing: "rgba(192,192,192,0.10)",
    speaking: "rgba(201,146,42,0.10)",
  };

  return (
    <ScreenContainer containerClassName="bg-background" className="items-center">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Wordmark */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>CHIEF OF STAFF</Text>
          <Text style={styles.subtitle}>
            {salutation ? salutation : chiefName} · Dreki Solutions
          </Text>
        </View>

        {/* Waveform */}
        <Animated.View style={[styles.waveContainer, { transform: [{ scale: pulseAnim }] }]}>
          {bars.map((bar, i) => (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                {
                  transform: [{ scaleY: bar }],
                  backgroundColor:
                    uiState === "recording" ? "#EF5350"
                    : uiState === "idle" ? MUTED
                    : BRONZE,
                  opacity: uiState === "idle" ? 0.4 : 0.9,
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Status row */}
        <View style={styles.statusRow}>
          {uiState === "processing" && (
            <ActivityIndicator size="small" color={SILVER} style={{ marginRight: 8 }} />
          )}
          <Text style={[styles.stateLabel, { color: stateColor[uiState] }]}>
            {stateLabel[uiState]}
          </Text>
        </View>

        {/* Error card */}
        {error ? (
          <View style={[styles.errorCard]}>
            <Text style={styles.errorRole}>Error</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Mic button */}
        <Pressable
          onPress={handleMicPress}
          disabled={uiState === "processing"}
          style={({ pressed }) => [
            styles.micButton,
            {
              borderColor: micColor[uiState],
              backgroundColor: micBg[uiState],
              transform: [{ scale: pressed ? 0.95 : 1 }],
              opacity: uiState === "processing" ? 0.7 : 1,
            },
          ]}
        >
          {uiState === "processing" ? (
            <ActivityIndicator size="large" color={SILVER} />
          ) : (
            <IconSymbol
              name={uiState === "recording" ? "mic.slash.fill" : "mic.fill"}
              size={36}
              color={micColor[uiState]}
            />
          )}
        </Pressable>

        {/* Conversation history */}
        {conversation.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Conversation</Text>
            {conversation.map((msg, i) => (
              <View
                key={i}
                style={[styles.historyBubble, msg.role === "marcus" ? styles.marcusBubble : styles.userBubble]}
              >
                <Text style={[styles.historyRole, { color: msg.role === "marcus" ? BRONZE : SILVER }]}>
                  {msg.role === "marcus" ? chiefName : "You"}
                </Text>
                <Text style={styles.historyText}>{msg.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  wordmark: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: 10,
    color: BRONZE,
  },
  subtitle: {
    fontSize: 11,
    letterSpacing: 2,
    color: MUTED,
    marginTop: 6,
    textTransform: "uppercase",
  },
  waveContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 80,
    gap: 5,
    marginBottom: 24,
  },
  bar: {
    width: 5,
    height: 60,
    borderRadius: 3,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  stateLabel: {
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  errorCard: {
    width: "100%",
    backgroundColor: "#1a0505",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "#7f1d1d",
  },
  errorRole: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#f87171",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  errorText: {
    fontSize: 14,
    color: "#fca5a5",
    lineHeight: 20,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 32,
  },
  historyContainer: {
    width: "100%",
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  historyBubble: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
  },
  marcusBubble: {
    backgroundColor: "#1C1508",
    borderColor: "#3A2A10",
  },
  userBubble: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
  },
  historyRole: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  historyText: {
    fontSize: 14,
    color: "#F0EDE8",
    lineHeight: 20,
  },
});
