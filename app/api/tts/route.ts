/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║ 📄  app/api/tts/route.ts                                           ║
 * ║ 🏷️  version:  1.0.0                                                ║
 * ║ 👥  author:   Solar Team · Leanid + Claude + Dashka                ║
 * ║                                                                    ║
 * ║ 🎯  Grok TTS proxy — text → MP3                                    ║
 * ║     Voices: Eve (RU/F), Leo (EN/M), Ara (RU/F)                     ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from "next/server";

const GROK_TTS_URL = "https://api.x.ai/v1/audio/speech";

export async function POST(req: NextRequest) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { status: "error", message: "XAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const text: string = body.text || "";
    const voice: string = body.voice || "Eve";

    if (!text.trim()) {
      return NextResponse.json(
        { status: "error", message: "No text provided" },
        { status: 400 }
      );
    }

    const res = await fetch(GROK_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-tts",
        voice,
        input: text,
        response_format: "mp3",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { status: "error", message: `Grok TTS ${res.status}: ${errText}` },
        { status: res.status }
      );
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "TTS failed",
      },
      { status: 500 }
    );
  }
}
