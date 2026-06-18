import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ sector: "Khác" });

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
      { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }, next: { revalidate: 0 } }
    );
    const data = await res.json();
    console.log("Yahoo quote raw:", JSON.stringify(data).slice(0, 500));
    const quote = data.quoteResponse?.result?.[0];
    const sector = quote?.sector ?? quote?.industry ?? "Khác";
    return NextResponse.json({ sector, raw: quote });
  } catch (e) {
    return NextResponse.json({ sector: "Khác", error: String(e) });
  }
}