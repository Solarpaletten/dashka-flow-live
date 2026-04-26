# 🎧 Solar Flow Live

> Personal real-time translation in your ear.

A web app that listens to ambient speech, translates it in real time, and plays the translation **only** through your headphones. The other person sees nothing. You participate in the conversation as if you spoke their language natively.

```
Speaker  →  Microphone  →  STT  →  Translate  →  TTS  →  AirPods
```

---

## 🚀 Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# edit .env.local — add your OPENAI_API_KEY and XAI_API_KEY

# 3. Run
npm run dev

# 4. Open
http://localhost:3000

# 5. Connect AirPods, click START LIVE, speak English
```

---

## 🧠 How it works

1. **Recorder** captures the microphone in continuous 2.5-second WebM chunks (stop+restart cycle — see `lib/recorder.ts`)
2. **Pipeline** sends each chunk through:
   - `/api/stt` (Whisper) → text
   - `/api/translate` (GPT-4o-mini) → translated text
   - `/api/tts` (Grok) → MP3 blob
3. **AudioQueue** plays MP3 blobs sequentially through the user's audio output (browser routes to AirPods automatically)

---

## 📁 Structure

```
solar-flow-live/
├── app/
│   ├── page.tsx                ← single-screen UI
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       ├── stt/route.ts        ← Whisper proxy
│       ├── translate/route.ts  ← GPT-4o-mini
│       └── tts/route.ts        ← Grok TTS
├── lib/
│   ├── recorder.ts             ← MediaRecorder cycle
│   ├── audioQueue.ts           ← FIFO playback (heart of product)
│   └── pipeline.ts             ← STT → Translate → TTS
├── components/
│   └── LiveButton.tsx          ← START / STOP
├── .env.example
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md
```

---

## 🔧 Environment

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Whisper STT + GPT-4o-mini translate |
| `XAI_API_KEY` | Grok TTS (Eve, Leo voices) |

---

## 🎯 Status

**v1.0** — engineering MVP. Verifies the pipeline end-to-end. Not yet production-polished.

**Acceptance test:**
1. Click `START LIVE`
2. Within 4 seconds of speaking English, hear Russian in AirPods
3. Continue 5 minutes without crash
4. Click `STOP` — clean release of microphone

If all 4 pass — v1.0 ships.

---

## 📜 Solar Team

```
L = Leanid     (architect)
D = Dashka     (coordinator)
C = Claude     (engineer)
S = Solana     (analyst)
```

This product is built using the disciplined iteration loop forged in Dashka Chat (April 2026):

```
Build → Test → Break → Diagnose → Rollback → Stabilize
```

---

## 🚧 Out of scope for v1.0

- Mobile (desktop Chrome / Safari only)
- User accounts / saved history
- Brain / CLEAN polish layer
- Latency dashboard

These are tracked in `docs/ROADMAP.md` (in the docs repo).

---

**Solar Flow Live** · v1.0 · Solar Team 🚀
