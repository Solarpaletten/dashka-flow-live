# 🗺 Solar Flow Live — Roadmap

---

## 🎯 v1.0 — MVP (target: working prototype)

**Goal:** prove the core pipeline works in Chrome on Mac with AirPods.

**Scope:**
- ✅ Single screen UI
- ✅ One direction: EN → RU
- ✅ START / STOP button
- ✅ Continuous recording (2-second chunks)
- ✅ Whisper STT
- ✅ GPT-4o-mini translate
- ✅ Grok TTS (Eve voice)
- ✅ FIFO audio queue → AirPods
- ✅ Visual "● LIVE" indicator
- ✅ Optional subtitle log (last 3 phrases)

**Non-goals:**
- ❌ Multiple directions
- ❌ Mobile support
- ❌ User accounts
- ❌ History / saved sessions
- ❌ Brain / CLEAN layer

**Acceptance criteria:**
- Steady-state latency < 4 seconds
- 5-minute conversation runs without stopping
- Audio quality acceptable for Eve voice
- Pipeline survives 1-2 network blips

**Estimated effort:** ~8 hours of focused engineering.

---

## 🎯 v1.1 — Bidirectional toggle

**Goal:** support both directions with a switch.

**Scope:**
- Direction selector: EN→RU / RU→EN
- Voice swaps automatically (Eve for RU, Leo for EN)
- Same single-screen UI

**Why:** if you also want to speak (less common), you can switch direction at button press.

---

## 🎯 v1.2 — German added (Berlin priority)

**Goal:** support DE→RU for Berlin Steuerberater context.

**Scope:**
- Add `"de"` as Whisper language hint
- GPT translates DE → RU
- Direction selector: EN→RU / DE→RU / RU→EN

**Why:** Sabina Klaus Steuerberater meeting is the immediate practical need.

---

## 🎯 v1.3 — Latency optimization

**Goal:** drop steady-state to under 3 seconds.

**Scope:**
- Parallel pipeline (proper fire-and-await)
- Voice activity detection (skip silent chunks)
- Pre-warm API endpoints
- Latency dashboard (debug-only)
- Chunk size tuning (test 1.5s vs 2s vs 2.5s)

**Why:** at this latency, the product feels like simultaneous interpretation rather than translation.

---

## 🎯 v2.0 — Mobile PWA

**Goal:** works on iPhone in pocket with AirPods.

**Scope:**
- Progressive Web App (installable)
- iOS Safari MediaRecorder workaround (Audio Worklets)
- Background audio capability
- Lock-screen play indicator
- Battery optimization

**Why:** the real-world use case is meeting room with phone in pocket. Laptop is a development environment, not the production environment.

**Estimated effort:** significant — iOS audio is hostile.

---

## 🎯 v2.1 — iOS Shortcut entry point

**Goal:** one-tap start from iPhone control center or Siri.

**Scope:**
- Custom URL scheme
- iOS Shortcut template
- "Hey Siri, start translation"

**Why:** invisible product = no looking at screen during meetings.

---

## 🎯 v3.0 — Multilingual auto-detect

**Goal:** detect spoken language automatically; user only picks output language.

**Scope:**
- Whisper auto-detect (already supported)
- UI: just "→ RU" (input is auto)
- Confidence thresholds

**Why:** in mixed-language environments (Berlin = English + German + Russian), explicit selection becomes a chore.

---

## 🚧 Possible later directions (parking lot)

| Idea | Maybe in version | Notes |
|------|------------------|-------|
| Personal vocabulary glossary | v3.x | "always translate Y as X" |
| On-device Whisper | v4.0 | Requires native app |
| Speaker diarization | v4.0 | "Sabina said X, Klaus said Y" |
| Conversation summary | v3.5 | At end of session, get RU summary |
| Multi-listener (group of AirPods) | v5.0 | Conference mode |

These are **explicitly not on the v1–v2 path**. Mentioning them here so they are noted but not pursued.

---

## 🎯 Definition of "done" for v1.0

```
1. https://solar-flow-live.vercel.app loads
2. Click "START LIVE" — microphone permission requested
3. Speaker says English sentence within 5 seconds
4. Within 3 seconds of speaker finishing, listener hears Russian in AirPods
5. Speaker continues; listener continues to hear translation
6. Click "STOP" — playback stops, mic released
7. Total session of 5 minutes works without crash
```

If all 7 pass — v1.0 ships.

---

## 🚀 Positioning statements (for future README iterations)

```
v1.0:  "Solar Flow Live — personal real-time translation in your ear."

v1.2:  "Understand Berlin without speaking German."

v2.0:  "Wear AirPods. Speak any language."

v3.0:  "Augmented hearing for multilingual environments."
```

---

**Status:** ✅ Roadmap reviewed by Solar Team
**Active version:** v1.0 — MVP
**Next milestone:** working prototype with EN→RU pipeline
