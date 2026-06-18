import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { title, summary } = await req.json();
  const content = summary ? `${title}. ${summary}` : title;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{
          role: "user",
          content: `Tóm tắt tin tức sau thành 2 dòng: 1 dòng tiếng Anh, 1 dòng tiếng Việt. Chỉ trả về đúng 2 dòng, không thêm gì khác.\n\n${content}`
        }]
      })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    const lines = text.trim().split("\n").filter(Boolean);
    return NextResponse.json({ en: lines[0] ?? title, vi: lines[1] ?? "" });
  } catch {
    return NextResponse.json({ en: title, vi: "" });
  }
}