# ⏱ Solar Flow Live — Pipeline & Latency Budget

> **Every millisecond justifies its existence.**

---

## 🎯 Target latency

```
Goal: 2–4 seconds end-to-end (steady-state)
```

For a live conversation to feel natural, the gap between speaker and listener must be small enough that the listener can react on time. Anything above 5 seconds breaks the conversation.

---

## 📊 Latency budget per layer

| Layer | Operation | Target | Realistic | Notes |
|-------|-----------|--------|-----------|-------|
| L1 | Audio capture (chunk size) | 2.0s | 2.0s | Smaller = more API calls; 2s = sweet spot |
| L2 | STT (Whisper) | 700ms | 800–1200ms | Depends on chunk size |
| L3 | Translate (GPT-4o-mini) | 400ms | 400–700ms | Short chunks = fast |
| L4 | TTS (Grok) | 600ms | 600–900ms | Eve voice tested |
| L5 | Audio playback start | 100ms | 100ms | Browser native |
| **Total (sequential)** | | **~3.8s** | **~4.4s** | First chunk only |
| **Steady-state** | (parallel pipeline) | **~2.5s** | **~3s** | Chunk N processes while N+1 records |

---

## 🔄 Sequential vs parallel

### Sequential (naive — DON'T do this)

```
[REC 2s][STT 1s][TRA 0.6s][TTS 0.8s][PLAY 2s]
                                              [REC 2s][STT 1s]...
                                              ↑
                                      Speaker waits while you process
```

User experience: gap between speech and translation = ~4.4s, **AND** gaps between translations.

### Parallel (correct)

```
Chunk 1: [REC 2s][STT 1s][TRA 0.6s][TTS 0.8s][PLAY 2s]
Chunk 2:         [REC 2s][STT 1s ][TRA 0.6s][TTS 0.8s][PLAY 2s]
Chunk 3:                  [REC 2s][STT 1s ][TRA 0.6s][TTS 0.8s][PLAY]
                                                                 ↑
                                                       Continuous output
```

User experience: continuous Russian output, **3-second lag** behind speaker. This feels like simultaneous interpretation.

---

## 🔧 Implementation requirements

### Recording layer

```typescript
// Continuous recording with overlapping cycles
let recorder: MediaRecorder;
let chunkQueue: Promise<void>[] = [];

function startRecorderCycle() {
  recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
  
  recorder.ondataavailable = async (e) => {
    if (e.data.size > 0) {
      // Don't await — fire-and-forget into pipeline
      const chunkPromise = processChunk(e.data);
      chunkQueue.push(chunkPromise);
    }
  };
  
  recorder.onstop = () => {
    if (isLive) startRecorderCycle(); // restart immediately
  };
  
  recorder.start();
  setTimeout(() => recorder.stop(), CHUNK_MS);
}
```

### Pipeline (parallel)

```typescript
async function processChunk(blob: Blob): Promise<void> {
  // All three calls fire-and-await in sequence, but
  // multiple chunks can be in-flight simultaneously
  
  const text = await stt(blob);              // ~1s
  if (!text) return;
  
  const translated = await translate(text);  // ~0.5s
  if (!translated) return;
  
  const audio = await tts(translated);       // ~0.8s
  
  audioQueue.enqueue(audio);                 // ~0ms (just queue)
}
```

### Audio queue (FIFO)

```typescript
class AudioQueue {
  private queue: Blob[] = [];
  private playing = false;
  
  enqueue(blob: Blob) {
    this.queue.push(blob);
    if (!this.playing) this.playNext();
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
      this.playNext();
    };
    await audio.play();
  }
}
```

---

## 🧪 Latency measurement

Each chunk should log timestamps:

```typescript
{
  chunkId: 42,
  recStart: 1714137600000,
  recEnd:   1714137602000,  // +2.0s
  sttStart: 1714137602010,
  sttEnd:   1714137603100,  // +1.09s
  traStart: 1714137603110,
  traEnd:   1714137603620,  // +0.51s
  ttsStart: 1714137603630,
  ttsEnd:   1714137604470,  // +0.84s
  playStart:1714137604480,  // total: 4.48s sequential
}
```

Build a dashboard early. **You cannot optimize what you cannot measure.**

---

## 🚨 Latency red flags

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| First-chunk lag > 6s | Cold serverless function | Pre-warm endpoints |
| Steady-state lag growing | Audio queue backing up | Drop old chunks; reduce chunk size |
| TTS slower than STT | Long source text | Translate produces too much; shorten chunks |
| Whisper returns empty | Silence chunks | Skip silent chunks (RMS threshold) |

---

## 🎯 Accept-the-truth principles

```
1. We will never have <1s latency in v1.
   That's fine. The goal is "natural conversation feel", not "instant".

2. STT is the longest step. Optimize chunk size, not API call.

3. Some chunks will fail. The pipeline must continue.

4. Audio queue can lag behind STT. That's by design. Don't try to "catch up".

5. The user prefers a 4-second smooth flow over a 1-second stuttering flow.
```

---

## 📈 Future optimizations (v2+)

| Idea | Effect | Complexity |
|------|--------|------------|
| Whisper streaming (chunked transfer) | -300ms | High |
| TTS streaming (start playing while generating) | -400ms | High |
| Translate via single GPT call with batching | +100ms | Low |
| Voice activity detection (skip silent chunks) | -1.0s on average | Medium |
| On-device Whisper (mobile) | -500ms + privacy | Very high |

---

**Status:** ✅ Pipeline plan approved
**Next:** PRINCIPLES.md
