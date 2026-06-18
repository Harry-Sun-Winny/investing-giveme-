import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["EQUITY", "ETF", "CRYPTOCURRENCY", "FUTURE", "MUTUALFUND"];

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 1) return NextResponse.json([]);

  const query = q.trim().toUpperCase();
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    const data = await res.json();
    const results = (data.quotes ?? [])
      .filter((quote: any) => ALLOWED_TYPES.includes(quote.quoteType))
      .map((quote: any, index: number) => ({ quote, index }))
      .sort((a: any, b: any) => rankQuote(a.quote, query, a.index) - rankQuote(b.quote, query, b.index))
      .slice(0, 6)
      .map(({ quote }: any) => ({
        symbol: quote.symbol,
        name: quote.shortname ?? quote.longname ?? quote.symbol,
        type:
          quote.quoteType === "CRYPTOCURRENCY"
            ? "Crypto"
            : quote.quoteType === "FUTURE"
              ? "Hang hoa"
              : quote.quoteType === "MUTUALFUND"
                ? "Quy"
                : quote.quoteType,
      }));
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}

function rankQuote(quote: any, query: string, index: number) {
  const symbol = String(quote.symbol ?? "").toUpperCase();
  let rank = index;

  if (symbol === query) rank -= 1000;
  if (query.length <= 4 && symbol.startsWith(query)) rank -= 20;
  if (query.length <= 4 && quote.quoteType === "EQUITY") rank -= 5;

  return rank;
}
