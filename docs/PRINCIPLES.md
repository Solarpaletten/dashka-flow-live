# 📜 Solar Flow Live — Principles

> The architectural laws that guide every decision.  
> When in doubt, return to this document.

---

## 1. One screen, one job

The product does one thing: **listen, translate, speak into your ear**.

It does not chat. It does not save. It does not learn. It does not analyze.

Every feature request is evaluated against: *"does this add to the one job, or does it dilute it?"*

If it dilutes, it goes into a different product.

---

## 2. Streaming first, batch second

The product is **continuous by default**. Push-to-talk is a fallback, not the primary mode.

If a feature requires the user to press a button each time someone speaks, it does not belong in Solar Flow Live.

---

## 3. The speaker comes first

Latency budget is set by the speaker, not the engineer. Whatever it takes to keep the lag under 4 seconds is what we do.

If a "nice feature" adds 500ms to the pipeline, **the feature loses**.

---

## 4. STT is the source of truth

Whisper hears what was said. We do not "improve" what Whisper transcribes inside the streaming layer. We pass it forward.

If Whisper hallucinates, we mitigate at the **source** (silence detection, temperature=0), not in post-processing.

This is the lesson from Dashka Chat v2.6.1 (Dashka): **"CLEAN must not replace RAW. They are separate layers."**

---

## 5. The pipeline never stops

A failed chunk is **a missing word**, not a broken product. The user is in a live conversation. The system must continue regardless of single failures.

```
✅ Skip the chunk, log the error, keep listening
❌ Show error modal, halt pipeline
```

---

## 6. The user does not see the machinery

The user does not see "STT processing". The user does not see "translating". The user does not see "generating audio".

The user wears AirPods and hears Russian. That is the entire surface.

If the user has to debug the pipeline, the product has failed.

---

## 7. Local rules > LLM polish (until they aren't enough)

For v1, we do not add a CLEAN brain layer. Whisper output goes directly to translate, translate goes directly to TTS.

If we later need polish (grammar, deduplication), we add it as an **optional** layer that the user can toggle off if it adds latency.

---

## 8. Audio out is sacred

Whatever the browser routes to (AirPods, speakers, headphones) is correct. We do not try to override device selection.

We assume: if the user is wearing AirPods, the browser plays into AirPods. If they're on speakers, they accept that.

iOS / Safari restrictions are accepted. We do not work around them by lying to the user.

---

## 9. Privacy is not an afterthought

- No transcripts saved server-side
- No analytics on speech content
- No storage of user audio
- API providers are documented (OpenAI for Whisper, X.AI for TTS)
- Future v2 explores fully on-device for sensitive contexts

---

## 10. The product is invisible

The defining quality of Solar Flow Live is that **no one watching you knows you're using it**.

This means:
- No notification sounds
- No vibrations
- No visible indicators on the front of the phone
- No requirement to look at the screen during use
- One-tap start, one-tap stop

---

## 🧠 Decision filter (when in doubt)

Ask these three questions:

```
1. Does this serve the speaker, or the engineer?
2. Does this make the conversation more natural, or less?
3. Does this remain invisible to others?
```

If the answer to any is "no", the change does not ship.

---

## 🔁 Lessons inherited from Dashka Chat

These were learned painfully across 16 releases on April 25–26, 2026. They apply directly to Solar Flow Live.

```
1. CLEAN ≠ RAW. They are separate layers. (v2.6.1, Dashka)
2. String replacement ≠ sentence reconstruction. (v2.7.0, Dashka)
3. STT does not heal the brain. The brain is its own layer. (v2.6.1)
4. WebM headers break with timeslice. Use stop+restart cycles. (v2.5.1)
5. Whisper hallucinates on silence. Use temperature=0 + RMS gating. (v2.6.0)
6. Pane = инструмент, Flow = наблюдатель. (v3.0, Dashka)
7. "не допилил → остановил → разделил → запланировал" (Dashka, 2026-04-26)
8. Build → Test → Break → Diagnose → Rollback → Stabilize. (v3.0.1)
9. UX has earned brevity. 3 visible buttons + dropdown beats 5 buttons. (v3.0.2)
```

---

## 👥 Solar Team protocol

```
L = Architect    (Leanid)         — sets vision, makes product decisions
D = Coordinator  (Dashka)         — preserves architectural integrity
C = Engineer     (Claude)         — implements with discipline
S = Analyst      (Solana)         — validates assumptions

Communication notation:
  L=>C, C=>L         direct
  D=>C, C=>D         coordination
  C=>D=>L            decision flow
  
Decisions are made by Leanid with Dashka veto on architecture.
Engineering execution is by Claude.
Analysis and validation are by Solana.
```

---

**Status:** ✅ Principles ratified by Solar Team v3.0
**Last updated:** 2026-04-26
