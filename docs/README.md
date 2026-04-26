# 🎧 Solar Flow Live

> **Personal real-time translation in your ear.**

---

## 🎯 What is it

Solar Flow Live is a web application that listens to ambient speech, translates it in real time, and speaks the translation **only into your headphones** — invisible to anyone around you.

You wear AirPods. Your phone or laptop microphone listens to the person speaking in front of you. Within 2–3 seconds, you hear their words translated in your ear. The other person sees nothing. You participate in the conversation as if you spoke their language natively.

---

## 🧠 Core idea

```
Speaker  →  Microphone  →  STT  →  Translate  →  TTS  →  AirPods (yours only)
```

The entire pipeline is invisible. The speaker sees no device, no app, no delay in your reactions. You hear their meaning, not their language.

---

## 🔥 Why this is different

```
Existing translation apps                    Solar Flow Live
─────────────────────────                    ────────────────────────
❌ Push-to-talk (interrupts)                  ✅ Continuous streaming
❌ Visible to everyone (phone in hand)        ✅ Invisible (AirPods + pocket)
❌ 5–10 second latency                        ✅ 2–4 second latency
❌ Asynchronous (one direction at a time)     ✅ Synchronous (both speak naturally)
❌ Noticeable disruption                      ✅ Zero disruption
```

This is not a translator. It is **augmented hearing for multilingual environments**.

---

## 🎯 Target use cases

1. **Berlin Steuerberater meeting** — Sabina speaks German, you hear Russian. You answer in your language; she does not need to know yours.
2. **International conference call** — rapid technical English, you follow it in Russian without missing context.
3. **Travel** — local resident speaks Italian / German / French; you understand naturally.
4. **Doctor visits abroad** — never miss a critical word.
5. **Mixed-language social settings** — be present in conversations that would otherwise exclude you.

---

## 📐 Architectural principles (Solar Team)

```
1. ONE screen           — no panels, no tabs, no clutter
2. ONE button           — START / STOP
3. ONE direction at a time
4. STT = source of truth
5. CLEAN = optional polish (off by default in v1)
6. Latency budget       — every layer must justify its milliseconds
7. Streaming first      — chunks process while next chunks record
8. Audio out = AirPods  — browser routes automatically
```

---

## 🚀 Roadmap (high-level)

| Version | Goal |
|---------|------|
| **v1.0** | MVP single direction (EN→RU), web app, working in Chrome on Mac |
| **v1.1** | Bidirectional toggle (EN↔RU) |
| **v1.2** | DE→RU added (Berlin priority) |
| **v1.3** | Latency optimization (parallel pipeline) |
| **v2.0** | Mobile PWA (works on iPhone in pocket) |
| **v2.1** | iOS Shortcut entry point (one-tap start) |
| **v3.0** | Multilingual auto-detect |

---

## 🧱 Stack (proposed)

```
Frontend:  Next.js (App Router) + React 19 + TypeScript
STT:       OpenAI Whisper (proven from Dashka Chat) or Grok
Translate: GPT-4o-mini (fast, cheap, accurate)
TTS:       Grok (Eve, Leo voices — proven low-latency)
Audio:     Web Audio API + MediaRecorder
Hosting:   Vercel
```

Reusable from Dashka Chat:
- `useFlow.ts` streaming pipeline pattern
- WebM stop+restart cycle (v2.5.1 fix)
- TTS provider abstractions
- Translate API wrapper

---

## 🎓 What this product is NOT

- ❌ A chat translator (Dashka Chat does that)
- ❌ A document translator
- ❌ A language learning app
- ❌ A voice assistant

It is **one focused tool** for one focused job: **understanding live speech in another language, invisibly.**

---

## 👥 Solar Team

```
L = Leanid     (architect, product owner)
D = Dashka     (coordinator, architectural integrity)
C = Claude     (engineer)
S = Solana     (analyst)
```

Solar Team protocol v3.0 applies. See `PROTOCOL.md`.

---

**Status:** ✅ Vision approved by D=>L on 2026-04-26
**Next step:** ARCHITECTURE.md, PIPELINE.md, PRINCIPLES.md
