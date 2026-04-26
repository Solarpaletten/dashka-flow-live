# 🏗 Solar Flow Live — Architecture

---

## 🎯 System overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER (wearing AirPods)                     │
│                                                                  │
│   👂 hears Russian                       🗣 speaks Russian        │
│      ↑                                       ↓                   │
└──────│───────────────────────────────────────│──────────────────┘
       │                                       │
       │ AirPods OUT                           │ (separate session
       │                                       │  or AirPods MIC)
       │                                       │
┌──────│───────────────────────────────────────│──────────────────┐
│      │           PHONE / LAPTOP              │                   │
│      │                                       │                   │
│   ┌──▼──────────┐                  ┌─────────▼────┐              │
│   │ <audio> tag │                  │ MediaRecorder│              │
│   │   plays     │                  │  captures    │              │
│   │   MP3       │                  │  ambient     │              │
│   └──▲──────────┘                  └─────┬────────┘              │
│      │                                    │                      │
│      │ MP3 blob                           │ WebM chunks (2 sec)  │
│      │                                    │                      │
└──────│────────────────────────────────────│──────────────────────┘
       │                                    │
       │                                    ▼
       │                    ┌─────────────────────────────┐
       │                    │ /api/stt-stream (Whisper)   │
       │                    │ DE / EN audio → text        │
       │                    └─────────────┬───────────────┘
       │                                  │
       │                                  ▼
       │                    ┌─────────────────────────────┐
       │                    │ /api/translate (GPT-4o-mini)│
       │                    │ DE/EN text → RU text        │
       │                    └─────────────┬───────────────┘
       │                                  │
       │                                  ▼
       │                    ┌─────────────────────────────┐
       │                    │ /api/tts (Grok Eve)         │
       │                    │ RU text → MP3 blob          │
       │                    └─────────────┬───────────────┘
       │                                  │
       └──────────────────────────────────┘
                    Plays in AirPods
```

---

## 🧱 Layers

### Layer 1 — Capture
- **MediaRecorder API** (browser native)
- Continuous chunks of 2 seconds
- WebM container (Whisper-compatible)
- **Stop+restart cycle** every chunk (lesson from Dashka Chat v2.5.1 — timeslice produces broken WebM headers)

### Layer 2 — STT (Speech-to-Text)
- **OpenAI Whisper** API
- Input: WebM blob + `language` hint (e.g. `"en"`, `"de"`)
- Output: text string
- **Temperature: 0** (no hallucinations — proven in Dashka Chat v2.6.0)
- Latency: ~800ms–1.2s per chunk

### Layer 3 — Translate
- **GPT-4o-mini** (`/api/translate`)
- System prompt: minimal, focused on accuracy and naturalness
- Input: source text + target language
- Output: translated text
- Latency: ~400–700ms

### Layer 4 — TTS (Text-to-Speech)
- **Grok TTS** (proven from Dashka Chat — Leo, Eve, Ara voices)
- Input: target language text + voice
- Output: MP3 blob
- Latency: ~600–900ms

### Layer 5 — Playback
- HTML `<audio>` element
- Browser routes automatically to default audio output (AirPods if connected)
- Queue: next chunk plays after current finishes (FIFO)
- No user interaction required

---

## 🔄 Data flow (single chunk)

```
T+0.0s   Recorder starts capturing chunk N
T+2.0s   Recorder.stop() → blob ready
T+2.0s   POST /api/stt-stream
T+3.0s   STT returns text → POST /api/translate
T+3.6s   Translate returns RU text → POST /api/tts
T+4.4s   TTS returns MP3 → enqueue for playback
T+4.4s+  Plays in AirPods (after previous chunk finishes)
```

**Total latency: ~4.4 seconds** for sequential pipeline.

---

## ⚡ Latency optimization (parallel pipeline)

While chunk N is being processed, chunk N+1 is already being recorded:

```
Chunk 1: [REC 2s][STT 1s][TRA 0.6s][TTS 0.8s][PLAY 2s]
Chunk 2:         [REC 2s][STT 1s ][TRA 0.6s][TTS 0.8s][PLAY 2s]
Chunk 3:                  [REC 2s][STT 1s ][TRA 0.6s ][TTS 0.8s][PLAY]
                                    ↑
                          Steady-state latency: ~3 sec
```

**Steady-state: speaker says something at T+0, you hear it at T+3.**

---

## 🧠 Component architecture

```
solar-flow-live/
├── app/
│   ├── page.tsx                  ← single screen UI
│   ├── api/
│   │   ├── stt-stream/route.ts   ← Whisper proxy
│   │   ├── translate/route.ts    ← GPT translate
│   │   └── tts/route.ts          ← Grok TTS
│   └── globals.css
├── features/
│   └── live/
│       ├── useLive.ts            ← main hook (recorder + queue)
│       ├── audioQueue.ts         ← FIFO playback
│       ├── chunkPipeline.ts      ← STT → Translate → TTS
│       └── types.ts
└── lib/
    ├── recorder.ts               ← MediaRecorder wrapper
    └── stt.ts                    ← Whisper client
```

---

## 🎯 Single screen UI

```
┌─────────────────────────────────────────────────┐
│                                                  │
│           Solar Flow Live                        │
│           personal translation in your ear       │
│                                                  │
│       ┌──────────────────────────────┐          │
│       │  EN → RU            ▼        │          │
│       └──────────────────────────────┘          │
│                                                  │
│                ●  L I V E                        │
│           (animated indicator)                   │
│                                                  │
│       ┌──────────────────────────────┐          │
│       │     ▶   START LIVE           │          │
│       └──────────────────────────────┘          │
│                                                  │
│       (when running, button becomes ⏸ STOP)      │
│                                                  │
│       ─────────────────────────────              │
│                                                  │
│       Recent (subtitle-style log, optional):     │
│         "...the meeting is at 3pm"               │
│         "встреча в 15:00"                        │
│                                                  │
└─────────────────────────────────────────────────┘
```

That is the entire UI. No panels. No textareas. No share. No copy. **Listen.**

---

## 🔐 Privacy

- Audio chunks are sent to OpenAI / Grok APIs
- Nothing is stored on Solar Flow servers
- No transcripts saved
- No analytics on speech content
- Future v2: on-device Whisper (mobile-only, no API calls)

---

## 🌐 Browser & device support

| Platform | v1 | v2 |
|----------|----|----|
| Chrome desktop | ✅ | ✅ |
| Safari desktop | ✅ | ✅ |
| Chrome Android | ✅ | ✅ |
| Safari iOS | ⚠ partial | ✅ PWA |
| Firefox | ⚠ test | ✅ |

iOS Safari has restrictions on continuous MediaRecorder; v2 will address via PWA + Audio Worklets.

---

## 🚦 Failure modes

| Scenario | Response |
|----------|----------|
| Microphone denied | Show permission instructions |
| Network drops mid-chunk | Skip chunk, keep streaming |
| Whisper timeout | Skip + log, do not stop |
| TTS failure | Show inline subtitle as fallback |
| Audio queue overflow | Drop oldest unplayed chunks |

The system **must never stop on a single failed chunk** — the user is in a live conversation and cannot tolerate freezes.

---

**Status:** ✅ Architecture approved
**Next:** PIPELINE.md (latency budget detail), PRINCIPLES.md
