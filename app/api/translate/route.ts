/**
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║ 📄  app/api/translate/route.ts                                     ║
 * ║ 🏷️  version:  1.0.0                                                ║
 * ║ 👥  author:   Solar Team · Leanid + Claude + Dashka                ║
 * ║                                                                    ║
 * ║ 🎯  GPT-4o-mini translation — fast, cheap, accurate                ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from "next/server";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const LANG_NAME: Record<string, string> = {
  en: "English",
  ru: "Russian",
  de: "German",
  fr: "French",
  es: "Spanish",
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { status: "error", message: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const text: string = body.text || "";
    const sourceLang: string = body.source_language || "en";
    const targetLang: string = body.target_language || "ru";

    if (!text.trim()) {
      return NextResponse.json({ status: "ok", translated_text: "" });
    }

    const sourceName = LANG_NAME[sourceLang] || sourceLang;
    const targetName = LANG_NAME[targetLang] || targetLang;

    const systemPrompt = `You are a professional simultaneous interpreter. Translate the ${sourceName} input into natural ${targetName}. Preserve tone, register, and meaning. Output ONLY the translation, no commentary, no quotes.`;

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { status: "error", message: `GPT ${res.status}: ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const translated = (data.choices?.[0]?.message?.content || "").trim();

    return NextResponse.json({
      status: "ok",
      translated_text: translated,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "Translate failed",
      },
      { status: 500 }
    );
  }
}
