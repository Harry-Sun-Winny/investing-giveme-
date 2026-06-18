import { NextRequest, NextResponse } from "next/server";

const USER_AGENT = "Mozilla/5.0 InvestmentPlatform/0.1";
const RANGE_MAP: Record<string, string> = {
  "1M": "1mo",
  "3M": "3mo",
  "6M": "6mo",
  YTD: "ytd",
  "1Y": "1y",
  "3Y": "3y",
  "5Y": "5y",
  Max: "max",
};

const SYMBOL_ALIASES: Record<string, string> = {
  INTEL: "INTC",
  TSMC: "TSM",
  FOXCONN: "2317.TW",
  HONHAI: "2317.TW",
  "HON HAI": "2317.TW",
  MEDIATEK: "2454.TW",
  UMC: "UMC",
  ASE: "ASX",
};

function getSymbolCandidates(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  const alias = SYMBOL_ALIASES[normalized] ?? normalized;
  if (alias.includes(".")) return [alias];
  if (/^\d{4,6}$/.test(alias)) return [`${alias}.TW`, `${alias}.TWO`, alias];
  return [alias];
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function fetchHistory(symbol: string, range: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}&events=history`,
    { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, next: { revalidate: 300 } },
  );
  if (!res.ok) throw new Error(`Yahoo history ${res.status}`);
  const data = await res.json();
  const result = data.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0] ?? {};
  const adjClose = result?.indicators?.adjclose?.[0]?.adjclose ?? [];
  if (!result || timestamps.length === 0) throw new Error("Yahoo history missing data");

  const points = timestamps
    .map((timestamp, index) => {
      const close = finiteNumber(quote.close?.[index]);
      const adjustedClose = finiteNumber(adjClose?.[index]) ?? close;
      const volume = finiteNumber(quote.volume?.[index]);
      if (close == null && adjustedClose == null) return null;
      return {
        date: new Date(timestamp * 1000).toISOString().slice(0, 10),
        close,
        adjustedClose,
        volume,
      };
    })
    .filter(Boolean);

  return {
    symbol,
    currency: result.meta?.currency || "USD",
    exchangeName: result.meta?.exchangeName,
    points,
  };
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const rangeParam = req.nextUrl.searchParams.get("range") || "5Y";
  const range = RANGE_MAP[rangeParam] ?? RANGE_MAP["5Y"];

  if (!symbol) return NextResponse.json({ error: "No symbol" }, { status: 400 });

  let lastError: unknown = null;
  for (const candidate of getSymbolCandidates(symbol)) {
    try {
      const history = await fetchHistory(candidate, range);
      return NextResponse.json({ ...history, requestedSymbol: symbol, resolvedSymbol: candidate });
    } catch (error) {
      lastError = error;
    }
  }

  return NextResponse.json({ error: "Failed", details: String(lastError) }, { status: 500 });
}
