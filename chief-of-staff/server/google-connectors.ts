/**
 * Google Connector Bridge
 *
 * This module provides server-side helpers that call the Gmail and Google Calendar
 * MCP connectors via the Manus Runtime API. All calls are made from the server to
 * keep credentials secure and to allow Marcus to act autonomously.
 *
 * The Manus Runtime exposes connector calls via an internal HTTP API that is
 * available to server-side code. We call it using the BUILT_IN_RUNTIME_API_URL
 * environment variable.
 */

import { ENV } from "./_core/env";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailThread {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  unread: boolean;
  labels: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  attendees?: string[];
}

// ─── Runtime Connector Call ───────────────────────────────────────────────────

/**
 * Call a Manus MCP connector tool via the runtime API.
 * Returns null if the connector is unavailable or the call fails.
 */
async function callConnector(
  server: string,
  tool: string,
  args: Record<string, unknown>
): Promise<any> {
  const runtimeUrl = (ENV as any).runtimeApiUrl ?? process.env.BUILT_IN_RUNTIME_API_URL;
  const runtimeKey = (ENV as any).runtimeApiKey ?? process.env.BUILT_IN_RUNTIME_API_KEY;

  if (!runtimeUrl || !runtimeKey) {
    // Runtime not available — return null gracefully
    return null;
  }

  try {
    const response = await fetch(`${runtimeUrl}/v1/connector/call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${runtimeKey}`,
      },
      body: JSON.stringify({ server, tool, arguments: args }),
    });

    if (!response.ok) {
      console.warn(`[Marcus] Connector call ${server}/${tool} failed: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.warn(`[Marcus] Connector call ${server}/${tool} error:`, err);
    return null;
  }
}

// ─── Gmail Helpers ────────────────────────────────────────────────────────────

export async function fetchPriorityEmails(maxResults = 20): Promise<EmailThread[]> {
  const result = await callConnector("gmail", "gmail_search_messages", {
    q: "is:unread OR is:important",
    max_results: maxResults,
  });

  if (!result?.messages) return [];

  return result.messages.map((msg: any) => ({
    id: msg.id ?? "",
    subject: msg.subject ?? "(No Subject)",
    from: msg.from ?? "Unknown",
    snippet: msg.snippet ?? "",
    date: msg.date ?? new Date().toISOString(),
    unread: msg.labelIds?.includes("UNREAD") ?? false,
    labels: msg.labelIds ?? [],
  }));
}

export async function searchEmails(query: string, maxResults = 10): Promise<EmailThread[]> {
  const result = await callConnector("gmail", "gmail_search_messages", {
    q: query,
    max_results: maxResults,
  });

  if (!result?.messages) return [];

  return result.messages.map((msg: any) => ({
    id: msg.id ?? "",
    subject: msg.subject ?? "(No Subject)",
    from: msg.from ?? "Unknown",
    snippet: msg.snippet ?? "",
    date: msg.date ?? new Date().toISOString(),
    unread: msg.labelIds?.includes("UNREAD") ?? false,
    labels: msg.labelIds ?? [],
  }));
}

export async function readEmailThread(threadId: string): Promise<any> {
  const result = await callConnector("gmail", "gmail_read_threads", {
    thread_ids: [threadId],
    include_full_messages: true,
  });
  return result?.threads?.[0] ?? null;
}

export async function sendEmailDraft(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ success: boolean; messageId?: string }> {
  const result = await callConnector("gmail", "gmail_send_messages", {
    messages: [
      {
        to: [params.to],
        subject: params.subject,
        body: params.body,
        save_as_draft: true,
      },
    ],
  });
  return { success: !!result, messageId: result?.messages?.[0]?.id };
}

// ─── Google Calendar Helpers ──────────────────────────────────────────────────

export async function fetchTodaysEvents(): Promise<CalendarEvent[]> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const result = await callConnector("google-calendar", "google_calendar_search_events", {
    calendar_id: "primary",
    time_min: startOfDay.toISOString(),
    time_max: endOfDay.toISOString(),
    max_results: 20,
  });

  if (!result?.events) return [];

  return result.events.map((event: any) => ({
    id: event.id ?? "",
    title: event.summary ?? "Untitled Event",
    start: event.start?.dateTime ?? event.start?.date ?? "",
    end: event.end?.dateTime ?? event.end?.date ?? "",
    location: event.location,
    description: event.description,
    attendees: event.attendees?.map((a: any) => a.email) ?? [],
  }));
}

export async function fetchUpcomingEvents(days = 7): Promise<CalendarEvent[]> {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const result = await callConnector("google-calendar", "google_calendar_search_events", {
    calendar_id: "primary",
    time_min: now.toISOString(),
    time_max: future.toISOString(),
    max_results: 50,
  });

  if (!result?.events) return [];

  return result.events.map((event: any) => ({
    id: event.id ?? "",
    title: event.summary ?? "Untitled Event",
    start: event.start?.dateTime ?? event.start?.date ?? "",
    end: event.end?.dateTime ?? event.end?.date ?? "",
    location: event.location,
    description: event.description,
    attendees: event.attendees?.map((a: any) => a.email) ?? [],
  }));
}

export async function createCalendarEvent(params: {
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  attendees?: string[];
}): Promise<{ success: boolean; eventId?: string }> {
  const result = await callConnector("google-calendar", "google_calendar_create_events", {
    events: [
      {
        calendar_id: "primary",
        summary: params.title,
        start_time: params.startTime,
        end_time: params.endTime,
        description: params.description,
        location: params.location,
        attendees: params.attendees?.map((email) => ({ email })),
      },
    ],
  });
  return { success: !!result, eventId: result?.events?.[0]?.id };
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const result = await callConnector("google-calendar", "google_calendar_delete_events", {
    event_id: eventId,
    calendar_id: "primary",
  });
  return !!result;
}
