import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: body.messages,
      max_tokens: 1000,
    }),
  });
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return NextResponse.json({ content: [{ text }] });
}