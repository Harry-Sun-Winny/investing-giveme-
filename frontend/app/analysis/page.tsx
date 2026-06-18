"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart3, Bot, LogOut, RefreshCw, User,
  TrendingUp, TrendingDown, AlertTriangle, Trophy, Skull,
  PieChart, Target, Zap, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { getPortfolios, getStockPrice, getTransactions, Portfolio } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StockData { symbol: string; price: number; change: number; changePercent: number; }
interface PositionSummary {
  symbol: string; name: string; quantity: number;
  avgPrice: number; currentPrice: number;
  value: number; pnl: number; pnlPct: number;
  priced: boolean;
}
type SortKey = "symbol" | "value" | "pnl" | "pnlPct" | "weight";
type SortDir = "asc" | "desc";

// ─── Risk scoring (0-100) ─────────────────────────────────────────────────────
function calcRiskScore(positions: PositionSummary[]): number {
  if (!positions.length) return 0;
  const totalValue = positions.reduce((s, p) => s + p.value, 0);
  if (!totalValue) return 0;
  // HHI concentration index (0-1) → contributes up to 50pts
  const hhi = positions.reduce((s, p) => s + Math.pow(p.value / totalValue, 2), 0);
  const concentrationScore = hhi * 50;
  // Average absolute pnlPct volatility → contributes up to 50pts
  const avgVolatility = positions.reduce((s, p) => s + Math.abs(p.pnlPct), 0) / positions.length;
  const volatilityScore = Math.min(avgVolatility / 2, 50);
  return Math.round(concentrationScore + volatilityScore);
}

function riskLabel(score: number): { label: string; color: string; bg: string } {
  if (score < 25) return { label: "Thấp", color: "text-green-400", bg: "bg-green-500" };
  if (score < 50) return { label: "Trung bình", color: "text-yellow-400", bg: "bg-yellow-400" };
  if (score < 75) return { label: "Cao", color: "text-orange-400", bg: "bg-orange-400" };
  return { label: "Rất cao", color: "text-red-400", bg: "bg-red-500" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const fmt = (n: unknown, d = 2) => isNum(n) ? n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "N/A";
const pct = (n: unknown) => isNum(n) ? `${n >= 0 ? "+" : ""}${n.toFixed(2)}%` : "N/A";

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [positions, setPositions] = useState<PositionSummary[]>([]);
  const [prices, setPrices] = useState<Record<string, StockData>>({});
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem("token")) { window.location.href = "/login"; return; }
    getPortfolios().then(p => {
      setPortfolios(p);
      if (p.length > 0) setSelectedId(p[0].id);
    });
  }, []);

  useEffect(() => { if (selectedId) loadPositions(selectedId); }, [selectedId]);

  // ── Data loading ────────────────────────────────────────────────────────────
  async function loadPositions(portfolioId: string) {
    try {
      const txs = await getTransactions(portfolioId);
      const map: Record<string, { name: string; qty: number; cost: number }> = {};
      for (const t of txs) {
        if (!map[t.assetSymbol]) map[t.assetSymbol] = { name: t.assetName, qty: 0, cost: 0 };
        if (t.type === "BUY") { map[t.assetSymbol].qty += t.quantity; map[t.assetSymbol].cost += t.quantity * t.price; }
        else { map[t.assetSymbol].qty -= t.quantity; map[t.assetSymbol].cost -= t.quantity * t.price; }
      }
      const pos: PositionSummary[] = Object.entries(map)
        .filter(([, v]) => v.qty > 0)
        .map(([sym, v]) => ({ symbol: sym, name: v.name, quantity: v.qty, avgPrice: v.cost / v.qty, currentPrice: 0, value: 0, pnl: 0, pnlPct: 0, priced: false }));
      setPositions(pos);
      if (pos.length > 0) fetchPrices(pos.map(p => p.symbol));
    } catch (e: any) { setError(e.message); }
  }

  async function fetchPrices(symbols: string[]) {
    setPriceLoading(true);
    const results: Record<string, StockData> = {};
    await Promise.all(symbols.map(async s => { const d = await getStockPrice(s); if (d) results[s] = d; }));
    setPrices(results);
    setPositions(prev => prev.map(p => {
      const d = results[p.symbol];
      if (!isNum(d?.price)) return { ...p, priced: false };
      const value = p.quantity * d.price;
      const pnl = value - p.quantity * p.avgPrice;
      return { ...p, currentPrice: d.price, value, pnl, pnlPct: (pnl / (p.quantity * p.avgPrice)) * 100, priced: true };
    }));
    setPriceLoading(false);
  }

  // ── AI Analysis ─────────────────────────────────────────────────────────────
  async function runAiAnalysis() {
    setLoading(true); setAiAnalysis(""); setError("");
    try {
      const portfolio = portfolios.find(p => p.id === selectedId);
      const positionText = positions.map(p => {
        const d = prices[p.symbol];
        return `${p.symbol} (${p.name}): ${p.quantity} cổ phiếu, giá TB ${fmt(p.avgPrice)}, giá hiện tại ${d?.price?.toFixed(2) ?? "N/A"}, P&L ${fmt(p.pnl)} (${pct(p.pnlPct)})`;
      }).join("\n");
      const pricedPositions = positions.filter(p => p.priced);
      const totalValue = pricedPositions.reduce((s, p) => s + p.value, 0);
      const totalPnl = pricedPositions.reduce((s, p) => s + p.pnl, 0);
      const riskScore = calcRiskScore(pricedPositions);

      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Bạn là chuyên gia tài chính. Hãy phân tích rủi ro danh mục đầu tư bằng tiếng Việt, ngắn gọn và súc tích.

Portfolio: ${portfolio?.name} (${portfolio?.baseCurrency})
Tổng giá trị: $${fmt(totalValue)}
Tổng P&L: ${fmt(totalPnl)} (${totalPnl >= 0 ? "lãi" : "lỗ"})
Risk Score: ${riskScore}/100

Vị thế:
${positionText}

Hãy đưa ra:
1. Đánh giá tổng quan (2-3 câu)
2. Rủi ro chính cần chú ý (2-3 điểm)
3. Khuyến nghị hành động cụ thể (2-3 điểm)`,
          }],
        }),
      });
      const data = await res.json();
      if (data.content?.[0]) setAiAnalysis(data.content[0].text);
      else setError("AI không trả về kết quả. Cần cấu hình API key.");
    } catch (e: any) { setError("Lỗi AI: " + e.message); }
    setLoading(false);
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const pricedPositions = useMemo(() => positions.filter(p => p.priced), [positions]);
  const missingPriceCount = positions.length - pricedPositions.length;
  const hasPricedPositions = pricedPositions.length > 0;
  const totalValue = hasPricedPositions ? pricedPositions.reduce((s, p) => s + p.value, 0) : null;
  const totalPnl   = hasPricedPositions ? pricedPositions.reduce((s, p) => s + p.pnl, 0) : null;
  const totalCost  = pricedPositions.reduce((s, p) => s + p.quantity * p.avgPrice, 0);
  const totalPnlPct = hasPricedPositions && totalCost > 0 && isNum(totalPnl) ? (totalPnl / totalCost) * 100 : null;
  const riskScore  = hasPricedPositions ? calcRiskScore(pricedPositions) : null;
  const riskScoreValue = riskScore ?? 0;
  const risk       = riskLabel(riskScoreValue);

  const winner = useMemo(() => pricedPositions.reduce((best, p) => (!best || p.pnlPct > best.pnlPct ? p : best), null as PositionSummary | null), [pricedPositions]);
  const loser  = useMemo(() => pricedPositions.reduce((worst, p) => (!worst || p.pnlPct < worst.pnlPct ? p : worst), null as PositionSummary | null), [pricedPositions]);

  // ── Sort ─────────────────────────────────────────────────────────────────────
  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }
  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      const weight = (p: PositionSummary) => p.priced && isNum(totalValue) && totalValue > 0 ? p.value / totalValue : 0;
      const av = sortKey === "weight" ? weight(a) : (a as any)[sortKey];
      const bv = sortKey === "weight" ? weight(b) : (b as any)[sortKey];
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [positions, sortKey, sortDir, totalValue]);

  // ── Sort icon ────────────────────────────────────────────────────────────────
  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-[#54a0ff]" /> : <ArrowDown className="h-3 w-3 text-[#54a0ff]" />;
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell flex">
      {/* ── Sidebar ── */}
      <aside className="app-sidebar fixed flex h-full w-64 flex-col gap-2 p-5">
        <div className="mb-10 px-2">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded rainbow-bg text-xs font-black text-white">↗</span>
            <h1 className="text-xl font-black text-white">Investment</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">Platform</p>
        </div>
        <button onClick={() => window.location.href = "/"} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-[#54a0ff]"><BarChart3 className="h-4 w-4" />Dashboard</button>
        <button className="flex items-center gap-3 rounded-lg rainbow-bg px-4 py-3 text-sm font-bold text-white"><Bot className="h-4 w-4" />AI Analysis</button>
        <button onClick={() => window.location.href = "/account"} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-[#54a0ff]"><User className="h-4 w-4" />Tài khoản</button>
        <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }} className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400"><LogOut className="h-4 w-4" />Đăng xuất</button>
      </aside>

      {/* ── Main ── */}
      <main className="ml-64 flex-1 p-8">
        <div className="mx-auto max-w-5xl">

          {/* Header */}
          <div className="mb-7">
            <p className="text-sm font-medium text-[#54a0ff]">Phân tích thông minh</p>
            <h2 className="mt-2 text-3xl font-black rainbow-text">AI Risk Analysis</h2>
          </div>

          {/* Portfolio selector */}
          <div className="app-panel mb-7 p-5">
            <label className="mb-2 block text-xs font-bold text-[#54a0ff]">Chọn portfolio</label>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="app-input w-full rounded-lg px-4 py-3 text-sm font-semibold">
              {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {error && <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

          {/* ── SUMMARY CARDS ── */}
          {positions.length > 0 && (
            <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {/* Total Value */}
              <div className="app-panel p-5">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <PieChart className="h-3.5 w-3.5" />GIÁ TRỊ DANH MỤC
                </div>
                <p className="text-2xl font-black rainbow-text">{hasPricedPositions ? `$${fmt(totalValue)}` : "N/A"}</p>
                <p className="mt-1 text-xs text-slate-500">{positions.length} vị thế{missingPriceCount > 0 ? ` · ${missingPriceCount} chờ giá` : ""}</p>
              </div>

              {/* Total P&L */}
              <div className="app-panel p-5">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <TrendingUp className="h-3.5 w-3.5" />TỔNG P&L
                </div>
                <p className={`text-2xl font-black ${isNum(totalPnl) && totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {isNum(totalPnl) ? `${totalPnl >= 0 ? "+" : ""}${fmt(totalPnl)}` : "N/A"}
                </p>
                <p className={`mt-1 text-xs font-semibold ${isNum(totalPnlPct) && totalPnlPct >= 0 ? "text-green-500" : "text-red-500"}`}>{pct(totalPnlPct)}</p>
              </div>

              {/* Risk Score */}
              <div className="app-panel p-5">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <AlertTriangle className="h-3.5 w-3.5" />RISK SCORE
                </div>
                <div className="flex items-end gap-2">
                  <p className={`text-2xl font-black ${risk.color}`}>{riskScore ?? "N/A"}</p>
                  {riskScore != null && <p className="mb-0.5 text-xs text-slate-500">/100</p>}
                </div>
                {/* progress bar */}
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800">
                  <div className={`h-1.5 rounded-full ${risk.bg} transition-all duration-700`} style={{ width: `${riskScoreValue}%` }} />
                </div>
                <p className={`mt-1 text-xs font-bold ${risk.color}`}>{riskScore == null ? "Chưa có giá thị trường" : `Rủi ro ${risk.label}`}</p>
              </div>

              {/* Benchmark placeholder (market P&L avg) */}
              <div className="app-panel p-5">
                <div className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Target className="h-3.5 w-3.5" />BENCHMARK
                </div>
                <p className="text-2xl font-black text-slate-300">S&P 500</p>
                <p className="mt-1 text-xs text-slate-500">So sánh chuẩn</p>
                <p className="mt-1 text-xs text-slate-400">
                  Portfolio: <span className={`font-bold ${isNum(totalPnlPct) && totalPnlPct >= 0 ? "text-green-400" : "text-red-400"}`}>{pct(totalPnlPct)}</span>
                </p>
              </div>
            </div>
          )}

          {/* ── WINNER / LOSER ── */}
          {pricedPositions.length > 1 && (
            <div className="mb-7 grid grid-cols-2 gap-4">
              <div className="app-panel flex items-center gap-4 p-5 border-l-rainbow-green">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-500/10">
                  <Trophy className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-green-400">🏆 WINNER</p>
                  <p className="text-lg font-black text-white">{winner?.symbol}</p>
                  <p className="text-xs text-slate-400">{winner?.name}</p>
                  <p className="text-sm font-bold text-green-400">{pct(winner?.pnlPct)}</p>
                </div>
              </div>
              <div className="app-panel flex items-center gap-4 p-5 border-l-rainbow-red">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/10">
                  <Skull className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-400">💀 LOSER</p>
                  <p className="text-lg font-black text-white">{loser?.symbol}</p>
                  <p className="text-xs text-slate-400">{loser?.name}</p>
                  <p className="text-sm font-bold text-red-400">{pct(loser?.pnlPct)}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── POSITION TABLE with sort ── */}
          {positions.length > 0 && (
            <div className="app-panel mb-7 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-black rainbow-text">
                  Vị thế hiện tại
                  {priceLoading && <span className="ml-2 text-xs font-normal text-slate-400">Đang tải giá...</span>}
                </h3>
                <button onClick={() => fetchPrices(positions.map(p => p.symbol))} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700">
                  <RefreshCw className="h-3.5 w-3.5" />Refresh
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-xs text-slate-500">
                      {/* Symbol */}
                      <th className="pb-2 text-left">
                        <button onClick={() => toggleSort("symbol")} className="inline-flex items-center gap-1 hover:text-[#54a0ff]">
                          MÃ <SortIcon k="symbol" />
                        </button>
                      </th>
                      {/* Market Value */}
                      <th className="pb-2 text-right">
                        <button onClick={() => toggleSort("value")} className="inline-flex items-center gap-1 hover:text-[#54a0ff]">
                          GIÁ TRỊ <SortIcon k="value" />
                        </button>
                      </th>
                      {/* P&L */}
                      <th className="pb-2 text-right">
                        <button onClick={() => toggleSort("pnl")} className="inline-flex items-center gap-1 hover:text-[#54a0ff]">
                          P&L <SortIcon k="pnl" />
                        </button>
                      </th>
                      {/* Return % */}
                      <th className="pb-2 text-right">
                        <button onClick={() => toggleSort("pnlPct")} className="inline-flex items-center gap-1 hover:text-[#54a0ff]">
                          LỢI NHUẬN <SortIcon k="pnlPct" />
                        </button>
                      </th>
                      {/* Allocation Weight */}
                      <th className="pb-2 text-right">
                        <button onClick={() => toggleSort("weight")} className="inline-flex items-center gap-1 hover:text-[#54a0ff]">
                          TỶ TRỌNG <SortIcon k="weight" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {sortedPositions.map(p => {
                      const d = prices[p.symbol];
                      const weight = p.priced && isNum(totalValue) && totalValue > 0 ? (p.value / totalValue) * 100 : null;
                      return (
                        <tr key={p.symbol} className="group hover:bg-slate-800/50 transition-colors">
                          {/* Symbol + name + current price */}
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-800 text-xs font-black text-[#54a0ff] group-hover:bg-slate-700">
                                {p.symbol.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-black text-[#54a0ff]">{p.symbol}</p>
                                <p className="text-xs text-slate-400">{p.name}</p>
                                <p className="text-xs text-slate-500">{p.quantity} cp · TB ${fmt(p.avgPrice)}</p>
                              </div>
                            </div>
                          </td>
                          {/* Market Value */}
                          <td className="py-3 text-right">
                            <p className="font-bold text-white">{p.priced ? `$${fmt(p.value)}` : (priceLoading ? "Đang tải..." : "N/A")}</p>
                            {d && <p className="text-xs text-slate-400">${fmt(d.price)}</p>}
                            {d?.changePercent != null && (
                              <p className={`text-xs ${d.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {d.change >= 0 ? "+" : ""}{d.changePercent.toFixed(2)}% hôm nay
                              </p>
                            )}
                          </td>
                          {/* P&L absolute */}
                          <td className="py-3 text-right">
                            <p className={`font-bold ${p.priced && p.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {p.priced ? `${p.pnl >= 0 ? "+" : ""}${fmt(p.pnl)}` : "N/A"}
                            </p>
                          </td>
                          {/* Return % */}
                          <td className="py-3 text-right">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                              p.priced && p.pnlPct >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                            }`}>
                              {p.priced && p.pnlPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {p.priced ? pct(p.pnlPct) : "N/A"}
                            </span>
                          </td>
                          {/* Allocation % + mini bar */}
                          <td className="py-3 pl-4 text-right">
                            <p className="text-xs font-bold text-slate-300">{isNum(weight) ? `${weight.toFixed(1)}%` : "N/A"}</p>
                            <div className="mt-1 h-1 w-full max-w-[80px] ml-auto rounded-full bg-slate-800">
                              <div className="h-1 rounded-full rainbow-bg" style={{ width: `${weight ?? 0}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-slate-700 pt-4">
                <div className="text-sm text-slate-400">Tổng giá trị</div>
                <div className="font-black rainbow-text">{hasPricedPositions ? `$${fmt(totalValue)}` : "N/A"}</div>
                <div className="w-full" />
                <div className="text-sm text-slate-400">Tổng P&L</div>
                <div className={`font-black ${isNum(totalPnl) && totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {isNum(totalPnl) ? `${totalPnl >= 0 ? "+" : ""}${fmt(totalPnl)} (${pct(totalPnlPct)})` : "N/A"}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {positions.length === 0 && (
            <div className="app-panel p-10 text-center text-slate-400">
              Portfolio này chưa có giao dịch nào.
            </div>
          )}

          {/* ── AI BUTTON ── */}
          {positions.length > 0 && (
            <button onClick={runAiAnalysis} disabled={loading} className="rainbow-btn w-full mb-7 disabled:opacity-50">
              <span className="inline-flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {loading ? "AI đang phân tích..." : "Chạy AI Analysis"}
              </span>
            </button>
          )}

          {/* ── AI RESULT ── */}
          {aiAnalysis && (
            <div className="app-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#54a0ff]" />
                <h3 className="font-black rainbow-text">Kết quả phân tích AI</h3>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{aiAnalysis}</div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
