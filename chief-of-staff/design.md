# Chief of Staff Agent — Design Document

## Brand Identity

This application follows the Dreki Solutions elite aesthetic: matte black backgrounds, matte bronze accents, and matte silver secondary surfaces. Typography is clean and authoritative. The interface must feel like a premium executive tool, not a consumer app.

| Token | Light | Dark |
|---|---|---|
| background | #0A0A0A | #0A0A0A |
| surface | #1A1A1A | #1A1A1A |
| primary (bronze) | #8B6914 | #C9922A |
| accent (silver) | #9E9E9E | #C0C0C0 |
| foreground | #F0EDE8 | #F0EDE8 |
| muted | #6B6B6B | #7A7A7A |
| border | #2A2A2A | #2A2A2A |
| success | #2E7D32 | #4CAF50 |
| warning | #E65100 | #FF9800 |
| error | #B71C1C | #EF5350 |

## App Name

**MARCUS** — the Chief of Staff. The name is an acronym for **M**anaged **A**gent for **R**esearch, **C**ommunications, and **U**nified **S**upport. Marcus speaks in a deep, authoritative male voice.

## Screen List

| Screen | Route | Purpose |
|---|---|---|
| Wake / Listen | `/` (index) | Idle state with wake word indicator, voice wave animation, and always-on mic button |
| Command Center | `/(tabs)/home` | Executive briefing: unread emails, today's calendar, pending tasks, active agents |
| Inbox | `/(tabs)/inbox` | Gmail thread list with smart priority labels and quick-reply actions |
| Calendar | `/(tabs)/calendar` | Day/week view of Google Calendar events with create/edit/delete |
| Agents | `/(tabs)/agents` | Sub-agent roster: Research, Sales, Support, Bookkeeping, Personal |
| Rules | `/rules` | Autonomy rules engine: define what Marcus can do without asking |
| Call Log | `/calls` | Business call history with transcripts and follow-up actions |
| File Browser | `/files` | Google Drive file search and preview |
| Settings | `/settings` | Voice, wake word, notification preferences, API key management |

## Primary Content and Functionality

### Wake / Listen Screen
The primary idle state. Displays the MARCUS wordmark in matte bronze over a matte black background. A subtle animated waveform pulses to indicate the microphone is listening. The wake word is "Hey Marcus." When triggered, the waveform expands and Marcus speaks a greeting. A manual mic button allows push-to-talk from the computer interface.

### Command Center (Home)
The executive briefing hub. Shows:
- A greeting card with time, date, and a one-line AI-generated daily briefing
- An email summary card: unread count, top 3 priority emails
- A calendar card: next 3 events with time and attendee count
- An active agents card: which sub-agents are currently running tasks
- A quick-action row: Compose Email, Schedule Meeting, Delegate Task, Call Summary

### Inbox
A prioritized Gmail thread list. Each thread shows sender, subject, preview, time, and a priority badge (Urgent, Action Required, FYI, Low). Swipe left to archive, swipe right to delegate to a sub-agent. Tapping opens the full thread with a reply composer and a "Let Marcus Draft" button.

### Calendar
A scrollable day view with hourly slots. Events are color-coded by type (meeting = bronze, personal = silver, deadline = amber). Tapping an event opens a detail sheet with attendees, location, description, and action buttons (Reschedule, Cancel, Add Notes). A floating "+" button creates new events via voice or form.

### Agents
A card-based roster of five specialized sub-agents. Each card shows the agent's name, role, current status (Idle / Running / Needs Input), and last action summary. Tapping opens the agent's task history and a "Dispatch Task" button. Agents: Research, Sales, Customer Support, Bookkeeping, Personal.

### Rules
A list of autonomy rules organized by domain (Email, Calendar, Files, Agents, Calls). Each rule has a toggle, a condition description, and an action description. Example: "If email is from a known contact and subject contains 'invoice', forward to Bookkeeping Agent." A "Add Rule" button opens a natural-language rule builder.

### Call Log
A chronological list of business calls. Each entry shows caller/callee, duration, date, and a transcript badge. Tapping opens the full transcript with AI-generated summary, action items, and a "Create Follow-Up" button.

### File Browser
A Google Drive search interface. Shows recent files and a search bar. Results display file name, type icon, last modified date, and owner. Tapping opens a preview or triggers Marcus to summarize the document.

### Settings
Organized into sections: Voice (wake word phrase, voice speed, volume), Notifications (briefing time, call alerts), Integrations (Manus API key, Google account status), and About.

## Key User Flows

### Wake Word → Voice Command
1. App is open on phone or computer in background/foreground
2. User says "Hey Marcus"
3. Waveform expands, Marcus plays a brief chime and says "Yes?"
4. User speaks a command: "What's on my calendar today?"
5. Marcus reads the next 3 events aloud and displays them on screen
6. Marcus returns to idle listening state

### Email Delegation
1. User opens Inbox
2. User swipes right on a thread or says "Hey Marcus, handle the email from John about the contract"
3. Marcus identifies the thread, determines the appropriate sub-agent (Sales or Support)
4. Marcus drafts a response or delegates to the agent, showing a confirmation card
5. User approves or edits before sending (if rule requires approval for that sender/type)

### Schedule a Meeting
1. User says "Hey Marcus, schedule a meeting with Sarah next Tuesday at 2pm"
2. Marcus checks Google Calendar for conflicts
3. Marcus creates the event, adds Sarah as attendee, and sends the invite
4. Marcus confirms: "Done. Meeting with Sarah scheduled for Tuesday at 2pm."

### Dispatch a Sub-Agent
1. User opens Agents screen or says "Hey Marcus, research competitors in the AI scheduling space"
2. Marcus creates a task for the Research Agent with the specified brief
3. Research Agent runs in background, Marcus notifies when complete
4. User taps the agent card to review findings

## Color Choices

The palette is deliberately narrow and executive. Matte black (#0A0A0A) dominates all backgrounds. Matte bronze (#C9922A in dark mode) is used exclusively for primary actions, active states, and the MARCUS wordmark. Matte silver (#C0C0C0) is used for secondary text, icons, and inactive states. No bright colors except for status indicators (green for success, amber for warning, red for error). The overall effect is a Bloomberg Terminal meets luxury watch brand.

## Voice and Audio Design

Marcus uses a deep, authoritative male voice. Text-to-speech is handled by the server-side LLM voice synthesis capability. The wake word detection runs on-device using the Expo audio module with a lightweight keyword spotting approach. All voice responses are kept concise: one to three sentences maximum unless the user asks for detail.

## Architecture Notes

The app is a React Native / Expo mobile app with a Node.js backend. The backend handles all sensitive operations: LLM calls, Google API calls via the gws CLI, Manus API task creation for connector-backed operations, and voice transcription. The mobile app communicates with the backend via tRPC. All Google credentials stay server-side. The Manus API key is stored as a server-side environment variable and never exposed to the client.
