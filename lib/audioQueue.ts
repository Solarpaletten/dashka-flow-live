/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║ 📄  lib/audioQueue.ts                                              ║
 * ║ 🏷️  version:  1.0.0                                                ║
 * ║ 👥  author:   Solar Team · Leanid + Claude + Dashka                ║
 * ║                                                                    ║
 * ║ 🎯  AudioQueue — FIFO playback queue                               ║
 * ║                                                                    ║
 * ║ 💎  This is the heart of the product (Dashka):                     ║
 * ║     "Without this — caша in your ears."                            ║
 * ║                                                                    ║
 * ║     Pipeline produces MP3 blobs faster than they play.             ║
 * ║     Queue ensures they play sequentially, in order, into the       ║
 * ║     user's audio output (AirPods routed automatically by browser). ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

export interface QueueItem {
  blob: Blob;
  id: number;
  meta?: {
    source?: string;
    translated?: string;
  };
}

export type QueueListener = (event: QueueEvent) => void;

export type QueueEvent =
  | { type: "enqueued"; size: number }
  | { type: "started"; item: QueueItem }
  | { type: "ended"; item: QueueItem; remaining: number }
  | { type: "error"; item: QueueItem | null; error: Error }
  | { type: "drained" };

export class AudioQueue {
  private queue: QueueItem[] = [];
  private playing = false;
  private currentAudio: HTMLAudioElement | null = null;
  private currentItem: QueueItem | null = null;
  private listeners: QueueListener[] = [];
  private nextId = 1;

  enqueue(blob: Blob, meta?: QueueItem["meta"]): number {
    const item: QueueItem = { blob, id: this.nextId++, meta };
    this.queue.push(item);
    this.emit({ type: "enqueued", size: this.queue.length });
    if (!this.playing) {
      void this.playNext();
    }
    return item.id;
  }

  clear(): void {
    this.queue = [];
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.src = "";
      } catch {}
    }
    this.currentAudio = null;
    this.currentItem = null;
    this.playing = false;
  }

  size(): number {
    return this.queue.length;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  currentlyPlaying(): QueueItem | null {
    return this.currentItem;
  }

  on(listener: QueueListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: QueueEvent): void {
    for (const l of this.listeners) {
      try {
        l(event);
      } catch (err) {
        console.error("AudioQueue listener error", err);
      }
    }
  }

  private async playNext(): Promise<void> {
    if (this.queue.length === 0) {
      this.playing = false;
      this.currentItem = null;
      this.emit({ type: "drained" });
      return;
    }

    this.playing = true;
    const item = this.queue.shift()!;
    this.currentItem = item;

    const url = URL.createObjectURL(item.blob);
    const audio = new Audio(url);
    this.currentAudio = audio;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      this.currentAudio = null;
    };

    audio.onended = () => {
      cleanup();
      this.emit({ type: "ended", item, remaining: this.queue.length });
      void this.playNext();
    };

    audio.onerror = () => {
      cleanup();
      this.emit({
        type: "error",
        item,
        error: new Error("Audio playback failed"),
      });
      void this.playNext();
    };

    this.emit({ type: "started", item });

    try {
      await audio.play();
    } catch (err) {
      cleanup();
      this.emit({
        type: "error",
        item,
        error: err instanceof Error ? err : new Error("audio.play() rejected"),
      });
      void this.playNext();
    }
  }
}
