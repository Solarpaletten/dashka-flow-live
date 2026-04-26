/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║ 📄  lib/recorder.ts                                                ║
 * ║ 🏷️  version:  1.0.0                                                ║
 * ║ 👥  author:   Solar Team · Leanid + Claude + Dashka                ║
 * ║                                                                    ║
 * ║ 🎯  ChunkRecorder — continuous 2-second WebM chunks                ║
 * ║                                                                    ║
 * ║ 🔑  Critical lesson from Dashka Chat v2.5.1:                       ║
 * ║     MediaRecorder.start(timeslice) produces broken WebM chunks.    ║
 * ║     Solution: stop+restart cycle every CHUNK_MS produces clean     ║
 * ║     WebM blobs that Whisper can decode.                            ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

export const DEFAULT_CHUNK_MS = 2000;

export type RecorderState = "idle" | "starting" | "recording" | "stopping";

export interface ChunkRecorderOptions {
  chunkMs?: number;
  onChunk: (blob: Blob) => void;
  onError?: (err: Error) => void;
}

export class ChunkRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private state: RecorderState = "idle";
  private chunkMs: number;
  private onChunk: (blob: Blob) => void;
  private onError?: (err: Error) => void;
  private cycleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: ChunkRecorderOptions) {
    this.chunkMs = options.chunkMs ?? DEFAULT_CHUNK_MS;
    this.onChunk = options.onChunk;
    this.onError = options.onError;
  }

  async start(): Promise<void> {
    if (this.state !== "idle") return;
    this.state = "starting";

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.state = "recording";
      this.cycle();
    } catch (err) {
      this.state = "idle";
      this.onError?.(err instanceof Error ? err : new Error("getUserMedia failed"));
      throw err;
    }
  }

  stop(): void {
    if (this.state === "idle") return;
    this.state = "stopping";

    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }

    try {
      if (this.recorder && this.recorder.state !== "inactive") {
        this.recorder.stop();
      }
    } catch {}

    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.recorder = null;
    this.state = "idle";
  }

  isActive(): boolean {
    return this.state === "recording";
  }

  private cycle(): void {
    if (this.state !== "recording" || !this.stream) return;

    let mimeType = "audio/webm;codecs=opus";
    if (typeof MediaRecorder !== "undefined" && !MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        this.onError?.(new Error("WebM not supported in this browser"));
        this.stop();
        return;
      }
    }

    const rec = new MediaRecorder(this.stream, { mimeType });
    this.recorder = rec;

    const chunks: Blob[] = [];

    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    rec.onstop = () => {
      // Combine chunks into single blob
      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size > 1000) {
          // Only forward chunks with real audio (not just headers)
          try {
            this.onChunk(blob);
          } catch (err) {
            this.onError?.(err instanceof Error ? err : new Error("onChunk failed"));
          }
        }
      }
      // Restart cycle immediately if still recording
      if (this.state === "recording") {
        this.cycle();
      }
    };

    rec.onerror = (e: Event) => {
      const errEvent = e as Event & { error?: Error };
      this.onError?.(errEvent.error ?? new Error("MediaRecorder error"));
    };

    rec.start();

    this.cycleTimer = setTimeout(() => {
      try {
        if (rec.state === "recording") rec.stop();
      } catch {}
    }, this.chunkMs);
  }
}
