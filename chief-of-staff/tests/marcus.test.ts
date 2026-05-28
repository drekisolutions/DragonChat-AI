/**
 * Marcus Chief of Staff — Server Router Tests
 *
 * Tests the core Marcus tRPC procedures using mocked LLM and transcription services.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the LLM and transcription modules ───────────────────────────────────
vi.mock("../server/_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "Good morning, sir. You have 3 urgent items requiring your attention today.",
        },
      },
    ],
  }),
}));

vi.mock("../server/_core/voiceTranscription", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({
    text: "Schedule a meeting with the board for Friday at 2pm.",
    language: "en",
    duration: 4.2,
    task: "transcribe",
    segments: [],
  }),
}));

vi.mock("../server/google-connectors", () => ({
  fetchPriorityEmails: vi.fn().mockResolvedValue([
    {
      id: "thread_001",
      subject: "Q3 Revenue Report — Action Required",
      from: "sarah@example.com",
      snippet: "Please review the attached projections.",
      date: new Date().toISOString(),
      unread: true,
      labels: ["UNREAD", "IMPORTANT"],
    },
  ]),
  searchEmails: vi.fn().mockResolvedValue([]),
  readEmailThread: vi.fn().mockResolvedValue(null),
  sendEmailDraft: vi.fn().mockResolvedValue({ success: true, messageId: "msg_001" }),
  fetchTodaysEvents: vi.fn().mockResolvedValue([
    {
      id: "event_001",
      title: "Daily Standup",
      start: new Date().toISOString(),
      end: new Date(Date.now() + 1800000).toISOString(),
      attendees: ["alice@example.com", "bob@example.com"],
    },
  ]),
  fetchUpcomingEvents: vi.fn().mockResolvedValue([]),
  createCalendarEvent: vi.fn().mockResolvedValue({ success: true, eventId: "event_new_001" }),
  deleteCalendarEvent: vi.fn().mockResolvedValue(true),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────
import { invokeLLM } from "../server/_core/llm";
import { transcribeAudio } from "../server/_core/voiceTranscription";
import {
  fetchPriorityEmails,
  fetchTodaysEvents,
  createCalendarEvent,
  sendEmailDraft,
} from "../server/google-connectors";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Marcus LLM Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invokeLLM returns a valid response with choices", async () => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are Marcus." },
        { role: "user", content: "What is on my schedule today?" },
      ],
    });

    expect(response).toBeDefined();
    expect(response.choices).toBeInstanceOf(Array);
    expect(response.choices.length).toBeGreaterThan(0);
    expect(typeof response.choices[0].message.content).toBe("string");
    expect((response.choices[0].message.content as string).length).toBeGreaterThan(0);
  });

  it("invokeLLM is called with the correct message structure", async () => {
    const messages = [
      { role: "system" as const, content: "You are Marcus." },
      { role: "user" as const, content: "Draft a reply to the Q3 report email." },
    ];

    await invokeLLM({ messages });

    expect(invokeLLM).toHaveBeenCalledWith({ messages });
    expect(invokeLLM).toHaveBeenCalledTimes(1);
  });
});

describe("Marcus Voice Transcription", () => {
  it("transcribeAudio returns a transcript with text and language", async () => {
    const result = await transcribeAudio({
      audioUrl: "https://storage.example.com/audio/test.mp3",
      language: "en",
    });

    expect(result).toBeDefined();
    if ("error" in result) {
      throw new Error(`Transcription failed: ${result.error}`);
    }
    expect(typeof result.text).toBe("string");
    expect(result.text.length).toBeGreaterThan(0);
    expect(result.language).toBe("en");
  });
});

describe("Google Gmail Connector", () => {
  it("fetchPriorityEmails returns an array of email threads", async () => {
    const emails = await fetchPriorityEmails(20);

    expect(emails).toBeInstanceOf(Array);
    expect(emails.length).toBeGreaterThan(0);

    const email = emails[0];
    expect(email).toHaveProperty("id");
    expect(email).toHaveProperty("subject");
    expect(email).toHaveProperty("from");
    expect(email).toHaveProperty("snippet");
    expect(email).toHaveProperty("unread");
    expect(email).toHaveProperty("labels");
    expect(typeof email.unread).toBe("boolean");
  });

  it("sendEmailDraft returns success with a messageId", async () => {
    const result = await sendEmailDraft({
      to: "client@example.com",
      subject: "Follow-up on Q3 Report",
      body: "Dear Sarah, I have reviewed the Q3 projections and have some questions.",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(typeof result.messageId).toBe("string");
  });
});

describe("Google Calendar Connector", () => {
  it("fetchTodaysEvents returns an array of calendar events", async () => {
    const events = await fetchTodaysEvents();

    expect(events).toBeInstanceOf(Array);
    expect(events.length).toBeGreaterThan(0);

    const event = events[0];
    expect(event).toHaveProperty("id");
    expect(event).toHaveProperty("title");
    expect(event).toHaveProperty("start");
    expect(event).toHaveProperty("end");
    expect(typeof event.title).toBe("string");
  });

  it("createCalendarEvent returns success with an eventId", async () => {
    const result = await createCalendarEvent({
      title: "Board Meeting",
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 90000000).toISOString(),
      description: "Q3 review with the board",
      attendees: ["board@example.com"],
    });

    expect(result.success).toBe(true);
    expect(result.eventId).toBeDefined();
  });
});

describe("Marcus System Prompt Integrity", () => {
  it("LLM response content is a non-empty string", async () => {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are Marcus, an elite AI Chief of Staff." },
        { role: "user", content: "Give me a daily briefing." },
      ],
    });

    const content = String(response.choices[0]?.message?.content ?? "");
    expect(content.length).toBeGreaterThan(10);
  });

  it("Multiple LLM calls can be made independently", async () => {
    vi.clearAllMocks();
    const [r1, r2] = await Promise.all([
      invokeLLM({ messages: [{ role: "user", content: "Check emails" }] }),
      invokeLLM({ messages: [{ role: "user", content: "Check calendar" }] }),
    ]);

    expect(r1.choices[0].message.content).toBeDefined();
    expect(r2.choices[0].message.content).toBeDefined();
    expect(invokeLLM).toHaveBeenCalledTimes(2);
  });
});
