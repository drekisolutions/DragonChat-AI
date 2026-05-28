import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM, type Message } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";
import { processVoiceCommand } from "./voice-command";
import {
  fetchPriorityEmails,
  searchEmails,
  readEmailThread,
  sendEmailDraft,
  fetchTodaysEvents,
  fetchUpcomingEvents,
  createCalendarEvent,
  deleteCalendarEvent,
} from "./google-connectors";
import {
  listRecentFiles,
  searchDriveFiles,
  readDriveFileContent,
} from "./drive-connector";
import { synthesizeSpeech, CHIRP3_MALE_VOICES } from "./tts";

// ─── Marcus System Prompt ─────────────────────────────────────────────────────
const MARCUS_SYSTEM_PROMPT = `You are Marcus, an elite AI Chief of Staff built by Dreki Solutions.
You speak in a confident, professional, and concise male voice. You address the user as "sir" or by their name when known.
Your responsibilities include:
- Managing email: reading, prioritising, drafting, and sending on behalf of the user
- Managing calendar: scheduling, rescheduling, accepting/declining events
- Managing business calls: screening, transcribing, summarising, and generating follow-up action items
- Orchestrating sub-agents: Research, Sales, Customer Support, Bookkeeping, and Personal Tasks
- Accessing and searching files on Google Drive
- Operating autonomously within the user's defined rules, escalating only when required

When responding:
- Be direct and action-oriented. Lead with the answer, then provide context.
- Use structured output (bullet points, numbered lists) for multi-part answers.
- Always confirm actions before executing them unless the user's rules say otherwise.
- If you need clarification, ask one focused question.
- Keep voice responses under 3 sentences unless the user asks for detail.`;

// ─── Routers ──────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Marcus Core Chat ────────────────────────────────────────────────────────
  marcus: router({
    /**
     * Main conversational endpoint — accepts a message and optional context,
     * returns Marcus's response and any extracted action items.
     */
    chat: publicProcedure
      .input(
        z.object({
          message: z.string().min(1).max(4000),
          context: z.string().max(500).optional(), // e.g. "email draft", "calendar event"
          conversationHistory: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string().max(4000),
              })
            )
            .max(20) // Cap conversation history at 20 turns to prevent token exhaustion
            .optional()
            .default([]),
        })
      )
      .mutation(async ({ input }) => {
        const messages: Message[] = [
          { role: "system", content: MARCUS_SYSTEM_PROMPT },
          ...input.conversationHistory.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          } satisfies Message)),
          { role: "user", content: input.message },
        ];

        const response = await invokeLLM({ messages });
        const reply = response.choices[0]?.message?.content ?? "I'm sorry, I didn't catch that.";

        return {
          reply,
          timestamp: new Date().toISOString(),
        };
      }),

    /**
     * Daily briefing — generates a structured morning summary.
     */
    dailyBriefing: publicProcedure
      .input(
        z.object({
          emailCount: z.number().default(0),
          urgentCount: z.number().default(0),
          eventCount: z.number().default(0),
          agentUpdates: z.array(z.string()).default([]),
        })
      )
      .mutation(async ({ input }) => {
        const prompt = `Generate a concise daily briefing for the user. 
Data: ${input.urgentCount} urgent emails out of ${input.emailCount} total, ${input.eventCount} calendar events today.
Agent updates: ${input.agentUpdates.join("; ") || "None"}.
Keep it under 60 words. Be direct and professional. Start with the most important item.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: MARCUS_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        });

        return {
          briefing: response.choices[0]?.message?.content ?? "Good morning. No critical items at this time.",
          timestamp: new Date().toISOString(),
        };
      }),

    /**
     * Email drafting — takes context and generates a professional reply.
     */
    draftEmail: publicProcedure
      .input(
        z.object({
          originalEmail: z.string(),
          instruction: z.string().optional().default("Draft a professional reply"),
          tone: z.enum(["formal", "friendly", "direct"]).default("formal"),
        })
      )
      .mutation(async ({ input }) => {
        const prompt = `Draft an email reply. Tone: ${input.tone}.
Original email:
${input.originalEmail}

Instruction: ${input.instruction}

Return only the email body text, no subject line, no greeting prefix.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: MARCUS_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        });

        return {
          draft: response.choices[0]?.message?.content ?? "",
          timestamp: new Date().toISOString(),
        };
      }),

    /**
     * Call summary — takes a transcript and returns a structured summary with action items.
     */
    summarizeCall: publicProcedure
      .input(
        z.object({
          transcript: z.string().min(1),
          participants: z.array(z.string()).optional().default([]),
          duration: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const prompt = `Analyze this call transcript and return a JSON object with:
- summary: 2-3 sentence summary of the call
- actionItems: array of specific action items with owner and deadline if mentioned
- sentiment: overall tone (positive/neutral/negative)
- nextSteps: recommended follow-up actions

Participants: ${input.participants.join(", ") || "Unknown"}
Duration: ${input.duration || "Unknown"}

Transcript:
${input.transcript}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: MARCUS_SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ] satisfies Message[],
          response_format: { type: "json_object" },
        });

        let result: { summary: string; actionItems: string[]; sentiment: string; nextSteps: string[] };
        try {
          result = JSON.parse(String(response.choices[0]?.message?.content ?? "{}"));
        } catch {
          result = {
            summary: String(response.choices[0]?.message?.content ?? ""),
            actionItems: [],
            sentiment: "neutral",
            nextSteps: [],
          };
        }

        return { ...result, timestamp: new Date().toISOString() };
      }),

    /**
     * Agent dispatch — sends a task brief to a named sub-agent via LLM.
     */
    dispatchAgent: publicProcedure
      .input(
        z.object({
          agentName: z.enum(["Research", "Sales", "Support", "Bookkeeping", "Personal"]),
          taskBrief: z.string().min(1).max(2000),
          priority: z.enum(["low", "normal", "urgent"]).default("normal"),
        })
      )
      .mutation(async ({ input }) => {
        const agentPrompts: Record<string, string> = {
          Research: "You are the Research sub-agent. Conduct thorough research and return a structured report with key findings, sources, and recommendations.",
          Sales: "You are the Sales sub-agent. Draft compelling, professional sales materials, proposals, and follow-up communications.",
          Support: "You are the Customer Support sub-agent. Resolve customer issues with empathy and professionalism. Provide clear, actionable responses.",
          Bookkeeping: "You are the Bookkeeping sub-agent. Analyze financial data, track transactions, and provide clear financial summaries.",
          Personal: "You are the Personal Tasks sub-agent. Handle personal errands, appointments, and logistics efficiently.",
        };

        const response = await invokeLLM({
          messages: [
            { role: "system", content: agentPrompts[input.agentName] ?? MARCUS_SYSTEM_PROMPT },
            { role: "user", content: `Priority: ${input.priority}\n\nTask: ${input.taskBrief}` },
          ],
        });

        return {
          agentName: input.agentName,
          result: response.choices[0]?.message?.content ?? "Task received. Processing...",
          status: "completed" as const,
          timestamp: new Date().toISOString(),
        };
      }),

    /**
     * Voice transcription — accepts a public audio URL and returns the transcript.
     */
    transcribeVoice: publicProcedure
      .input(
        z.object({
          audioUrl: z.string().url(),
          language: z.string().optional().default("en"),
          context: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language,
          prompt: input.context,
        });

        if ("error" in result) {
          throw new Error(result.error);
        }

        return {
          transcript: result.text,
          language: result.language,
          timestamp: new Date().toISOString(),
        };
      }),

    /**
     * End-to-end voice command pipeline — audio → transcribe → intent → execute → response.
     * Client sends base64 audio; server returns transcript, parsed intent, and Marcus's response.
     */
    processVoice: publicProcedure
      .input(
        z.object({
          audioBase64: z.string().min(1),
          mimeType: z.string().max(50).optional().default("audio/webm"),
        })
      )
      .mutation(async ({ input }) => {
        return processVoiceCommand(input.audioBase64, input.mimeType);
      }),

    /**
     * Rule evaluation — checks if an action is permitted under the user's autonomy rules.
     */
    evaluateRule: publicProcedure
      .input(
        z.object({
          action: z.string(),
          domain: z.enum(["Email", "Calendar", "Agents", "Files", "Calls"]),
          context: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const prompt = `You are evaluating whether an autonomous action is permitted.
Domain: ${input.domain}
Action: ${input.action}
Context: ${input.context ?? "None"}

Respond with JSON: { "permitted": boolean, "reason": string, "requiresConfirmation": boolean }
Base your decision on standard business best practices and data privacy principles.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a strict policy evaluation engine." },
            { role: "user", content: prompt },
          ] satisfies Message[],
          response_format: { type: "json_object" },
        });

        let result: { permitted: boolean; reason: string; requiresConfirmation: boolean };
        try {
          result = JSON.parse(String(response.choices[0]?.message?.content ?? "{}"));
        } catch {
          result = { permitted: false, reason: "Could not evaluate rule.", requiresConfirmation: true };
        }

        return { ...result, timestamp: new Date().toISOString() };
      }),
  }),

  // ── Google: Gmail (inside appRouter) ──────────────────────────────────────────────────────────
  gmail: router({
    priorityInbox: publicProcedure
      .input(z.object({ maxResults: z.number().min(1).max(50).optional().default(20) }))
      .query(async ({ input }) => {
        return fetchPriorityEmails(input.maxResults);
      }),

    search: publicProcedure
      .input(z.object({ query: z.string().min(1).max(200), maxResults: z.number().min(1).max(50).optional().default(10) }))
      .query(async ({ input }) => {
        return searchEmails(input.query, input.maxResults);
      }),

    readThread: publicProcedure
      .input(z.object({ threadId: z.string().min(1) }))
      .query(async ({ input }) => {
        return readEmailThread(input.threadId);
      }),

    saveDraft: publicProcedure
      .input(z.object({
        to: z.string().email(),
        subject: z.string().min(1),
        body: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return sendEmailDraft(input);
      }),
  }),

  // ── Google: Calendar ────────────────────────────────────────────────────────
  calendar: router({
    today: publicProcedure.query(async () => {
      return fetchTodaysEvents();
    }),

    upcoming: publicProcedure
      .input(z.object({ days: z.number().optional().default(7) }))
      .query(async ({ input }) => {
        return fetchUpcomingEvents(input.days);
      }),

    createEvent: publicProcedure
      .input(z.object({
        title: z.string().min(1),
        startTime: z.string().min(1),
        endTime: z.string().min(1),
        description: z.string().optional(),
        location: z.string().optional(),
        attendees: z.array(z.string().email()).optional(),
      }))
      .mutation(async ({ input }) => {
        return createCalendarEvent(input);
      }),

    deleteEvent: publicProcedure
      .input(z.object({ eventId: z.string().min(1) }))
      .mutation(async ({ input }) => {
        return deleteCalendarEvent(input.eventId);
      }),
  }),

  // ── Red Team Adversarial Analysis ─────────────────────────────────────────
  redTeam: router({
    analyze: publicProcedure
      .input(z.object({
        proposal: z.string().min(10).max(3000),
      }))
      .mutation(async ({ input }) => {
        const { proposal } = input;

        const RED_TEAM_SYSTEM = `You are MARCUS RED TEAM — an elite adversarial intelligence agent built by Dreki Solutions.
Your role is to stress-test business strategies, proposals, and plans by attacking them ruthlessly from every angle.
You are not a cheerleader. You are a strategic adversary. Be specific, brutal, and actionable.
Always respond in valid JSON matching the exact schema requested.`;

        // Run the full adversarial analysis in a single LLM call for efficiency
        const prompt = `Analyze the following business proposal from an adversarial red team perspective.

PROPOSAL:
${proposal}

Respond ONLY with a valid JSON object matching this exact schema (no markdown, no extra text):
{
  "devilsAdvocate": "<3-5 sentences arguing strongly AGAINST this proposal — expose its core weaknesses, faulty assumptions, and why it will fail>",
  "competitorIntelligence": "<3-5 sentences describing exactly how a well-funded competitor would counter this strategy, undercut it, or exploit its gaps>",
  "riskMatrix": "<3-5 sentences covering the top financial, operational, legal, and reputational risks — be specific with realistic scenarios>",
  "blindSpots": "<3-5 sentences identifying what the proposer has NOT considered — market timing, customer behavior, regulatory shifts, technology disruption, team capability gaps>",
  "verdict": "<2-3 sentences summarizing the overall resilience of this proposal and what must change for it to succeed>",
  "resilienceScore": <integer 0-100 where 0 = catastrophic failure certain, 100 = bulletproof strategy>,
  "recommendation": "<exactly one of: GO, NO-GO, CONDITIONAL>"
}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: RED_TEAM_SYSTEM },
            { role: "user", content: prompt },
          ] satisfies Message[],
        });

        const raw = String(response.choices[0]?.message?.content ?? "{}");

        // Strip markdown code fences if present
        const cleaned = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

        let parsed: any;
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          // Fallback if LLM returns malformed JSON
          return {
            devilsAdvocate: "Analysis could not be parsed. Please try again.",
            competitorIntelligence: "N/A",
            riskMatrix: "N/A",
            blindSpots: "N/A",
            verdict: "Marcus Red Team encountered a parsing error.",
            resilienceScore: 0,
            recommendation: "CONDITIONAL" as const,
          };
        }

        return {
          devilsAdvocate: String(parsed.devilsAdvocate ?? ""),
          competitorIntelligence: String(parsed.competitorIntelligence ?? ""),
          riskMatrix: String(parsed.riskMatrix ?? ""),
          blindSpots: String(parsed.blindSpots ?? ""),
          verdict: String(parsed.verdict ?? ""),
          resilienceScore: Math.min(100, Math.max(0, Number(parsed.resilienceScore ?? 50))),
          recommendation: (["GO", "NO-GO", "CONDITIONAL"].includes(parsed.recommendation)
            ? parsed.recommendation
            : "CONDITIONAL") as "GO" | "NO-GO" | "CONDITIONAL",
        };
      }),
  }),

  // ── Google: Drive ────────────────────────────────────────────────────────
  drive: router({
    recent: publicProcedure
      .input(z.object({ maxResults: z.number().min(1).max(50).optional().default(20) }))
      .query(async ({ input }) => {
        return listRecentFiles(input.maxResults);
      }),

    search: publicProcedure
      .input(z.object({ query: z.string().min(1).max(200), maxResults: z.number().min(1).max(50).optional().default(20) }))
      .query(async ({ input }) => {
        return searchDriveFiles(input.query, input.maxResults);
      }),

    summarize: publicProcedure
      .input(z.object({
        fileId: z.string().min(1).max(200).regex(/^[a-zA-Z0-9_\-]+$/),
        fileName: z.string().min(1).max(500),
        mimeType: z.string().min(1).max(100),
      }))
      .mutation(async ({ input }) => {
        // Read file content
        const content = await readDriveFileContent(input.fileId, input.mimeType);

        if (!content) {
          return {
            summary: "Marcus cannot read this file type directly. Open it in Google Drive to view the content.",
            fileId: input.fileId,
          };
        }

        // Summarize with LLM
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: MARCUS_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: `Please summarize the following document titled "${input.fileName}". Be concise and highlight the key points, decisions, or action items.\n\n---\n${content}`,
            },
          ] satisfies Message[],
        });

        const summary = String(response.choices[0]?.message?.content ?? "Marcus could not generate a summary.");
        return { summary, fileId: input.fileId };
      }),
  }),
  // ── Text-to-Speech (Google Cloud Chirp 3 HD) ────────────────────────────────
  tts: router({
    /**
     * Synthesize text to MP3 audio using Google Cloud TTS Chirp 3 HD.
     * Returns base64-encoded MP3 audio and the voice used.
     * Falls back gracefully — returns null audioBase64 if TTS unavailable.
     */
    synthesize: publicProcedure
      .input(
        z.object({
          text: z.string().min(1).max(4800),
          voiceName: z.string().max(60).optional(),
          speakingRate: z.number().min(0.25).max(4.0).optional(),
          pitch: z.number().min(-20).max(20).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const audioBase64 = await synthesizeSpeech(input.text, {
          voiceName: input.voiceName,
          speakingRate: input.speakingRate,
          pitch: input.pitch,
        });
        return {
          audioBase64,
          voiceName: input.voiceName ?? "en-US-Chirp3-HD-Charon",
          available: audioBase64 !== null,
        };
      }),

    /** Return the list of available Chirp 3 HD male voices for the settings picker */
    listVoices: publicProcedure.query(() => {
      return { voices: CHIRP3_MALE_VOICES };
    }),
  }),
});
export type AppRouter = typeof appRouter;
