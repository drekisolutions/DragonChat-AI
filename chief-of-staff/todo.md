# Chief of Staff Agent — TODO

## Branding and App Setup
- [x] Generate MARCUS app icon (matte black, bronze M monogram)
- [x] Apply Dreki Solutions brand colors to theme.config.js
- [x] Update app name to "MARCUS" in app.config.ts
- [x] Copy icon to all required asset locations

## Navigation and Shell
- [x] Configure tab bar with 5 tabs: Listen, Home, Inbox, Calendar, Agents, More
- [x] Add icon mappings for all tab icons
- [x] Create Settings screen route
- [x] Create Rules screen route
- [x] Create Call Log screen route
- [ ] Create File Browser screen route (future)

## Wake Word and Voice UI
- [x] Build Wake/Listen screen as app index
- [x] Implement animated voice waveform component
- [x] Add push-to-talk mic button
- [x] Implement wake word detection logic ("Hey Marcus")
- [x] Add male TTS playback for Marcus responses (expo-speech)
- [ ] Wire live microphone capture to voice transcription (future)

## Command Center (Home Screen)
- [x] Build daily greeting card with AI briefing
- [x] Build email summary card (priority inbox, top 3 threads)
- [x] Build calendar card (today's events)
- [x] Build active agents status card
- [x] Build quick-action row (Compose, Schedule, Delegate, Call Log)

## Inbox Screen
- [x] Build prioritized Gmail thread list with priority badges
- [x] Build thread detail view with full message body
- [x] Add reply composer with "Let Marcus Draft" button
- [ ] Add swipe-to-archive and swipe-to-delegate gestures (future)
- [ ] Wire to live Gmail connector endpoint (future)

## Calendar Screen
- [x] Build scrollable day view with event cards
- [x] Add event color coding by type
- [x] Build event detail sheet with action buttons
- [x] Add create event modal
- [ ] Wire to live Google Calendar connector endpoint (future)

## Agents Screen
- [x] Build agent roster card list
- [x] Add agent status indicators (Idle, Running, Needs Input)
- [x] Build agent detail/task history view
- [x] Add "Dispatch Task" flow with LLM execution
- [x] Define 5 sub-agents: Research, Sales, Support, Bookkeeping, Personal

## Rules Screen
- [x] Build rules list organized by domain
- [x] Add rule toggle and description display
- [x] Build natural-language rule builder

## Call Log Screen
- [x] Build call history list
- [x] Add transcript detail view
- [x] Add AI summary and action items display
- [x] Add "Create Follow-Up" button

## Settings Screen
- [x] Build Voice settings section
- [x] Build Notifications settings section
- [x] Build Integrations section (connector status)
- [x] Persist settings to AsyncStorage

## Backend: LLM and Voice
- [x] Add voice transcription endpoint (server/routers.ts)
- [x] Add LLM chat/command endpoint (marcus.chat)
- [x] Add daily briefing generation endpoint (marcus.dailyBriefing)
- [x] Add email drafting endpoint (marcus.draftEmail)
- [x] Add call summarization endpoint (marcus.summarizeCall)
- [x] Add agent dispatch endpoint (marcus.dispatchAgent)
- [x] Add rule evaluation endpoint (marcus.evaluateRule)

## Backend: Google Integrations
- [x] Add Gmail connector bridge (priority inbox, search, read, draft)
- [x] Add Google Calendar connector bridge (today, upcoming, create, delete)
- [ ] Add Google Drive connector bridge (future)

## Backend: Manus API Bridge
- [x] useMarcus hook with full chat, speak, briefing, draft, summarize, dispatch
- [x] expo-speech TTS with male voice settings (pitch 0.9, rate 0.95)
- [ ] Add task status polling endpoint (future)

## Google Drive File Browser (v1.1)
- [x] Build Files tab screen with search bar and recent files list
- [x] Add file type icons and metadata display (size, modified date)
- [x] Build file detail sheet with preview info and Marcus summarize action
- [x] Add Google Drive connector bridge on server (search, list recent, get metadata)
- [x] Add drive.search and drive.recent tRPC endpoints
- [x] Add drive.summarize tRPC endpoint (LLM summarizes file content)
- [x] Register Files tab in tab navigation
- [x] Add icon mapping for Files tab

## Red Team Operations (v1.2)
- [x] Security audit: API endpoint exposure and authentication gaps
- [x] Security audit: input validation and injection attack surface
- [x] Security audit: secrets and environment variable handling
- [x] Security audit: transport security and CORS configuration
- [x] Security audit: data storage and privacy exposure
- [x] Apply security hardening fixes from audit findings
- [x] Build Red Team business agent screen in MARCUS
- [x] Wire red team LLM adversarial prompt chain on server
- [x] Add redTeam.analyze tRPC endpoint
- [x] Add Red Team agent to Agents tab
- [x] Deliver security audit report as attachment

## Voice & Agent Names (v1.3)
- [x] Build server-side Google Cloud TTS endpoint (natural male voice)
- [x] Update useMarcus hook to call Google TTS endpoint with audio playback
- [x] Graceful fallback to expo-speech if Google TTS unavailable
- [x] Assign unique default names to all 6 agents (Marcus, + 5 sub-agents)
- [x] Create AgentNamesContext with AsyncStorage persistence
- [x] Build Name Customization screen in Settings
- [x] Wire agent names across Agents tab, Home screen, and voice responses
- [x] Update wake word UI to use customizable chief-of-staff name

## APK Crash Fix (v1.4)
- [x] Audit app.config.ts for Android-incompatible settings
- [x] Check for native modules that crash on cold start
- [x] Ensure all async initializations are crash-safe with try/catch
- [x] Fix root layout provider ordering and error boundaries
- [x] Add global error boundary to prevent silent white-screen crashes
- [x] Verify bundle entry point and expo-router configuration
- [x] Save checkpoint and publish new APK

## App Name, Onboarding & Icon Fix (v1.5)
- [x] Rename app display name to "Chief of Staff" in app.config.ts
- [x] Update all UI references from "MARCUS" header subtitle to "Chief of Staff"
- [x] Fix home tab icon (add house icon mapping to icon-symbol.tsx)
- [x] Build onboarding screen with welcome, feature highlights, and permissions setup
- [x] Wire onboarding to show only on first launch using AsyncStorage flag
- [x] Add skip/continue navigation from onboarding to main app
- [x] Save checkpoint and publish

## Mic Permission & User Profile (v1.6)
- [x] Add mic permission request button to onboarding Voice slide
- [x] Show permission status (granted/denied) with visual feedback on Voice slide
- [x] Build user profile screen (name, company, title, greeting preference)
- [x] Persist profile data in AsyncStorage
- [x] Add Profile link in Settings/More tab
- [x] Wire profile name into Marcus voice greeting and daily briefing
- [x] Wire profile name into wake screen personalized subtitle
- [x] Save checkpoint and publish

## End-to-End Voice Commands (v1.7)
- [ ] Build useVoiceCommand hook: record audio with expo-audio, upload to server, transcribe
- [ ] Add voice intent parser on server (LLM classifies command → agent + action + params)
- [ ] Wire agent dispatch from voice intent (Research/Sales/Support/Bookkeeping/Personal)
- [ ] Wire direct Marcus actions from voice (email draft, calendar create, file summarize)
- [ ] Update Listen screen: show recording state, transcription, intent, and response
- [ ] Add live status indicators: Listening → Thinking → Speaking
- [ ] Read back agent/Marcus response via Google TTS
- [ ] Save checkpoint and publish
