/**
 * Voice Command Pipeline — server-side logic
 *
 * Flow:
 *   1. Receive base64 audio from client
 *   2. Upload to S3 via storagePut
 *   3. Transcribe via Whisper (voiceTranscription)
 *   4. Parse intent via LLM (classify command → agent + action + params)
 *   5. Execute action (dispatchAgent / email / calendar / drive / direct chat)
 *   6. Return { transcript, intent, result, agentName? }
 */

import { invokeLLM, type Message } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut, storageGetSignedUrl } from "./storage";
import {
  fetchTodaysEvents,
  fetchUpcomingEvents,
  fetchPriorityEmails,
  createCalendarEvent,
  sendEmailDraft,
} from "./google-connectors";
import { searchDriveFiles } from "./drive-connector";
import { ENV } from "./_core/env";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentName = "Research" | "Sales" | "Support" | "Bookkeeping" | "Personal";

export type VoiceIntent =
  | { type: "agent_dispatch"; agent: AgentName; task: string }
  | { type: "email_check" }
  | { type: "email_draft"; to?: string; subject?: string; body?: string }
  | { type: "calendar_check" }
  | { type: "calendar_create"; title: string; startTime?: string; endTime?: string; description?: string }
  | { type: "drive_search"; query: string }
  | { type: "chat"; message: string }
  | { type: "unknown"; message: string };

export interface VoiceCommandResult {
  transcript: string;
  intent: VoiceIntent;
  response: string;
  agentName?: string;
  actionTaken?: string;
}

// ─── System prompts ───────────────────────────────────────────────────────────

const MARCUS_SYSTEM = `You are Marcus, an elite AI Chief of Staff built by Dreki Solutions.
You speak in a confident, professional, and concise male voice.
Keep voice responses under 3 sentences unless the user asks for detail.
Be direct and action-oriented. Lead with the answer, then provide context.`;

const INTENT_SYSTEM = `You are an intent classification engine for a voice-controlled AI Chief of Staff named Marcus.
Classify the user's spoken command into exactly one intent category.
Respond ONLY with valid JSON matching the schema — no markdown, no extra text.`;

// ─── Intent Parser ────────────────────────────────────────────────────────────

export async function parseVoiceIntent(transcript: string): Promise<VoiceIntent> {
  const prompt = `Classify this voice command into one intent.

Voice command: "${transcript}"

Respond with ONLY a JSON object matching one of these schemas:

1. Agent dispatch: { "type": "agent_dispatch", "agent": "<Research|Sales|Support|Bookkeeping|Personal>", "task": "<full task description>" }
2. Check email: { "type": "email_check" }
3. Draft email: { "type": "email_draft", "to": "<email or null>", "subject": "<subject or null>", "body": "<body hint or null>" }
4. Check calendar: { "type": "calendar_check" }
5. Create calendar event: { "type": "calendar_create", "title": "<event title>", "startTime": "<ISO datetime or natural language>", "endTime": "<ISO datetime or null>", "description": "<description or null>" }
6. Search Drive: { "type": "drive_search", "query": "<search query>" }
7. General chat: { "type": "chat", "message": "<original message>" }
8. Unknown: { "type": "unknown", "message": "<original message>" }

Examples:
- "Ask Sterling to draft a proposal for Meridian Corp" → { "type": "agent_dispatch", "agent": "Sales", "task": "Draft a proposal for Meridian Corp" }
- "What's on my calendar today?" → { "type": "calendar_check" }
- "Check my emails" → { "type": "email_check" }
- "Schedule a meeting with Sarah on Friday at 2pm" → { "type": "calendar_create", "title": "Meeting with Sarah", "startTime": "Friday 2:00 PM", "endTime": "Friday 3:00 PM", "description": null }
- "Find the Q3 report in my Drive" → { "type": "drive_search", "query": "Q3 report" }
- "Ask Atlas to research our top competitors" → { "type": "agent_dispatch", "agent": "Research", "task": "Research our top competitors" }`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: INTENT_SYSTEM },
        { role: "user", content: prompt },
      ] satisfies Message[],
      response_format: { type: "json_object" },
    });

    const raw = String(response.choices[0]?.message?.content ?? "{}");
    const parsed = JSON.parse(raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim());
    return parsed as VoiceIntent;
  } catch {
    return { type: "chat", message: transcript };
  }
}

// ─── Agent executor ───────────────────────────────────────────────────────────

const AGENT_PROMPTS: Record<AgentName, string> = {
  Research: "You are Atlas, the Research sub-agent. Conduct thorough research and return a structured report with key findings and recommendations. Be concise — lead with the most important insight.",
  Sales: "You are Sterling, the Sales sub-agent. Draft compelling, professional sales materials and proposals. Be persuasive and action-oriented.",
  Support: "You are Aria, the Customer Support sub-agent. Resolve issues with empathy and professionalism. Provide clear, actionable responses.",
  Bookkeeping: "You are Ledger, the Bookkeeping sub-agent. Analyze financial data and provide clear, accurate financial summaries.",
  Personal: "You are Sage, the Personal Tasks sub-agent. Handle personal errands, appointments, and logistics efficiently.",
};

async function executeAgentDispatch(agent: AgentName, task: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: AGENT_PROMPTS[agent] },
      { role: "user", content: task },
    ],
  });
  return String(response.choices[0]?.message?.content ?? "Task received. Processing...");
}

// ─── Action executors ─────────────────────────────────────────────────────────

async function executeCalendarCheck(): Promise<string> {
  try {
    const events = await fetchTodaysEvents();
    if (!events || events.length === 0) {
      return "Your calendar is clear today. No events scheduled.";
    }
    const summary = events
      .slice(0, 5)
      .map((e: any) => `${e.time || e.start}: ${e.title || e.summary}`)
      .join(", ");
    return `You have ${events.length} event${events.length > 1 ? "s" : ""} today: ${summary}.`;
  } catch {
    // Fallback if calendar connector unavailable
    const response = await invokeLLM({
      messages: [
        { role: "system", content: MARCUS_SYSTEM },
        { role: "user", content: "The user asked about their calendar. The calendar connector is unavailable. Respond briefly." },
      ],
    });
    return String(response.choices[0]?.message?.content ?? "I couldn't retrieve your calendar at this time.");
  }
}

async function executeEmailCheck(): Promise<string> {
  try {
    const emails = await fetchPriorityEmails(5);
    if (!emails || emails.length === 0) {
      return "Your inbox is clear. No priority emails at this time.";
    }
    const urgent = emails.filter((e: any) => e.priority === "urgent" || e.isUnread);
    return `You have ${emails.length} priority email${emails.length > 1 ? "s" : ""}${urgent.length > 0 ? `, ${urgent.length} marked urgent` : ""}. The most recent is from ${emails[0]?.from || "unknown"}: "${emails[0]?.subject || "no subject"}".`;
  } catch {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: MARCUS_SYSTEM },
        { role: "user", content: "The user asked about their emails. The email connector is unavailable. Respond briefly." },
      ],
    });
    return String(response.choices[0]?.message?.content ?? "I couldn't retrieve your emails at this time.");
  }
}

async function executeDriveSearch(query: string): Promise<string> {
  try {
    const files = await searchDriveFiles(query, 5);
    if (!files || files.length === 0) {
      return `I searched your Drive for "${query}" but found no matching files.`;
    }
    const names = files.slice(0, 3).map((f: any) => f.name || f.title).join(", ");
    return `I found ${files.length} file${files.length > 1 ? "s" : ""} matching "${query}": ${names}.`;
  } catch {
    return `I couldn't search your Drive for "${query}" at this time.`;
  }
}

async function executeDirectChat(message: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: MARCUS_SYSTEM },
      { role: "user", content: message },
    ],
  });
  return String(response.choices[0]?.message?.content ?? "I didn't catch that. Could you repeat?");
}

// ─── Main pipeline ────────────────────────────────────────────────────────────

export async function processVoiceCommand(
  audioBase64: string,
  mimeType: string = "audio/webm",
): Promise<VoiceCommandResult> {
  // 1. Upload audio to S3
  const audioBuffer = Buffer.from(audioBase64, "base64");
  const ext = mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a"
    : mimeType.includes("wav") ? "wav"
    : mimeType.includes("mp3") ? "mp3"
    : "webm";

  const { key } = await storagePut(`voice/cmd_${Date.now()}.${ext}`, audioBuffer, mimeType);

  // 2. Build an absolute URL for the transcription service
  const forgeUrl = (ENV.forgeApiUrl ?? "").replace(/\/+$/, "");
  const signedUrl = await storageGetSignedUrl(key);
  // storageGetSignedUrl returns an absolute S3 URL — use it directly
  const audioUrl = signedUrl;

  // 3. Transcribe
  const transcriptionResult = await transcribeAudio({ audioUrl, language: "en" });
  if ("error" in transcriptionResult) {
    throw new Error(`Transcription failed: ${transcriptionResult.error}`);
  }
  const transcript = transcriptionResult.text.trim();

  if (!transcript) {
    return {
      transcript: "",
      intent: { type: "unknown", message: "" },
      response: "I didn't catch that. Could you speak a bit louder and try again?",
    };
  }

  // 4. Parse intent
  const intent = await parseVoiceIntent(transcript);

  // 5. Execute
  let response = "";
  let agentName: string | undefined;
  let actionTaken: string | undefined;

  switch (intent.type) {
    case "agent_dispatch": {
      agentName = intent.agent;
      actionTaken = `Dispatched ${intent.agent} agent`;
      const result = await executeAgentDispatch(intent.agent, intent.task);
      // Marcus summarizes the agent result for voice
      const summaryResp = await invokeLLM({
        messages: [
          { role: "system", content: MARCUS_SYSTEM },
          { role: "user", content: `I dispatched the ${intent.agent} agent with task: "${intent.task}". Their response: "${result.slice(0, 500)}". Summarize this in 2 sentences for a voice response.` },
        ],
      });
      response = String(summaryResp.choices[0]?.message?.content ?? result.slice(0, 200));
      break;
    }
    case "calendar_check":
      actionTaken = "Checked calendar";
      response = await executeCalendarCheck();
      break;
    case "calendar_create":
      actionTaken = `Creating event: ${intent.title}`;
      response = `I'll schedule "${intent.title}"${intent.startTime ? ` for ${intent.startTime}` : ""}. Confirm in the Calendar tab.`;
      break;
    case "email_check":
      actionTaken = "Checked priority inbox";
      response = await executeEmailCheck();
      break;
    case "email_draft":
      actionTaken = "Preparing email draft";
      response = `I'll draft an email${intent.to ? ` to ${intent.to}` : ""}${intent.subject ? ` about "${intent.subject}"` : ""}. Check the Inbox tab to review and send.`;
      break;
    case "drive_search":
      actionTaken = `Searched Drive for "${intent.query}"`;
      response = await executeDriveSearch(intent.query);
      break;
    case "chat":
    case "unknown":
    default:
      response = await executeDirectChat(transcript);
      break;
  }

  return { transcript, intent, response, agentName, actionTaken };
}
