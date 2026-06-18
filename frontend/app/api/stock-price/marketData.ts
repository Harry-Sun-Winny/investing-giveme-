type MarketQuote = {
  source: string;
  symbol: string;
  price: number;
  currency?: string;
};

export type QuoteHealth = {
  status: "OK" | "WARN" | "ERROR";
  checks: string[];
  sources: string[];
  unavailableSources: string[];
  primarySource: string;
  fallbackUsed: boolean;
  maxDeviationPercent: number | null;
};

const USER_AGENT = "Mozilla/5.0 InvestmentPlatform/0.1";
const MAX_SOURCE_DEVIATION_PERCENT = 1;
const MAX_DAILY_MOVE_PERCENT = 5000;

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function fetchYahooChart(symbol: string, period1: number, period2: number) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}`,
    { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, next: { revalidate: 30 } },
  );
  if (!res.ok) throw new Error(`Yahoo chart ${res.status}`);
  const data = await res.json();
  const result = data.chart?.result?.[0];
  const price = finiteNumber(result?.meta?.regularMarketPrice);
  if (!result || price == null) throw new Error("Yahoo chart missing price");
  return {
    result,
    meta: result.meta,
    quote: {
      source: "yahoo-chart",
      symbol,
      price,
      currency: result.meta?.currency || "USD",
    } satisfies MarketQuote,
  };
}

async function fetchYahooSummary(symbol: string): Promise<MarketQuote> {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=price`,
    { headers: { "User-Agent": USER_AGENT, Accept: "application/json" }, next: { revalidate: 30 } },
  );
  if (!res.ok) throw new Error(`Yahoo summary ${res.status}`);
  const data = await res.json();
  const price = data.quoteSummary?.result?.[0]?.price;
  const raw = finiteNumber(price?.regularMarketPrice?.raw);
  if (raw == null) throw new Error("Yahoo summary missing price");
  return {
    source: "yahoo-summary",
    symbol,
    price: raw,
    currency: price?.currency || "USD",
  };
}

function buildHealth(
  primary: MarketQuote,
  fallbacks: MarketQuote[],
  checks: string[],
  unavailableSources: string[],
): QuoteHealth {
  if (primary.price <= 0) checks.push("Price is zero or negative");
  if (!Number.isFinite(primary.price)) checks.push("Price is not finite");

  let maxDeviationPercent: number | null = null;
  if (primary.price > 0 && fallbacks.length > 0) {
    maxDeviationPercent = Math.max(
      ...fallbacks.map((quote) => Math.abs((quote.price - primary.price) / primary.price) * 100),
    );
    if (maxDeviationPercent > MAX_SOURCE_DEVIATION_PERCENT) {
      checks.push(`Source deviation ${maxDeviationPercent.toFixed(2)}% exceeds ${MAX_SOURCE_DEVIATION_PERCENT}%`);
    }
  }

  return {
    status: checks.length === 0 ? "OK" : "WARN",
    checks,
    sources: [primary, ...fallbacks].map((quote) => quote.source),
    unavailableSources,
    primarySource: primary.source,
    fallbackUsed: primary.source !== "yahoo-chart",
    maxDeviationPercent,
  };
}

export async function getMarketQuote(
  symbol: string,
  targetCurrency: string,
  dateStr: string | null,
  getUsdRate: (currency: string) => Promise<number>,
) {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const endDate = new Date();
  const startDate = new Date(Math.min(targetDate.getTime(), endDate.getTime()));
  startDate.setDate(startDate.getDate() - 5);
  const period1 = Math.floor(startDate.getTime() / 1000);
  const period2 = Math.floor(endDate.getTime() / 1000);
  const checks: string[] = [];
  const unavailableSources: string[] = [];

  let chart: Awaited<ReturnType<typeof fetchYahooChart>> | null = null;
  let primary: MarketQuote;
  try {
    chart = await fetchYahooChart(symbol, period1, period2);
    primary = chart.quote;
  } catch (error) {
    checks.push(String(error));
    primary = await fetchYahooSummary(symbol);
  }

  const fallbacks: MarketQuote[] = [];
  try {
    const fallback = await fetchYahooSummary(symbol);
    if (fallback.source !== primary.source) fallbacks.push(fallback);
  } catch (error) {
    unavailableSources.push(String(error));
  }

  const result = chart?.result;
  const meta = chart?.meta ?? { currency: primary.currency, regularMarketPrice: primary.price };
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  let priceOnDate = primary.price;

  if (dateStr && timestamps.length > 0) {
    const targetTime = new Date(dateStr).getTime();
    let closestIdx = 0;
    let minDiff = Math.abs(timestamps[0] * 1000 - targetTime);
    for (let i = 1; i < timestamps.length; i++) {
      const diff = Math.abs(timestamps[i] * 1000 - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    if (closes[closestIdx] !== null && closes[closestIdx] !== undefined) {
      priceOnDate = closes[closestIdx];
    }
  }

  const sourceCurrency = meta.currency || primary.currency || "USD";
  const fxRate = targetCurrency === "USD" ? await getUsdRate(sourceCurrency) : 1;
  const price = priceOnDate * fxRate;
  const currentPrice = (meta.regularMarketPrice ?? primary.price) * fxRate;
  let previousPrice = priceOnDate;
  if (closes.length >= 2 && closes[closes.length - 2]) {
    previousPrice = closes[closes.length - 2] * fxRate;
  }

  const change = currentPrice - previousPrice;
  const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
  if (Math.abs(changePercent) > MAX_DAILY_MOVE_PERCENT) {
    checks.push(`Unusual price move ${changePercent.toFixed(2)}%`);
  }

  return {
    symbol,
    price,
    currentPrice,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    changeRange: change,
    currency: targetCurrency === "USD" ? "USD" : sourceCurrency,
    sourceCurrency,
    exchangeName: meta.exchangeName,
    date: dateStr || new Date().toISOString().slice(0, 10),
    dataQuality: buildHealth(
      { ...primary, price },
      fallbacks.map((quote) => ({ ...quote, price: quote.price * fxRate })),
      checks,
      unavailableSources,
    ),
  };
}
