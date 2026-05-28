/**
 * Google Cloud Text-to-Speech service
 * Uses Chirp 3 HD voices via Application Default Credentials (ADC).
 * Falls back gracefully if the Google TTS API is unavailable.
 *
 * Default voice: en-US-Chirp3-HD-Charon (deep, authoritative male)
 * Available male Chirp 3 HD voices:
 *   Achird, Algenib, Algieba, Alnilam, Charon, Enceladus, Fenrir,
 *   Iapetus, Orus, Puck, Rasalgethi, Sadachbia, Sadaltager,
 *   Schedar, Umbriel, Zubenelgenubi
 */

import { TextToSpeechClient } from "@google-cloud/text-to-speech";

let ttsClient: TextToSpeechClient | null = null;

function getClient(): TextToSpeechClient {
  if (!ttsClient) {
    ttsClient = new TextToSpeechClient();
  }
  return ttsClient;
}

export interface TTSOptions {
  /** Voice name — must be a Chirp 3 HD male voice. Defaults to Charon. */
  voiceName?: string;
  /** Language code. Defaults to en-US. */
  languageCode?: string;
  /** Speaking rate (0.25–4.0). Defaults to 1.0. */
  speakingRate?: number;
  /** Pitch in semitones (-20 to +20). Defaults to 0. */
  pitch?: number;
}

const DEFAULT_VOICE = "en-US-Chirp3-HD-Charon";
const DEFAULT_LANG = "en-US";

/**
 * Synthesize text to MP3 audio using Google Cloud TTS Chirp 3 HD.
 * Returns a base64-encoded MP3 string, or null if synthesis fails.
 */
export async function synthesizeSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<string | null> {
  const {
    voiceName = DEFAULT_VOICE,
    languageCode = DEFAULT_LANG,
    speakingRate = 1.0,
    pitch = 0,
  } = options;

  // Trim text to a safe length (Google TTS limit is 5000 bytes)
  const safeText = text.slice(0, 4800);

  try {
    const client = getClient();
    const [response] = await client.synthesizeSpeech({
      input: { text: safeText },
      voice: {
        languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: "MP3" as const,
        speakingRate,
        pitch,
      },
    });

    if (!response.audioContent) return null;

    // audioContent is a Uint8Array — convert to base64
    const audioBuffer =
      response.audioContent instanceof Uint8Array
        ? Buffer.from(response.audioContent)
        : Buffer.from(response.audioContent as string, "binary");

    return audioBuffer.toString("base64");
  } catch (err) {
    console.error("[TTS] Google Cloud TTS error:", err);
    return null;
  }
}

/** List of available Chirp 3 HD male voices for the settings picker */
export const CHIRP3_MALE_VOICES = [
  { name: "en-US-Chirp3-HD-Charon", label: "Charon — Deep & Authoritative" },
  { name: "en-US-Chirp3-HD-Achird", label: "Achird — Warm & Clear" },
  { name: "en-US-Chirp3-HD-Algenib", label: "Algenib — Smooth & Professional" },
  { name: "en-US-Chirp3-HD-Algieba", label: "Algieba — Rich & Resonant" },
  { name: "en-US-Chirp3-HD-Alnilam", label: "Alnilam — Crisp & Confident" },
  { name: "en-US-Chirp3-HD-Enceladus", label: "Enceladus — Steady & Calm" },
  { name: "en-US-Chirp3-HD-Fenrir", label: "Fenrir — Bold & Energetic" },
  { name: "en-US-Chirp3-HD-Iapetus", label: "Iapetus — Measured & Precise" },
  { name: "en-US-Chirp3-HD-Orus", label: "Orus — Friendly & Approachable" },
  { name: "en-US-Chirp3-HD-Puck", label: "Puck — Bright & Engaging" },
  { name: "en-US-Chirp3-HD-Rasalgethi", label: "Rasalgethi — Commanding & Clear" },
  { name: "en-US-Chirp3-HD-Sadachbia", label: "Sadachbia — Smooth & Articulate" },
  { name: "en-US-Chirp3-HD-Sadaltager", label: "Sadaltager — Warm & Trustworthy" },
  { name: "en-US-Chirp3-HD-Schedar", label: "Schedar — Deep & Deliberate" },
  { name: "en-US-Chirp3-HD-Umbriel", label: "Umbriel — Soft & Thoughtful" },
  { name: "en-US-Chirp3-HD-Zubenelgenubi", label: "Zubenelgenubi — Strong & Direct" },
];
