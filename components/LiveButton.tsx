/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║ 📄  components/LiveButton.tsx                                      ║
 * ║ 🏷️  version:  1.0.0                                                ║
 * ║ 👥  author:   Solar Team · Leanid + Claude + Dashka                ║
 * ║                                                                    ║
 * ║ 🎯  Big single button — START / STOP                               ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

"use client";

interface LiveButtonProps {
  isLive: boolean;
  isStarting: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function LiveButton({
  isLive,
  isStarting,
  onStart,
  onStop,
}: LiveButtonProps) {
  if (isStarting) {
    return (
      <button className="live-btn live-btn-starting" disabled>
        <span className="spinner" />
        <span>Запрашиваю микрофон…</span>
      </button>
    );
  }

  if (isLive) {
    return (
      <button className="live-btn live-btn-stop" onClick={onStop}>
        <span className="btn-icon">⏸</span>
        <span>STOP</span>
      </button>
    );
  }

  return (
    <button className="live-btn live-btn-start" onClick={onStart}>
      <span className="btn-icon">▶</span>
      <span>START LIVE</span>
    </button>
  );
}
