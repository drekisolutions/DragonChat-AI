/**
 * useMarcus — Core hook for interacting with the Marcus AI Chief of Staff.
 *
 * Voice: Google Cloud TTS Chirp 3 HD (Charon — deep, authoritative male).
 * Fallback: expo-speech (device TTS) if Google TTS is unavailable.
 *
 * IMPORTANT: All native module calls are wrapped in try/catch and guarded
 * by Platform.OS checks to prevent APK cold-start crashes.
 */

import { useState, useCallback, useRef } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface MarcusState {
  isLoading: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  lastResponse: string | null;
  conversationHistory: ConversationMessage[];
  error: string | null;
  usingGoogleTTS: boolean;
}

const WAKE_WORD = "hey marcus";
const VOICE_PREF_KEY = "@marcus:voice_name";
const DEFAULT_VOICE = "en-US-Chirp3-HD-Charon";

export function useMarcus() {
  const [state, setState] = useState<MarcusState>({
    isLoading: false,
    isSpeaking: false,
    isListening: false,
    lastResponse: null,
    conversationHistory: [],
    error: null,
    usingGoogleTTS: false,
  });

  const voiceNameRef = useRef<string>(DEFAULT_VOICE);
  // Hold audio player ref lazily to avoid crashing on import
  const audioPlayerRef = useRef<any>(null);

  const chatMutation = trpc.marcus.chat.useMutation();
  const briefingMutation = trpc.marcus.dailyBriefing.useMutation();
  const draftEmailMutation = trpc.marcus.draftEmail.useMutation();
  const summarizeCallMutation = trpc.marcus.summarizeCall.useMutation();
  const dispatchAgentMutation = trpc.marcus.dispatchAgent.useMutation();
  const ttsMutation = trpc.tts.synthesize.useMutation();

  const loadVoicePreference = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(VOICE_PREF_KEY);
      if (saved) voiceNameRef.current = saved;
    } catch {
      // ignore
    }
  }, []);

  const setVoicePreference = useCallback(async (voiceName: string) => {
    voiceNameRef.current = voiceName;
    try {
      await AsyncStorage.setItem(VOICE_PREF_KEY, voiceName);
    } catch {
      // ignore
    }
  }, []);

  /**
   * Speak text.
   * 1. Tries Google Cloud TTS via the server tRPC endpoint (returns base64 MP3).
   * 2. Falls back to expo-speech (device TTS) if Google TTS fails.
   * All native calls are wrapped in try/catch to prevent APK crashes.
   */
  const speak = useCallback(
    async (text: string) => {
      if (Platform.OS === "web") return;

      setState(prev => ({ ...prev, isSpeaking: true }));

      try {
        // ── 1. Try Google Cloud TTS ──────────────────────────────────────────
        const ttsResult = await ttsMutation.mutateAsync({
          text: text.slice(0, 4800),
          voiceName: voiceNameRef.current,
        });

        if (ttsResult.available && ttsResult.audioBase64) {
          try {
            // Lazy-import expo-audio to avoid bundling issues
            const { useAudioPlayer, setAudioModeAsync } = await import("expo-audio");
            await setAudioModeAsync({ playsInSilentMode: true });

            const uri = `data:audio/mp3;base64,${ttsResult.audioBase64}`;

            // Create a one-shot player for this utterance
            const { Audio } = await import("expo-av");
            const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });

            setState(prev => ({ ...prev, usingGoogleTTS: true }));

            // Wait for playback to finish
            await new Promise<void>(resolve => {
              const checkInterval = setInterval(async () => {
                try {
                  const status = await sound.getStatusAsync();
                  if (!status.isLoaded || !status.isPlaying) {
                    clearInterval(checkInterval);
                    await sound.unloadAsync().catch(() => {});
                    resolve();
                  }
                } catch {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 300);
              // Safety timeout: 90 seconds max
              setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
              }, 90_000);
            });

            setState(prev => ({ ...prev, isSpeaking: false }));
            return;
          } catch {
            // Audio playback failed — fall through to expo-speech
          }
        }
      } catch {
        // Google TTS endpoint failed — fall through to expo-speech
      }

      // ── 2. Fallback: expo-speech (device TTS) ────────────────────────────
      try {
        setState(prev => ({ ...prev, usingGoogleTTS: false }));
        const Speech = await import("expo-speech");
        await Speech.stop().catch(() => {});

        await new Promise<void>(resolve => {
          Speech.speak(text, {
            language: "en-US",
            pitch: 0.85,
            rate: 0.92,
            onDone: () => {
              setState(prev => ({ ...prev, isSpeaking: false }));
              resolve();
            },
            onError: () => {
              setState(prev => ({ ...prev, isSpeaking: false }));
              resolve();
            },
          });
        });
      } catch {
        setState(prev => ({ ...prev, isSpeaking: false }));
      }
    },
    [ttsMutation]
  );

  const stopSpeaking = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        const Speech = await import("expo-speech");
        await Speech.stop().catch(() => {});
      }
    } catch {
      // ignore
    }
    setState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  const sendMessage = useCallback(
    async (message: string, options?: { speak?: boolean; context?: string }) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const userMsg: ConversationMessage = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, userMsg],
      }));

      try {
        const result = await chatMutation.mutateAsync({
          message,
          context: options?.context,
          conversationHistory: state.conversationHistory.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        });

        const replyText = String(result.reply ?? "");
        const assistantMsg: ConversationMessage = {
          role: "assistant",
          content: replyText,
          timestamp: result.timestamp,
        };

        setState(prev => ({
          ...prev,
          isLoading: false,
          lastResponse: replyText,
          conversationHistory: [...prev.conversationHistory, assistantMsg],
        }));

        if (options?.speak !== false) {
          await speak(replyText);
        }

        return replyText;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Marcus encountered an error.";
        setState(prev => ({ ...prev, isLoading: false, error: errorMsg }));
        return null;
      }
    },
    [chatMutation, state.conversationHistory, speak]
  );

  const requestDailyBriefing = useCallback(
    async (data: {
      emailCount?: number;
      urgentCount?: number;
      eventCount?: number;
      agentUpdates?: string[];
    }) => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const result = await briefingMutation.mutateAsync({
          emailCount: data.emailCount ?? 0,
          urgentCount: data.urgentCount ?? 0,
          eventCount: data.eventCount ?? 0,
          agentUpdates: data.agentUpdates ?? [],
        });
        const briefingText = String(result.briefing ?? "");
        setState(prev => ({ ...prev, isLoading: false, lastResponse: briefingText }));
        await speak(briefingText);
        return briefingText;
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }
    },
    [briefingMutation, speak]
  );

  const draftEmail = useCallback(
    async (
      originalEmail: string,
      instruction?: string,
      tone?: "formal" | "friendly" | "direct"
    ) => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const result = await draftEmailMutation.mutateAsync({
          originalEmail,
          instruction: instruction ?? "Draft a professional reply",
          tone: tone ?? "formal",
        });
        setState(prev => ({ ...prev, isLoading: false }));
        return result.draft;
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }
    },
    [draftEmailMutation]
  );

  const summarizeCall = useCallback(
    async (transcript: string, participants?: string[], duration?: string) => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const result = await summarizeCallMutation.mutateAsync({
          transcript,
          participants: participants ?? [],
          duration,
        });
        setState(prev => ({ ...prev, isLoading: false }));
        return result;
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }
    },
    [summarizeCallMutation]
  );

  const dispatchAgent = useCallback(
    async (
      agentName: "Research" | "Sales" | "Support" | "Bookkeeping" | "Personal",
      taskBrief: string,
      priority?: "low" | "normal" | "urgent"
    ) => {
      setState(prev => ({ ...prev, isLoading: true }));
      try {
        const result = await dispatchAgentMutation.mutateAsync({
          agentName,
          taskBrief,
          priority: priority ?? "normal",
        });
        setState(prev => ({ ...prev, isLoading: false }));
        return result;
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }
    },
    [dispatchAgentMutation]
  );

  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      conversationHistory: [],
      lastResponse: null,
      error: null,
    }));
  }, []);

  const setListening = useCallback((listening: boolean) => {
    setState(prev => ({ ...prev, isListening: listening }));
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    isSpeaking: state.isSpeaking,
    isListening: state.isListening,
    lastResponse: state.lastResponse,
    conversationHistory: state.conversationHistory,
    error: state.error,
    usingGoogleTTS: state.usingGoogleTTS,

    // Actions
    sendMessage,
    speak,
    stopSpeaking,
    requestDailyBriefing,
    draftEmail,
    summarizeCall,
    dispatchAgent,
    clearHistory,
    setListening,
    loadVoicePreference,
    setVoicePreference,

    // Constants
    WAKE_WORD,
    DEFAULT_VOICE,
  };
}
