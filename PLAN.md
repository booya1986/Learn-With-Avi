# LearnWithAvi — Active Phase Plan

> Phase 3 — Voice Optimization ✅ COMPLETE
> Generated: 2026-03-01 | Completed: 2026-03-01
> See [ROADMAP.md](ROADMAP.md) for phase context and [STATE.md](STATE.md) for current blockers.

---

## Task Status Tracking

| Task | Wave | Skill | Priority | Effort | Status |
|---|---|---|---|---|---|
| stream-tts-in-voice-chat | 1 | backend-engineer | P0 | large | ✅ Done |
| fix-elevenlabs-voice-output-hook | 1 | frontend-engineer | P0 | medium | ✅ Done |
| hebrew-stt-optimization | 1 | backend-engineer | P1 | medium | ✅ Done |
| voice-session-persistence | 1 | frontend-engineer | P1 | medium | ✅ Done |
| voice-waveform-real-audio | 1 | frontend-engineer | P2 | small | ✅ Done |
| voice-analytics-admin | 2 | backend-engineer | P1 | large | ✅ Done |
| voice-component-stories | 2 | frontend-engineer | P2 | small | ✅ Done |

---

## Wave 1 — Core Pipeline Fixes (independent, no dependencies)

<task
  id="stream-tts-in-voice-chat"
  wave="1"
  skill="backend-engineer"
  priority="P0"
  effort="large"
  depends-on=""
>
  Fix the voice chat pipeline to stream TTS audio instead of buffering.

  PROBLEM: `generateTTSAudio()` in voice-pipeline.ts calls the TTS route, buffers the
  ENTIRE ElevenLabs audio/mpeg stream into memory, converts to base64, and sends as a
  single SSE `audio` event. This negates all streaming latency benefits from Phase 2.

  SOLUTION: Eliminate the internal HTTP round-trip. Instead:
  1. Call ElevenLabs `/v1/text-to-speech/{voiceId}/stream` directly from voice-pipeline.ts
     (extract `streamElevenLabsTTS` logic from the TTS route into a shared lib function)
  2. In voice/chat/route.ts, after Claude finishes streaming text, pipe TTS audio chunks
     as multiple SSE events: `{ type: 'audio-chunk', chunk: <base64-chunk>, index: N }`
  3. Send a final `{ type: 'audio-done' }` event
  4. Update useVoiceAPI.ts client to accumulate audio chunks and play via HTMLAudioElement
     using MediaSource API or Blob concatenation

  Key files:
  - src/app/api/v1/voice/chat/route.ts (pipeline orchestration)
  - src/app/api/v1/voice/tts/route.ts (extract streamElevenLabsTTS to shared lib)
  - src/lib/voice-pipeline.ts (generateTTSAudio → rewrite)
  - src/hooks/voice/useVoiceAPI.ts (handle audio-chunk events)

  Constraints:
  - Keep the TTS route working independently (it's used for standalone TTS)
  - Maintain the browser TTS fallback when no ELEVENLABS_API_KEY
  - Keep existing SSE event types (transcription, content, done) unchanged
  - Respect 30s Vercel timeout on TTS, 60s on voice chat

  Acceptance:
  - Voice chat audio starts playing BEFORE the full TTS response is buffered
  - Latency from "Claude done" to "first audio heard" drops by 500ms+
  - Existing voice-tts.test.ts and voice-chat.test.ts still pass
  - `GET /api/v1/voice/tts` health check still works
</task>

<task
  id="fix-elevenlabs-voice-output-hook"
  wave="1"
  skill="frontend-engineer"
  priority="P0"
  effort="medium"
  depends-on=""
>
  Fix the broken `speakWithElevenLabs` function in useVoiceOutput.ts.

  PROBLEM: The hook's `speakWithElevenLabs()` fetches `/api/voice/tts` and tries to
  read `response.json().audioUrl` — but the TTS route returns streaming `audio/mpeg`,
  not JSON. This path is completely broken. There's a `TODO: Implement ElevenLabs
  integration` comment confirming it was never finished.

  SOLUTION:
  1. Check response Content-Type
  2. If `audio/mpeg`: create a Blob from the response body, create an object URL,
     play via HTMLAudioElement (similar to useAudioPlayback pattern)
  3. If JSON (browser fallback): parse and handle the `provider: 'browser'` response
     by falling back to Web Speech Synthesis
  4. Clean up object URLs on unmount to prevent memory leaks

  Key files:
  - src/hooks/useVoiceOutput.ts (speakWithElevenLabs function, ~line 200+)
  - src/hooks/voice/useAudioPlayback.ts (reference for HTMLAudioElement pattern)

  Constraints:
  - Don't break the browser TTS fallback path
  - Don't break the priority queue system
  - Maintain the existing API: speak(), stop(), pause(), resume()
  - Keep the provider preference logic (elevenlabs > browser)

  Acceptance:
  - `speakWithElevenLabs()` correctly plays audio/mpeg from the TTS streaming endpoint
  - Falls back to browser TTS when ElevenLabs returns non-audio response
  - Object URLs are revoked on unmount (no memory leaks)
  - useVoiceOutput.test.ts still passes
  - VoicePanel and VoiceButton work with ElevenLabs provider selected
</task>

<task
  id="hebrew-stt-optimization"
  wave="1"
  skill="backend-engineer"
  priority="P1"
  effort="medium"
  depends-on=""
>
  Improve Whisper STT Hebrew accuracy and fix language handling across the voice pipeline.

  THREE FIXES:

  1. WHISPER HEBREW HINTS: When language is 'auto' and the video's known language is
     Hebrew, pass 'he' as a hint to Whisper instead of no hint. Accept an optional
     `expectedLanguage` param in transcribeAudio() for this purpose.

  2. TTS LANGUAGE-AWARE VOICE SELECTION: The `_language` parameter in
     `streamElevenLabsTTS` is received but IGNORED — always uses the same voice (Adam).
     Fix: when language is 'he', use a Hebrew-optimized voice. When language is 'en',
     use an English-optimized voice. Use ElevenLabs voice IDs that support the target
     language with `eleven_multilingual_v2` model.

  3. FIX buildContextString FOR HOURS: Videos longer than 60 minutes get timestamps
     like [61:05] instead of [1:01:05]. Fix the formatting to handle hours.

  Key files:
  - src/lib/voice-pipeline.ts (transcribeAudio, buildContextString)
  - src/app/api/v1/voice/tts/route.ts (streamElevenLabsTTS language param)
  - src/app/api/v1/voice/chat/route.ts (pass video language context)

  Constraints:
  - Don't change the Whisper model (whisper-1) — it's the only one available
  - Keep 'auto' as default language (don't force Hebrew)
  - Don't add new API keys or services
  - Maintain backward compatibility of API request/response shapes

  Acceptance:
  - Hebrew voice input with language='he' produces more accurate transcriptions
  - TTS uses language-appropriate voice settings
  - buildContextString formats [1:01:05] for timestamps >= 3600s
  - voice-pipeline.test.ts updated and passing with new hour-format tests
  - voice-chat.test.ts and voice-tts.test.ts still pass
</task>

<task
  id="voice-session-persistence"
  wave="1"
  skill="frontend-engineer"
  priority="P1"
  effort="medium"
  depends-on=""
>
  Persist voice conversation history to localStorage so page refresh doesn't lose context.

  PROBLEM: Voice conversation context lives only in React state. Refreshing the course
  page loses all voice chat history. The server is stateless (by design), so persistence
  must be client-side.

  SOLUTION:
  1. Create a `useVoiceHistory` hook that wraps localStorage with:
     - Key format: `voice-history-{videoId}` (scoped per video)
     - Max 20 messages (matches server-side Zod validation limit)
     - TTL: 24 hours (auto-expire stale conversations)
     - Debounced writes (don't write on every token)
  2. On mount in VoiceChatInterface, load persisted history for the current videoId
  3. On new message (user transcription or assistant response), save to localStorage
  4. Add a "Clear history" button to VoiceChatInterface

  Key files:
  - src/hooks/voice/useVoiceHistory.ts (NEW — localStorage persistence hook)
  - src/components/voice/VoiceChatInterface.tsx (integrate useVoiceHistory)
  - src/hooks/voice/index.ts (re-export new hook)

  Constraints:
  - Don't change server-side behavior (keep it stateless)
  - localStorage only — no cookies or IndexedDB
  - Handle localStorage being full or disabled (graceful fallback to in-memory)
  - Don't persist audio data (only text messages)
  - Respect the 20-message limit from server-side Zod validation

  Acceptance:
  - Refreshing a course page preserves voice conversation history
  - Each video has its own isolated history
  - History auto-expires after 24 hours
  - "Clear history" button works
  - Gracefully handles localStorage unavailable (private browsing)
  - New hook has unit tests
</task>

<task
  id="voice-waveform-real-audio"
  wave="1"
  skill="frontend-engineer"
  priority="P2"
  effort="small"
  depends-on=""
>
  Replace fake random waveform with real audio visualization using Web Audio API.

  PROBLEM: useWaveform.ts generates random bar heights (Math.random()) every 100ms.
  The waveform animation has no relationship to actual audio input.

  SOLUTION:
  1. Accept an optional MediaStream or HTMLAudioElement as input
  2. Create an AudioContext + AnalyserNode
  3. Use getByteFrequencyData() to get real frequency/amplitude data
  4. Map frequency bins to bar heights
  5. Fall back to the existing random animation if no audio source is provided
     (e.g., when microphone permission hasn't been granted yet)
  6. Clean up AudioContext on unmount

  Key files:
  - src/hooks/voice/useWaveform.ts (rewrite)
  - src/components/voice/WaveformVisualizer.tsx (pass audio source)
  - src/components/voice/VoiceChatInterface.tsx (connect MediaStream to waveform)

  Constraints:
  - Must work without audio source (fallback to current random behavior)
  - Don't create multiple AudioContexts (browser limits to ~6)
  - Clean up resources properly on unmount
  - Keep the same visual style (vertical bars)

  Acceptance:
  - Waveform bars respond to actual microphone input volume during recording
  - Waveform bars respond to actual audio playback volume during TTS
  - Falls back to random animation when no audio source available
  - No AudioContext leak warnings in browser console
</task>

---

## Wave 2 — Analytics & Polish (depends on Wave 1)

<task
  id="voice-analytics-admin"
  wave="2"
  skill="backend-engineer"
  priority="P1"
  effort="large"
  depends-on="stream-tts-in-voice-chat,hebrew-stt-optimization"
>
  Add voice usage analytics tracking and admin dashboard endpoint.

  SCOPE:
  1. DATABASE: Add a `VoiceSession` model to prisma/schema.prisma:
     - id, sessionId, userId (optional), videoId, language, sttProvider, ttsProvider,
       ttsUsedFallback (boolean), sttLatencyMs, llmLatencyMs, ttsLatencyMs, totalLatencyMs,
       transcriptionLength, responseLength, createdAt

  2. LOGGING: In voice/chat/route.ts, after the pipeline completes, insert a VoiceSession
     record with latency metrics (already calculated in the `done` SSE event).
     Fire-and-forget (don't block the response).

  3. API ENDPOINT: `GET /api/admin/voice/analytics` — returns aggregated stats:
     - Total voice sessions (today, week, month)
     - Average latency per stage (stt, llm, tts, total)
     - TTS fallback rate (% of sessions using browser TTS)
     - Language distribution (he vs en vs auto)
     - Top videos by voice usage

  4. ADMIN UI: Add a VoiceAnalytics card to the admin dashboard showing key metrics.

  Key files:
  - prisma/schema.prisma (new VoiceSession model)
  - src/app/api/v1/voice/chat/route.ts (insert analytics record)
  - src/app/api/admin/voice/analytics/route.ts (NEW — admin analytics endpoint)
  - src/app/[locale]/admin/ (add analytics card to dashboard)

  Constraints:
  - Analytics insert must not slow down the voice response (fire-and-forget)
  - Admin endpoint requires admin auth (use existing admin auth pattern)
  - Don't store actual conversation content (privacy) — only metadata and metrics
  - Use Prisma for all DB operations

  Acceptance:
  - Every voice chat session creates a VoiceSession record
  - Admin can view voice usage metrics at /admin with real data
  - Analytics API returns correct aggregated stats
  - Database migration runs cleanly
  - No impact on voice chat latency
</task>

<task
  id="voice-component-stories"
  wave="2"
  skill="frontend-engineer"
  priority="P2"
  effort="small"
  depends-on="fix-elevenlabs-voice-output-hook,voice-waveform-real-audio"
>
  Add Storybook stories for voice components (project convention requires stories
  for new components).

  Components to cover:
  1. VoiceChatInterface — show idle, recording, processing, playing states
  2. MicrophoneButton — show all 4 button states (idle, recording, processing, playing)
  3. WaveformVisualizer — show active vs idle animation
  4. VoiceSettingsPanel — show language and voice selection

  Key files:
  - src/stories/voice/VoiceChatInterface.stories.tsx (NEW)
  - src/stories/voice/MicrophoneButton.stories.tsx (NEW)
  - src/stories/voice/WaveformVisualizer.stories.tsx (NEW)
  - src/stories/voice/VoiceSettingsPanel.stories.tsx (NEW)

  Constraints:
  - Mock all API calls and media APIs (Storybook can't use real microphone)
  - Follow existing Storybook patterns (see src/stories/ for reference)
  - Use decorators for RTL/Hebrew testing variants

  Acceptance:
  - `npm run storybook` shows all 4 voice component stories
  - Each story demonstrates multiple states/variants
  - Stories render without errors or console warnings
</task>

---

## Definition of Done (Phase 3) ✅ ALL COMPLETE

- [x] Voice chat TTS streams audio chunks (not buffered) — shared ElevenLabs lib, SSE audio-chunk events
- [x] `useVoiceOutput.speakWithElevenLabs` correctly plays audio/mpeg from streaming endpoint
- [x] Hebrew STT accuracy improved with language hints and voice selection
- [x] Voice conversation history persists across page refresh (per video, 24h TTL)
- [x] Waveform visualization responds to real audio input (Web Audio API AnalyserNode)
- [x] Voice analytics tracked in database and visible in admin dashboard
- [x] Storybook stories exist for voice components (4 story files)
- [x] All existing tests pass — 861 passing, 0 failures
- [x] No new TypeScript errors
- [x] `npm run build` passes
- [x] STATE.md updated with new metrics

---

## Phase 3 Complete — Run `/gsd:plan-phase` for Phase 4
