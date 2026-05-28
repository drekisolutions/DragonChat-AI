/**
 * useVoiceCommand — records audio with expo-audio, uploads to server,
 * runs the full voice pipeline (transcribe → intent → execute → response),
 * and returns the structured result.
 *
 * Usage:
 *   const { recordState, result, error, startRecording, stopAndProcess, reset } = useVoiceCommand();
 */

import { useState, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import type { VoiceCommandResult } from "@/server/voice-command";

export type VoiceRecordState = "idle" | "recording" | "processing";

export function useVoiceCommand() {
  const [recordState, setRecordState] = useState<VoiceRecordState>("idle");
  const [result, setResult] = useState<VoiceCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<any>(null);

  const processVoiceMutation = trpc.marcus.processVoice.useMutation();

  const startRecording = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      setError("Voice recording is not supported on web.");
      return false;
    }
    setResult(null);
    setError(null);

    try {
      const { AudioRecorder } = await import("expo-audio");
      const recorder = new AudioRecorder({
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 32000,
      });
      recorderRef.current = recorder;
      await recorder.record();
      setRecordState("recording");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start recording");
      setRecordState("idle");
      return false;
    }
  }, []);

  const stopAndProcess = useCallback(async (): Promise<VoiceCommandResult | null> => {
    if (recordState !== "recording") return null;
    setRecordState("processing");

    try {
      const recorder = recorderRef.current;
      if (!recorder) throw new Error("No active recorder");

      await recorder.stop();
      const uri: string | undefined = recorder.uri;
      if (!uri) throw new Error("Recording produced no file URI");

      // Read recording file as base64
      const FileSystem = await import("expo-file-system/legacy");
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: (FileSystem as any).EncodingType?.Base64 ?? "base64",
      });

      // Infer MIME type from extension
      const ext = uri.split(".").pop()?.toLowerCase() ?? "webm";
      const mimeType =
        ext === "m4a" ? "audio/m4a"
        : ext === "mp4" ? "audio/mp4"
        : ext === "wav" ? "audio/wav"
        : "audio/webm";

      const response = await processVoiceMutation.mutateAsync({
        audioBase64: base64,
        mimeType,
      });

      setResult(response);
      setRecordState("idle");
      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Voice processing failed";
      setError(msg);
      setRecordState("idle");
      return null;
    }
  }, [recordState, processVoiceMutation]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setRecordState("idle");
    recorderRef.current = null;
  }, []);

  return {
    recordState,
    result,
    error,
    isRecording: recordState === "recording",
    isProcessing: recordState === "processing",
    startRecording,
    stopAndProcess,
    reset,
  };
}
