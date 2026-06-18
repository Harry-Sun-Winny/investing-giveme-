"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Bot, LogOut, Search, TrendingUp, User } from "lucide-react";

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  changeRange: number | null;
  changePctRange: number | null;
  dataQuality?: {
    status: "OK" | "WARN" | "ERROR";
    checks: string[];
    sources: string[];
    unavailableSources: string[];
    primarySource: string;
    fallbackUsed: boolean;
    maxDeviationPercent: number | null;
  };
}
interface SearchResult { symbol: string; name: string; type: string; }

const INDICES = [
  { symbol: "^GSPC", name: "S&P 500" }, { symbol: "^IXIC", name: "Nasdaq" },
  { symbol: "^DJI", name: "Dow Jones" }, { symbol: "^FTSE", name: "FTSE 100" },
  { symbol: "^N225", name: "Nikkei 225" }, { symbol: "^HSI", name: "Hang Seng" },
  { symbol: "000001.SS", name: "Shanghai" }, { symbol: "^VIX", name: "VIX" },
];

const CATEGORIES: Record<string, { symbol: string; name: string }[]> = {
  Stocks: [
    { symbol: "AAPL", name: "Apple" }, { symbol: "MSFT", name: "Microsoft" },
    { symbol: "NVDA", name: "NVIDIA" }, { symbol: "GOOGL", name: "Alphabet" },
    { symbol: "AMZN", name: "Amazon" }, { symbol: "META", name: "Meta" },
    { symbol: "TSLA", name: "Tesla" }, { symbol: "TSM", name: "TSMC" },
    { symbol: "AVGO", name: "Broadcom" }, { symbol: "BRK-B", name: "Berkshire" },
  ],
  Crypto: [
    { symbol: "BTC-USD", name: "Bitcoin" }, { symbol: "ETH-USD", name: "Ethereum" },
    { symbol: "BNB-USD", name: "BNB" }, { symbol: "SOL-USD", name: "Solana" },
    { symbol: "XRP-USD", name: "XRP" }, { symbol: "DOGE-USD", name: "Dogecoin" },
  ],
  Commodities: [
    { symbol: "GC=F", name: "Gold" }, { symbol: "SI=F", name: "Silver" },
    { symbol: "CL=F", name: "Crude Oil" }, { symbol: "NG=F", name: "Natural Gas" },
  ],
  ETFs: [
    { symbol: "SPY", name: "SPDR S&P 500" }, { symbol: "QQQ", name: "Nasdaq ETF" },
    { symbol: "VTI", name: "Vanguard Total" }, { symbol: "GLD", name: "Gold ETF" },
  ],
  "Mutual Funds": [
    { symbol: "VFIAX", name: "Vanguard 500 Index" }, { symbol: "SWPPX", name: "Schwab S&P 500 Index" },
    { symbol: "FXAIX", name: "Fidelity 500 Index" }, { symbol: "VTSAX", name: "Vanguard Total Stock Market" },
  ],
  Bonds: [
    { symbol: "BND", name: "Vanguard Total Bond ETF" }, { symbol: "TLT", name: "20+ Year Treasury Bond" },
    { symbol: "IEF", name: "7-10 Year Treasury Bond" }, { symbol: "LQD", name: "Investment Grade Corporate Bond" },
  ],
  Currencies: [
    { symbol: "EURUSD=X", name: "EUR/USD" }, { symbol: "JPY=X", name: "USD/JPY" },
    { symbol: "GBPUSD=X", name: "GBP/USD" }, { symbol: "AUDUSD=X", name: "AUD/USD" },
  ],
};

export default function MarketPage() {
  const [activeCategory, setActiveCategory] = useState("Indices");
  const [activeRange, setActiveRange] = useState("1d");
  const [data, setData] = useState<Record<string, MarketItem>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResult, setSearchResult] = useState<MarketItem | null>(null);
  const [countdown, setCountdown] = useState(30);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      window.location.href = "/login";
      return;
    }
    loadCategory(activeCategory, activeRange);
    const interval = setInterval(() => loadCategory(activeCategory, activeRange), 30000);
    return () => clearInterval(interval);
  }, [activeCategory, activeRange]);

  useEffect(() => {
    setCountdown(30);
    const t = setInterval(() => setCountdown(c => c <= 1 ? 30 : c - 1), 1000);
    return () => clearInterval(t);
  }, [activeCategory, activeRange]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadCategory(cat: string, range: string) {
    setLoading(true);
    const symbols = cat === "Indices" ? INDICES : CATEGORIES[cat] ?? [];
    const results: Record<string, MarketItem> = {};
    await Promise.all(symbols.map(async ({ symbol, name }) => {
      try {
        const res = await fetch(`/api/stock-price?symbol=${encodeURIComponent(symbol)}&range=${range}`);
        const d = await res.json();
        if (d.price) results[symbol] = { symbol, name, price: d.price, change: d.change, changePercent: d.changePercent, changeRange: d.changeRange ?? null, changePctRange: d.changePctRange ?? null, dataQuality: d.dataQuality };
      } catch {}
    }));
    setData(results);
    setLoading(false);
  }

  function handleSearchInput(val: string) {
    setSearch(val);
    setSearchResult(null);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock-search?q=${encodeURIComponent(val)}`);
        setSuggestions(await res.json());
        setShowSuggestions(true);
      } catch {}
    }, 300);
  }

  async function handleSelectSuggestion(item: SearchResult) {
    setSearch(`${item.symbol} - ${item.name}`);
    setShowSuggestions(false);
    try {
      const res = await fetch(`/api/stock-price?symbol=${encodeURIComponent(item.symbol)}&range=${activeRange}`);
      const d = await res.json();
      if (d.price) setSearchResult({ symbol: item.symbol, name: item.name, price: d.price, change: d.change, changePercent: d.changePercent, changeRange: d.changeRange ?? null, changePctRange: d.changePctRange ?? null, dataQuality: d.dataQuality });
    } catch {}
  }

  const symbols = activeCategory === "Indices" ? INDICES : CATEGORIES[activeCategory] ?? [];
  function getChange(d: MarketItem) { return activeRange === "1d" ? d.change : (d.changeRange ?? null); }
  function getChangePct(d: MarketItem) { return activeRange === "1d" ? d.changePercent : (d.changePctRange ?? null); }

  return (
    <div className="app-shell flex">
      <aside className="app-sidebar fixed flex h-full w-64 flex-col gap-2 p-5">
        <div className="mb-10 px-2">
          <div className="flex items-center gap-2">
            <span className="rainbow-bg grid h-6 w-6 place-items-center rounded text-xs font-black text-white">↗</span>
            <h1 className="text-xl font-black text-white">Investment</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">Platform</p>
        </div>
        <button onClick={() => window.location.href = "/"} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-[#54a0ff]"><BarChart3 className="h-4 w-4" />Dashboard</button>
        <button className="rainbow-bg flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-white"><TrendingUp className="h-4 w-4" />Market</button>
        <button onClick={() => window.location.href = "/analysis"} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-[#54a0ff]"><Bot className="h-4 w-4" />AI Analysis</button>
        <button onClick={() => window.location.href = "/account"} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-[#54a0ff]"><User className="h-4 w-4" />Tài khoản</button>
        <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }} className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400"><LogOut className="h-4 w-4" />Đăng xuất</button>
      </aside>

      <main className="ml-64 flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7">
            <p className="text-sm font-medium text-[#54a0ff]">Thị trường toàn cầu</p>
            <h2 className="rainbow-text mt-2 text-3xl font-black">Market</h2>
          </div>

          <div ref={searchRef} className="relative mb-7">
            <div className="app-panel flex items-center gap-3 px-4 py-3 focus-within:border-orange-400">
              <Search className="h-4 w-4 text-[#54a0ff]" />
              <input type="text" value={search} onChange={e => handleSearchInput(e.target.value)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} placeholder="Tìm kiếm cổ phiếu, ETF, crypto..." className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none" />
              {search && <button onClick={() => { setSearch(""); setSuggestions([]); setSearchResult(null); }} className="text-slate-500 hover:text-[#54a0ff]">✕</button>}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
                {suggestions.map(s => (
                  <button key={s.symbol} onClick={() => handleSelectSuggestion(s)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800 text-xs font-black text-[#54a0ff]">{s.symbol.charAt(0)}</div>
                    <div>
                      <p className="rainbow-text text-sm font-black">{s.symbol}</p>
                      <p className="text-xs text-slate-400">{s.name} · {s.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {searchResult && (
            <div className="app-panel mb-7 flex items-center justify-between p-4">
              <div>
                <p className="rainbow-text text-lg font-black">{searchResult.symbol}</p>
                <p className="text-sm text-slate-400">{searchResult.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">${searchResult.price.toFixed(2)}</p>
                <p className={`text-sm font-bold ${(getChange(searchResult) ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {(getChange(searchResult) ?? 0) >= 0 ? "▲" : "▼"} {Math.abs(getChange(searchResult) ?? 0).toFixed(2)} ({Math.abs(getChangePct(searchResult) ?? 0).toFixed(2)}%)
                </p>
              </div>
            </div>
          )}

          <div className="mb-4 flex gap-2">
            {[["1d", "1 Ngày"], ["5d", "1 Tuần"], ["1y", "1 Năm"]].map(([r, label]) => (
              <button key={r} onClick={() => setActiveRange(r)} className={`rounded-lg px-4 py-2 text-xs font-black transition-all ${activeRange === r ? "rainbow-bg text-white" : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-[#c44dff]"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {["Indices", ...Object.keys(CATEGORIES)].map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${activeCategory === cat ? "rainbow-bg text-white" : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-[#54a0ff]"}`}>
                {cat}
              </button>
            ))}
          </div>

          <div className="app-panel overflow-hidden">
            <div className="grid grid-cols-5 border-b border-slate-800 px-4 py-3 rainbow-text text-xs font-bold">
              <span>Tên</span><span className="text-right">Giá</span><span className="text-right">Thay đổi</span><span className="text-right">% Thay đổi</span><span className="text-right">Dữ liệu</span>
            </div>
            {loading && <div className="p-8 text-center text-sm text-slate-400">Đang tải dữ liệu...</div>}
            {!loading && symbols.map(({ symbol, name }) => {
              const d = data[symbol];
              const chg = d ? getChange(d) : null;
              const chgPct = d ? getChangePct(d) : null;
              return (
                <div key={symbol} className="grid grid-cols-5 items-center border-b border-slate-800/60 px-4 py-3.5 transition-colors hover:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800 text-xs font-black text-[#54a0ff]">{symbol.replace("^", "").charAt(0)}</div>
                    <div>
                      <p className="text-sm font-black text-[#54a0ff]">{symbol.replace("^", "")}</p>
                      <p className="text-xs text-slate-400">{name}</p>
                    </div>
                  </div>
                  <p className="text-right text-sm font-black text-white">{d ? d.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</p>
                  <p className={`text-right text-sm font-bold ${chg == null ? "text-slate-500" : chg >= 0 ? "text-green-400" : "text-red-400"}`}>{chg != null ? `${chg >= 0 ? "+" : ""}${chg.toFixed(2)}` : "—"}</p>
                  <div className="text-right">
                    {chgPct != null ? (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${chgPct >= 0 ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>{chgPct >= 0 ? "▲" : "▼"} {Math.abs(chgPct).toFixed(2)}%</span>
                    ) : <span className="text-sm text-slate-500">—</span>}
                  </div>
                  <div className="text-right">
                    {d?.dataQuality ? (
                      <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${d.dataQuality.status === "OK" ? "bg-green-400/10 text-green-400" : "bg-yellow-400/10 text-yellow-300"}`}>
                        {d.dataQuality.status === "OK" ? "OK" : "WARN"} · {d.dataQuality.primarySource}
                      </span>
                    ) : <span className="text-sm text-slate-500">—</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Yahoo Finance chart + summary cross-check · Tự động cập nhật sau <span className="rainbow-text">{countdown}s</span>
          </p>
        </div>
      </main>
    </div>
  );
}
