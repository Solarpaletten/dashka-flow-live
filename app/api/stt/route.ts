/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║ 📄  app/api/stt/route.ts                                           ║
 * ║ 🏷️  version:  1.0.0                                                ║
 * ║ 👥  author:   Solar Team · Leanid + Claude + Dashka                ║
 * ║                                                                    ║
 * ║ 🎯  Whisper STT proxy — receives WebM audio, returns text          ║
 * ║                                                                    ║
 * ║ 🔑  Lessons inherited from Dashka Chat v2.5.1:                     ║
 * ║     - Whisper accepts webm directly (no repackaging)               ║
 * ║     - temperature=0 prevents hallucinations on silence             ║
 * ║     - language hint speeds up + improves accuracy                  ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from "next/server";

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { status: "error", message: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const language = (formData.get("language") as string) || "en";

    if (!file) {
      return NextResponse.json(
        { status: "error", message: "No audio file provided" },
        { status: 400 }
      );
    }

    // Forward to Whisper
    const whisperForm = new FormData();
    whisperForm.append("file", file, "audio.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", language);
    whisperForm.append("temperature", "0"); // no hallucinations
    whisperForm.append("response_format", "json");

    const res = await fetch(WHISPER_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { status: "error", message: `Whisper ${res.status}: ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text = (data.text || "").trim();

    return NextResponse.json({ status: "ok", text });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "STT failed",
      },
      { status: 500 }
    );
  }
}
