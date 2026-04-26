/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║ 📄  app/page.tsx                                                   ║
 * ║ 🏷️  version:  1.0.0                                                ║
 * ║ 👥  author:   Solar Team · Leanid + Claude + Dashka                ║
 * ║                                                                    ║
 * ║ 🎯  Solar Flow Live — single screen MVP                            ║
 * ║                                                                    ║
 * ║     One screen. One job. Listen, translate, speak in your ear.     ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import LiveButton from "@/components/LiveButton";
import { ChunkRecorder } from "@/lib/recorder";
import { AudioQueue } from "@/lib/audioQueue";
import { processChunk, type PipelineConfig } from "@/lib/pipeline";

interface RecentPair {
  id: number;
  source: string;
  translated: string;
  latencyMs: number;
}

const DIRECTIONS = [
  { id: "en-ru", label: "EN → RU", source: "en", target: "ru", voice: "Eve" },
  { id: "de-ru", label: "DE → RU", source: "de", target: "ru", voice: "Eve" },
  { id: "ru-en", label: "RU → EN", source: "ru", target: "en", voice: "Leo" },
] as const;

type DirectionId = (typeof DIRECTIONS)[number]["id"];

export default function Home() {
  const [isLive, setIsLive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<DirectionId>("en-ru");
  const [recent, setRecent] = useState<RecentPair[]>([]);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);

  const recorderRef = useRef<ChunkRecorder | null>(null);
  const queueRef = useRef<AudioQueue | null>(null);
  const directionRef = useRef<DirectionId>(direction);
  const idCounterRef = useRef(0);

  // Keep directionRef in sync (used inside async chunk callbacks)
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Initialize queue once
  useEffect(() => {
    queueRef.current = new AudioQueue();
    return () => {
      queueRef.current?.clear();
    };
  }, []);

  const currentConfig = useCallback((): PipelineConfig => {
    const d = DIRECTIONS.find((x) => x.id === directionRef.current)!;
    return {
      sourceLang: d.source,
      targetLang: d.target,
      voice: d.voice,
    };
  }, []);

  const handleChunk = useCallback(
    async (blob: Blob) => {
      const config = currentConfig();
      try {
        const result = await processChunk(blob, config);
        if (!result) return;

        queueRef.current?.enqueue(result.audioBlob, {
          source: result.source,
          translated: result.translated,
        });

        setLastLatencyMs(Math.round(result.timings.totalMs));
        setRecent((prev) => {
          const next: RecentPair = {
            id: ++idCounterRef.current,
            source: result.source,
            translated: result.translated,
            latencyMs: Math.round(result.timings.totalMs),
          };
          return [next, ...prev].slice(0, 3);
        });
      } catch (err) {
        console.error("Chunk processing error", err);
      }
    },
    [currentConfig]
  );

  const handleStart = useCallback(async () => {
    if (isLive || isStarting) return;
    setError(null);
    setIsStarting(true);

    try {
      const recorder = new ChunkRecorder({
        chunkMs: 2500,
        onChunk: handleChunk,
        onError: (err) => {
          setError(err.message);
        },
      });
      await recorder.start();
      recorderRef.current = recorder;
      setIsLive(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось получить доступ к микрофону"
      );
    } finally {
      setIsStarting(false);
    }
  }, [isLive, isStarting, handleChunk]);

  const handleStop = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    queueRef.current?.clear();
    setIsLive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      queueRef.current?.clear();
    };
  }, []);

  return (
    <main className="page">
      <div className="container">
        <header className="header">
          <h1 className="title">
            🎧 Solar Flow Live
          </h1>
          <p className="subtitle">personal real-time translation in your ear</p>
        </header>

        <div className="direction-selector">
          <label htmlFor="direction-select">Direction:</label>
          <select
            id="direction-select"
            value={direction}
            onChange={(e) => setDirection(e.target.value as DirectionId)}
            disabled={isLive}
            className="direction-select"
          >
            {DIRECTIONS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="status">
          <span className={`status-dot ${isLive ? "is-live" : ""}`} />
          <span className="status-text">
            {isLive ? "L I V E" : isStarting ? "starting…" : "idle"}
          </span>
        </div>

        <LiveButton
          isLive={isLive}
          isStarting={isStarting}
          onStart={handleStart}
          onStop={handleStop}
        />

        {error && <div className="error-banner">⚠ {error}</div>}

        {lastLatencyMs !== null && (
          <div className="latency">
            Latency: ~{(lastLatencyMs / 1000).toFixed(1)}s
          </div>
        )}

        {recent.length > 0 && (
          <section className="recent">
            <h2 className="recent-title">Recent</h2>
            <div className="recent-list">
              {recent.map((pair) => (
                <div key={pair.id} className="recent-pair">
                  <div className="recent-source">{pair.source}</div>
                  <div className="recent-translated">→ {pair.translated}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="footer">
          <small>Solar Flow Live · v1.0 · Solar Team 🚀</small>
        </footer>
      </div>
    </main>
  );
}
