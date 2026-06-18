import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages không hợp lệ" }, { status: 400 });
    }

    const conversation = messages
      .map((m: any) => `${m.role}: ${m.content}`)
      .join("\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `Bạn là trợ lý đầu tư tài chính chuyên nghiệp.
Yêu cầu:
- Trả lời bằng tiếng Việt.
- Ngắn gọn, dễ hiểu.
- Không đưa ra lời khuyên mua bán cụ thể.
- Chỉ phân tích và giải thích.`,
        messages: [{ role: "user", content: conversation }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API error");
    }

    const disclaimer = "\n\nLưu ý: Thông tin chỉ mang tính tham khảo, không phải lời khuyên đầu tư và không khuyến nghị mua/bán tuyệt đối.";

    return NextResponse.json({
      content: `${data.content[0].text}${disclaimer}`,
    });
  } catch (error: any) {
    console.error("Claude Error:", error);
    return NextResponse.json(
      { error: error?.message || "Request failed" },
      { status: 500 }
    );
  }
}
