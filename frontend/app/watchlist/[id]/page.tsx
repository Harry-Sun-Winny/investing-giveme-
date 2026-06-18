"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowDownUp,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getWatchlistItems, addWatchlistItem, removeWatchlistItem, getStockPrice, WatchlistItem } from "../../lib/api";
import StockAnalyticsModal from "./components/StockAnalyticsModal";

interface SearchResult { symbol: string; name: string; type: string; }
interface PriceData { price: number; change: number; changePercent: number; }

type SortKey = "changePercent" | "price" | "symbol";
type AssetFilter = "ALL" | "STOCKS" | "ETF" | "CRYPTO";

const filters: { value: AssetFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "STOCKS", label: "Stocks" },
  { value: "ETF", label: "ETF" },
  { value: "CRYPTO", label: "Crypto" },
];

function compactMoney(value?: number) {
  if (value == null || !Number.isFinite(value)) return "N/A";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000_000) return `${sign}$${(abs / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function classifyAsset(symbol: string, name = ""): AssetFilter {
  const text = `${symbol} ${name}`.toUpperCase();
  if (/(BTC|ETH|SOL|BNB|USDT|USDC|XRP|ADA|DOGE|CRYPTO)/.test(text)) return "CRYPTO";
  if (/(ETF|SPY|QQQ|VOO|VTI|IWM|DIA)/.test(text)) return "ETF";
  return "STOCKS";
}

export default function WatchlistPage() {
  const routeParams = useParams<{ id?: string }>() ?? {};
  const id = routeParams.id ?? "";
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filter, setFilter] = useState<AssetFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("changePercent");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedAsset, setSelectedAsset] = useState<WatchlistItem | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) { window.location.href = "/login"; return; }
    loadItems();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadItems() {
    try {
      const data = await getWatchlistItems(id);
      setItems(data);
      if (data.length > 0) fetchPrices(data.map(i => i.assetSymbol));
    } catch (e: any) { setError(e.message); }
  }

  async function fetchPrices(symbols: string[]) {
    setPriceLoading(true);
    const results: Record<string, PriceData> = {};
    await Promise.all(symbols.map(async s => {
      const d = await getStockPrice(s);
      if (d) results[s] = d;
    }));
    setPrices(results);
    setPriceLoading(false);
  }

  function handleSearchChange(val: string) {
    setQuery(val);
    setShowSuggestions(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.length < 1) { setSuggestions([]); return; }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock-search?q=${encodeURIComponent(val)}`);
        setSuggestions(await res.json());
      } catch { setSuggestions([]); }
      setSearchLoading(false);
    }, 300);
  }

  async function handleAdd(s: SearchResult) {
    setQuery(""); setSuggestions([]); setShowSuggestions(false);
    try {
      const item = await addWatchlistItem(id, s.symbol, s.name);
      setItems(prev => [...prev, item]);
      fetchPrices([s.symbol]);
    } catch (e: any) { setError(e.message); }
  }

  async function handleRemove(symbol: string) {
    try {
      await removeWatchlistItem(id, symbol);
      setItems(prev => prev.filter(i => i.assetSymbol !== symbol));
      setPrices(prev => { const n = { ...prev }; delete n[symbol]; return n; });
    } catch (e: any) { setError(e.message); }
  }

  const rows = useMemo(() => {
    const filtered = items.filter(item => filter === "ALL" || classifyAsset(item.assetSymbol, item.assetName) === filter);
    const dir = sortDir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const pa = prices[a.assetSymbol];
      const pb = prices[b.assetSymbol];
      if (sortKey === "symbol") return a.assetSymbol.localeCompare(b.assetSymbol) * dir;
      if (sortKey === "price") return ((pa?.price ?? -Infinity) - (pb?.price ?? -Infinity)) * dir;
      return ((pa?.changePercent ?? -Infinity) - (pb?.changePercent ?? -Infinity)) * dir;
    });
  }, [filter, items, prices, sortDir, sortKey]);

  const priced = items.map(item => prices[item.assetSymbol]).filter(Boolean);
  const gainers = priced.filter(price => price.change >= 0);
  const losers = priced.filter(price => price.change < 0);
  const averageChange = priced.length ? priced.reduce((sum, price) => sum + price.changePercent, 0) / priced.length : 0;
  const best = items.reduce<{ symbol: string; change: number } | null>((acc, item) => {
    const price = prices[item.assetSymbol];
    if (!price) return acc;
    if (!acc || price.changePercent > acc.change) return { symbol: item.assetSymbol, change: price.changePercent };
    return acc;
  }, null);

  function setSort(next: SortKey) {
    if (sortKey === next) setSortDir(prev => prev === "desc" ? "asc" : "desc");
    else {
      setSortKey(next);
      setSortDir("desc");
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-white/10 bg-slate-950/95 p-5 lg:flex lg:flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400 text-slate-950">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Investment</p>
              <p className="text-xs text-slate-500">Watchlist Desk</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" className="justify-start text-slate-400" onClick={() => window.location.href = "/"}>Dashboard</Button>
        <Button variant="ghost" className="justify-start text-slate-400" onClick={() => window.location.href = "/analysis"}>AI Analysis</Button>
        <Button variant="ghost" className="mt-auto justify-start text-red-300" onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}>
          Logout
        </Button>
      </aside>

      <main className="px-4 py-6 lg:ml-60 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,.14),transparent_34%),linear-gradient(135deg,#0f172a,#050816)]">
              <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <Badge variant="outline" className="border-cyan-400/30 text-cyan-300">Institutional Watchlist</Badge>
                  <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-5xl">Market Watchlist</h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-400">
                    Monitor high-conviction assets, daily movers and watchlist risk in a compact trading desk view.
                  </p>
                </div>
                <Button variant="outline" onClick={() => fetchPrices(items.map(i => i.assetSymbol))} disabled={items.length === 0 || priceLoading}>
                  <RefreshCw className={`h-4 w-4 ${priceLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {error && <Card className="border-red-500/20 bg-red-500/10"><CardContent className="p-4 text-sm text-red-300">{error}</CardContent></Card>}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Total Assets", value: items.length.toLocaleString(), icon: Eye, tone: "text-white" },
              { label: "Assets Up Today", value: gainers.length.toLocaleString(), icon: TrendingUp, tone: "text-emerald-400" },
              { label: "Assets Down Today", value: losers.length.toLocaleString(), icon: TrendingDown, tone: "text-red-400" },
              { label: "Average Daily Change", value: `${averageChange >= 0 ? "+" : ""}${averageChange.toFixed(2)}%`, icon: Activity, tone: averageChange >= 0 ? "text-emerald-400" : "text-red-400" },
              { label: "Best Performer", value: best ? `${best.symbol} ${best.change >= 0 ? "+" : ""}${best.change.toFixed(2)}%` : "N/A", icon: TrendingUp, tone: "text-emerald-400" },
            ].map((card, index) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} whileHover={{ y: -3 }}>
                <Card className="h-full border-white/10 bg-white/[0.035]">
                  <CardHeader className="flex-row items-start justify-between pb-2">
                    <div>
                      <CardDescription className="text-xs uppercase tracking-wide text-slate-500">{card.label}</CardDescription>
                      <CardTitle className={`mt-3 text-2xl ${card.tone}`}>{card.value}</CardTitle>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/80 p-2 text-cyan-300">
                      <card.icon className="h-4 w-4" />
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </section>

          <Card className="border-white/10 bg-white/[0.035]">
            <CardHeader>
              <CardTitle>Add Asset</CardTitle>
              <CardDescription>Search by ticker or company name.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative" ref={suggestRef}>
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  value={query}
                  onChange={e => handleSearchChange(e.target.value)}
                  onFocus={() => query && setShowSuggestions(true)}
                  placeholder="Search AAPL, NVDA, BTC..."
                  className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/80 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400/50"
                />
                <AnimatePresence>
                  {showSuggestions && (suggestions.length > 0 || searchLoading) && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-slate-950 shadow-2xl">
                      {searchLoading && (
                        <div className="space-y-2 p-3">
                          <Skeleton className="h-8 bg-white/10" />
                          <Skeleton className="h-8 bg-white/10" />
                        </div>
                      )}
                      {suggestions.map(s => (
                        <button key={s.symbol} onMouseDown={() => handleAdd(s)} className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.04]">
                          <span>
                            <span className="font-semibold text-white">{s.symbol}</span>
                            <span className="ml-3 text-sm text-slate-400">{s.name}</span>
                          </span>
                          <Badge className="bg-cyan-500/15 text-cyan-300"><Plus className="mr-1 h-3 w-3" />Add</Badge>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.035]">
            <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>Watchlist Overview</CardTitle>
                <CardDescription>{rows.length} visible assets · sorted by {sortKey} {sortDir}</CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Tabs value={filter} onValueChange={value => setFilter(value as AssetFilter)}>
                  <TabsList className="bg-slate-950/80">
                    {filters.map(item => <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>)}
                  </TabsList>
                </Tabs>
                <Button variant="outline" onClick={() => setSort(sortKey)}>
                  <ArrowDownUp className="h-4 w-4" />
                  {sortDir === "desc" ? "Desc" : "Asc"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500">No assets yet. Search above to add your first symbol.</div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-slate-950">
                    <TableRow className="border-white/10">
                      <TableHead className="cursor-pointer" onClick={() => setSort("symbol")}>Symbol</TableHead>
                      <TableHead>Company Name</TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => setSort("price")}>Price</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                      <TableHead className="cursor-pointer text-right" onClick={() => setSort("changePercent")}>Change %</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence initial={false}>
                      {rows.map(item => {
                        const data = prices[item.assetSymbol];
                        const up = (data?.change ?? 0) >= 0;
                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="border-b border-white/10 transition-colors hover:bg-white/[0.04]"
                          >
                            <TableCell className="font-semibold text-white">
                              <Button
                                variant="ghost"
                                className="h-auto px-0 py-0 font-semibold text-cyan-300 hover:bg-transparent hover:text-cyan-200"
                                onClick={() => setSelectedAsset(item)}
                              >
                                {item.assetSymbol}
                              </Button>
                            </TableCell>
                            <TableCell className="max-w-[280px] truncate text-slate-300">{item.assetName}</TableCell>
                            <TableCell className="text-right font-medium text-white">{data ? compactMoney(data.price) : priceLoading ? <Skeleton className="ml-auto h-5 w-16 bg-white/10" /> : "N/A"}</TableCell>
                            <TableCell className={`text-right ${up ? "text-emerald-400" : "text-red-400"}`}>{data ? `${data.change >= 0 ? "+" : ""}${compactMoney(data.change)}` : "N/A"}</TableCell>
                            <TableCell className="text-right">
                              {data ? (
                                <Badge variant={up ? "default" : "destructive"} className={up ? "bg-emerald-500/15 text-emerald-300" : ""}>
                                  {data.changePercent >= 0 ? "+" : ""}{data.changePercent.toFixed(2)}%
                                </Badge>
                              ) : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={up ? "border-emerald-500/30 text-emerald-300" : "border-red-500/30 text-red-300"}>
                                {up ? "Gainer" : "Loser"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-200" onClick={() => handleRemove(item.assetSymbol)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove from watchlist</TooltipContent>
                              </Tooltip>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <StockAnalyticsModal
        item={selectedAsset}
        quote={selectedAsset ? prices[selectedAsset.assetSymbol] : undefined}
        open={Boolean(selectedAsset)}
        onOpenChange={open => {
          if (!open) setSelectedAsset(null);
        }}
      />
    </div>
  );
}
