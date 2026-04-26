# 📋 Solar Flow Live — ТЗ v1.0

> Concrete implementation specification for the MVP.  
> When v1.0 ships per this document, the product is "done" for this milestone.

---

## 🎯 Цель v1.0

Build a working web app at `solar-flow-live.vercel.app` that:
- Listens to ambient English speech via microphone
- Translates it to Russian in real time
- Plays the Russian translation through the user's audio output (AirPods if connected)
- Has steady-state latency under 4 seconds
- Runs continuously for 5+ minutes without breaking

---

## 📦 Стек

```
Framework:    Next.js 15 (App Router)
Language:     TypeScript
React:        19
Styling:      Tailwind CSS + globals.css
STT:          OpenAI Whisper (existing OPENAI_API_KEY)
Translate:    GPT-4o-mini
TTS:          Grok (existing XAI_API_KEY) — Eve voice for Russian
Hosting:      Vercel
```

Reuse from Dashka Chat:
- `app/api/translate/route.ts` (copy as-is)
- `app/api/tts/route.ts` (copy as-is)
- `app/api/stt/route.ts` (copy and rename to `stt-stream`)

---

## 🏗 Структура проекта

```
solar-flow-live/
├── app/
│   ├── page.tsx                       ← single-screen UI
│   ├── globals.css                    ← minimal styles
│   ├── layout.tsx                     ← root layout
│   └── api/
│       ├── stt-stream/route.ts        ← Whisper proxy (copy from Dashka)
│       ├── translate/route.ts         ← copy from Dashka Chat
│       └── tts/route.ts               ← copy from Dashka Chat
├── features/
│   └── live/
│       ├── useLive.ts                 ← main hook
│       ├── audioQueue.ts              ← FIFO playback
│       ├── chunkPipeline.ts           ← STT → Translate → TTS
│       └── types.ts
├── lib/
│   └── recorder.ts                    ← MediaRecorder cycle wrapper
├── public/
│   └── (favicon, og-image)
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 🎨 UI specification

### Single screen layout

```
┌─────────────────────────────────────────────────┐
│                                                  │
│         🎧 Solar Flow Live                       │
│         personal translation in your ear         │
│                                                  │
│                                                  │
│       Direction:  EN → RU                        │
│                                                  │
│                                                  │
│           ●  L I V E                             │
│         (gray when off, red pulsing when on)     │
│                                                  │
│                                                  │
│     ┌─────────────────────────────────┐          │
│     │      ▶   START LIVE             │          │
│     └─────────────────────────────────┘          │
│                                                  │
│                                                  │
│     ── Recent (last 3 lines) ───                 │
│     "the meeting is at three pm"                 │
│       → "встреча в три часа дня"                 │
│     "I think we need more time"                  │
│       → "я думаю нам нужно больше времени"       │
│                                                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

### States

| State | Indicator | Button |
|-------|-----------|--------|
| Idle | gray dot | "▶ START LIVE" |
| Requesting mic | gray dot + spinner | disabled |
| Live | red pulsing dot | "⏸ STOP" |
| Error | red dot + error text | "▶ START LIVE" |

### Recent log

- Shows the last 3 source-translation pairs
- Source text in dim color
- Translation in primary color
- New entries fade in from bottom
- Older entries fade out at top
- Max retention: 3 pairs (keeps UI minimal)

---

## 🧠 useLive.ts — main hook

```typescript
type LiveState = "idle" | "requesting" | "live" | "error";

interface UseLiveReturn {
  state: LiveState;
  error: string | null;
  recentPairs: { source: string; translated: string; id: number }[];
  start: () => Promise<void>;
  stop: () => void;
  direction: "en-ru" | "ru-en"; // v1.1+: ru-en
  setDirection: (d: "en-ru" | "ru-en") => void;
}

export function useLive(): UseLiveReturn { ... }
```

Internal:
- Manages `MediaRecorder` lifecycle
- Maintains `audioQueue`
- Holds chunk-in-flight counter
- Tracks recent pairs for UI
- Handles errors without stopping pipeline

---

## 🔄 Chunk pipeline

```typescript
// features/live/chunkPipeline.ts

export interface ChunkResult {
  source: string;        // STT text
  translated: string;    // RU text
  audioBlob: Blob;       // MP3
}

export async function processChunk(
  audioBlob: Blob,
  sourceLang: "en" | "ru",
  targetLang: "ru" | "en",
  voice: string
): Promise<ChunkResult | null> {
  // 1. STT
  const text = await stt(audioBlob, sourceLang);
  if (!text || text.trim().length < 2) return null;
  
  // 2. Translate
  const translated = await translate(text, sourceLang, targetLang);
  if (!translated) return null;
  
  // 3. TTS
  const audio = await tts(translated, targetLang, voice);
  if (!audio) return null;
  
  return { source: text, translated, audioBlob: audio };
}
```

---

## 🔁 Recording cycle

```typescript
// lib/recorder.ts

const CHUNK_MS = 2000;

export class ChunkRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private isLive = false;
  
  async start(onChunk: (blob: Blob) => void) {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.isLive = true;
    this.cycle(onChunk);
  }
  
  stop() {
    this.isLive = false;
    this.recorder?.stop();
    this.stream?.getTracks().forEach(t => t.stop());
  }
  
  private cycle(onChunk: (blob: Blob) => void) {
    if (!this.isLive || !this.stream) return;
    
    this.recorder = new MediaRecorder(this.stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) onChunk(e.data);
    };
    
    this.recorder.onstop = () => {
      if (this.isLive) this.cycle(onChunk); // immediate restart
    };
    
    this.recorder.start();
    setTimeout(() => this.recorder?.stop(), CHUNK_MS);
  }
}
```

---

## 🔉 Audio queue

```typescript
// features/live/audioQueue.ts

export class AudioQueue {
  private queue: Blob[] = [];
  private playing = false;
  
  enqueue(blob: Blob) {
    this.queue.push(blob);
    if (!this.playing) void this.playNext();
  }
  
  clear() {
    this.queue = [];
  }
  
  private async playNext() {
    if (this.queue.length === 0) {
      this.playing = false;
      return;
    }
    this.playing = true;
    const blob = this.queue.shift()!;
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      void this.playNext();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      void this.playNext();
    };
    try {
      await audio.play();
    } catch (e) {
      console.error('Audio play failed', e);
      void this.playNext();
    }
  }
}
```

---

## ✅ Acceptance criteria

```
1. Site loads at solar-flow-live.vercel.app
2. Default state: gray dot, "▶ START LIVE" button
3. Click button → browser asks for microphone permission
4. After permission granted: red pulsing dot + "⏸ STOP" button
5. Speak in English (e.g., "the meeting is at 3pm")
6. Within 4 seconds, you hear the Russian translation in your audio output
7. Recent log shows pair: "the meeting is at 3pm" / "встреча в 15:00"
8. Continue speaking — translations continue
9. Click "⏸ STOP" → playback stops, mic released, dot grays out
10. Total session of 5 minutes works without crash
11. If mic denied or network drops: error shown, can retry
```

---

## 🚧 Out of scope for v1.0

- ❌ Multiple directions (only EN→RU)
- ❌ Mobile (desktop Chrome on Mac only)
- ❌ User accounts / saved history
- ❌ Brain / CLEAN polish layer
- ❌ Latency dashboard
- ❌ Voice activity detection
- ❌ Subtitle export

These belong to v1.1+ per ROADMAP.md.

---

## 🛠 Estimated implementation

| Task | Hours |
|------|-------|
| Project scaffold (Next.js, deps, config) | 0.5 |
| API routes (copy from Dashka Chat) | 0.5 |
| `lib/recorder.ts` (cycle wrapper) | 1.0 |
| `features/live/audioQueue.ts` | 0.5 |
| `features/live/chunkPipeline.ts` | 0.5 |
| `features/live/useLive.ts` (hook) | 1.5 |
| `app/page.tsx` (single screen UI) | 1.5 |
| `app/globals.css` (minimal styles) | 0.5 |
| Initial deploy + smoke test | 0.5 |
| Real-world latency test + tuning | 1.0 |
| **Total** | **~8 hours** |

This is one focused day of work.

---

## 🚀 Deploy target

```
GitHub:  github.com/Solarpaletten/solar-flow-live
Vercel:  solar-flow-live.vercel.app
Env:     OPENAI_API_KEY, XAI_API_KEY (same as Dashka Chat)
```

---

**Status:** ✅ ТЗ v1.0 ratified  
**Approved by:** D=>L on 2026-04-26  
**Ready for:** Engineering execution (C)
