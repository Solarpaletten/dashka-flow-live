/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║ 📄  lib/pipeline.ts                                                ║
 * ║ 🏷️  version:  1.0.0                                                ║
 * ║ 👥  author:   Solar Team · Leanid + Claude + Dashka                ║
 * ║                                                                    ║
 * ║ 🎯  Pipeline — STT → Translate → TTS                               ║
 * ║                                                                    ║
 * ║     Each chunk flows through this pipeline independently.          ║
 * ║     Failures are non-fatal: a bad chunk is a missing word, not a   ║
 * ║     broken product (PRINCIPLES.md #5).                             ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

export interface PipelineConfig {
  sourceLang: string; // "en", "de", "ru"
  targetLang: string; // "ru", "en"
  voice: string; // Grok voice — "Eve" for RU, "Leo" for EN
}

export interface PipelineResult {
  source: string;
  translated: string;
  audioBlob: Blob;
  timings: {
    sttMs: number;
    translateMs: number;
    ttsMs: number;
    totalMs: number;
  };
}

async function stt(blob: Blob, language: string): Promise<string> {
  const form = new FormData();
  form.append("file", blob, "chunk.webm");
  form.append("language", language);

  const res = await fetch("/api/stt", { method: "POST", body: form });
  if (!res.ok) throw new Error(`STT ${res.status}`);
  const data = await res.json();
  if (data.status !== "ok") throw new Error(data.message || "STT failed");
  return (data.text || "").trim();
}

async function translate(
  text: string,
  source: string,
  target: string
): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      source_language: source,
      target_language: target,
    }),
  });
  if (!res.ok) throw new Error(`Translate ${res.status}`);
  const data = await res.json();
  if (data.status !== "ok") throw new Error(data.message || "Translate failed");
  return (data.translated_text || "").trim();
}

async function tts(text: string, voice: string): Promise<Blob> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}`);
  return await res.blob();
}

/**
 * Process a single audio chunk through the full pipeline.
 * Returns null for non-fatal cases (silent chunk, empty result).
 * Throws only for unexpected errors that the caller should handle.
 */
export async function processChunk(
  audioBlob: Blob,
  config: PipelineConfig
): Promise<PipelineResult | null> {
  const t0 = performance.now();

  // 1. STT
  const tStt = performance.now();
  let sourceText: string;
  try {
    sourceText = await stt(audioBlob, config.sourceLang);
  } catch (err) {
    console.warn("[pipeline] STT failed, skipping chunk", err);
    return null;
  }
  const sttMs = performance.now() - tStt;

  if (!sourceText || sourceText.length < 2) {
    return null; // silent or non-speech chunk
  }

  // 2. Translate
  const tTrans = performance.now();
  let translated: string;
  try {
    translated = await translate(sourceText, config.sourceLang, config.targetLang);
  } catch (err) {
    console.warn("[pipeline] Translate failed, skipping chunk", err);
    return null;
  }
  const translateMs = performance.now() - tTrans;

  if (!translated) return null;

  // 3. TTS
  const tTts = performance.now();
  let audioOut: Blob;
  try {
    audioOut = await tts(translated, config.voice);
  } catch (err) {
    console.warn("[pipeline] TTS failed, skipping chunk", err);
    return null;
  }
  const ttsMs = performance.now() - tTts;

  const totalMs = performance.now() - t0;

  return {
    source: sourceText,
    translated,
    audioBlob: audioOut,
    timings: { sttMs, translateMs, ttsMs, totalMs },
  };
}
