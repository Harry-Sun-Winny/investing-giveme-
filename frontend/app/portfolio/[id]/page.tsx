"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, Transaction, CreateTransactionDto, isUnauthorizedError } from "../../lib/api";
import PortfolioChart from "./chart";

interface SearchResult { symbol: string; name: string; type: string; }

const SECTOR_MAP: Record<string, string> = {};
const PRICE_SYMBOL_ALIASES: Record<string, string> = {
  INTEL: "INTC",
  TSMC: "TSM",
};

function getPriceSymbol(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  return PRICE_SYMBOL_ALIASES[normalized] ?? normalized;
}

export default function PortfolioPage() {
  const routeParams = useParams<{ id?: string }>() ?? {};
  const id = routeParams.id ?? "";

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [symbol, setSymbol] = useState("");
  const [assetName, setAssetName] = useState("");
  const [type, setType] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [sectors, setSectors] = useState<Record<string, string>>({});

  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const suggestRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) { window.location.href = "/login"; return; }
    loadTx();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleApiError(error: unknown) {
    if (isUnauthorizedError(error) || (error as any)?.message?.includes("Không có quyền truy cập")) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return true;
    }
    return false;
  }

  async function loadTx() {
    try {
      setTransactions(await getTransactions(id));
    } catch (e: any) {
      if (!handleApiError(e)) setError(e.message || "Lỗi khi tải giao dịch");
    }
  }

  async function openEdit(t: Transaction) {
    setEditingTx(t);
    setSymbol(t.assetSymbol);
    setAssetName(t.assetName);
    setType(t.type?.toUpperCase().trim() ?? "BUY");
    setQuantity(String(t.quantity));
    setPrice(String(t.price));
    setCurrency(t.currency);
    setDate(t.transactionDate.slice(0, 10));
    setNotes(t.notes || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await fetchPriceForDate(t.assetSymbol, t.transactionDate.slice(0, 10));
  }

  async function fetchPriceForDate(sym: string, dateStr: string, fillPrice = false) {
    try {
      const res = await fetch(`/api/stock-price?symbol=${encodeURIComponent(getPriceSymbol(sym))}&date=${dateStr}&targetCurrency=${currency}`);
      const data = await res.json();
      if (data.price) {
        setCurrentPrice(data.price);
        if (fillPrice) setPrice(data.price.toFixed(2));
      }
    } catch {}
  }

  function resetForm() {
    setEditingTx(null);
    setShowForm(false);
    setSymbol(""); setAssetName(""); setQuantity(""); setPrice(""); setNotes("");
    setType("BUY"); setCurrency("USD");
    setDate(new Date().toISOString().slice(0, 10));
    setError("");
  }

  function handleSymbolChange(val: string) {
    setSymbol(val.toUpperCase());
    setShowSuggestions(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.length < 1) { setSuggestions([]); return; }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock-search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(data);
      } catch { setSuggestions([]); }
      setSearchLoading(false);
    }, 300);
  }

  function selectSuggestion(s: SearchResult) {
    setSymbol(s.symbol);
    setAssetName(s.name);
    setSuggestions([]);
    setShowSuggestions(false);
    fetchPriceForDate(s.symbol, date, true);
  }

  async function handleDateChange(newDate: string) {
    setDate(newDate);
    if (symbol) {
      await fetchPriceForDate(symbol, newDate, !editingTx);
    }
  }

  function getAvailableToSell(assetSymbol: string) {
    if (!assetSymbol.trim()) return 0;
    return transactions.reduce((qty, t) => {
      if (editingTx && t.id === editingTx.id) return qty;
      if (t.assetSymbol.toUpperCase() !== assetSymbol.toUpperCase()) return qty;
      if (normalizeType(t.type) === "BUY") return qty + t.quantity;
      if (normalizeType(t.type) === "SELL") return qty - t.quantity;
      return qty;
    }, 0);
  }

  function handleQuantityChange(value: string) {
    const nextQty = Number(value);
    if (normalizeType(type) === "SELL" && symbol && Number.isFinite(nextQty)) {
      const available = getAvailableToSell(symbol);
      if (nextQty > available) {
        setQuantity(String(Math.max(available, 0)));
        setError(`Chỉ có thể bán tối đa ${available.toLocaleString(undefined, { maximumFractionDigits: 6 })} cổ phiếu ${symbol}.`);
        return;
      }
    }
    setError("");
    setQuantity(value);
  }

  async function handleSubmit() {
    if (!symbol || !quantity || !price) { setError("Vui lòng điền đầy đủ thông tin"); return; }
    
    const normalizedType = type.toUpperCase();
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) { setError("Số lượng phải lớn hơn 0"); return; }
    
    // Validate SELL transaction
    if (normalizedType === "SELL") {
      const adjustedHoldings = getAvailableToSell(symbol);
      
      if (qty > adjustedHoldings) {
        setError(`Tổng cổ phiếu bán (${qty}) vượt quá số lượng còn lại (${adjustedHoldings})`);
        return;
      }
    }
    
    const dto: CreateTransactionDto = {
      assetSymbol: symbol, assetName: assetName || symbol,
      type: normalizedType, quantity: qty, price: Number(price),
      currency, transactionDate: date, notes,
    };
    const token = localStorage.getItem("token");
    try {
      if (editingTx) {
        // UPDATE
        const updated = await updateTransaction(id, editingTx.id, dto);
        setTransactions(prev => prev.map(t => t.id === editingTx.id ? updated : t));
      } else {
        // CREATE
        const t = await createTransaction(id, dto);
        setTransactions(prev => [t, ...prev]);
      }
      resetForm();
    } catch (e: any) {
      if (!handleApiError(e)) setError(e.message || "Lỗi khi lưu giao dịch");
    }
  }

  async function handleDelete(txId: string) {
    try {
      await deleteTransaction(id, txId);
      setTransactions(prev => prev.filter(t => t.id !== txId));
      setDeleteConfirm(null);
    } catch (e: any) {
      if (!handleApiError(e)) setError(e.message || "Lỗi khi xóa giao dịch");
    }
  }

  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const normalizeType = (value: string) => value?.toUpperCase().trim();

  const formatCurrencyValue = (value: number, code: string) => {
    if (!Number.isFinite(value)) return String(value);
    try {
      const locale = code === "VND" ? "vi-VN" : "en-US";
      return new Intl.NumberFormat(locale, { style: "currency", currency: code, maximumFractionDigits: 2 }).format(value);
    } catch {
      return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${code}`;
    }
  };

  const totalBuy = transactions.filter(t => normalizeType(t.type) === "BUY").reduce((s, t) => s + t.quantity * t.price, 0);
  const totalSell = transactions.filter(t => normalizeType(t.type) === "SELL").reduce((s, t) => s + t.quantity * t.price, 0);
  const portfolioNetValue = totalBuy - totalSell;

  function getAssetHoldings(assetSymbol: string) {
    let qty = 0;
    for (const t of transactions) {
      if (t.assetSymbol.toUpperCase() !== assetSymbol.toUpperCase()) continue;
      if (normalizeType(t.type) === "BUY") qty += t.quantity;
      else if (normalizeType(t.type) === "SELL") qty -= t.quantity;
    }
    return qty;
  }

  function getSellRealizedPnl(tx: Transaction) {
    if (normalizeType(tx.type) !== "SELL") return null;

    let qty = 0;
    let cost = 0;
    const symbol = tx.assetSymbol.toUpperCase();
    const ordered = [...transactions].sort((a, b) => {
      const dateA = new Date(a.transactionDate).getTime();
      const dateB = new Date(b.transactionDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
    });

    for (const item of ordered) {
      if (item.id === tx.id) break;
      if (item.assetSymbol.toUpperCase() !== symbol) continue;

      if (normalizeType(item.type) === "BUY") {
        qty += item.quantity;
        cost += item.quantity * item.price;
      } else if (normalizeType(item.type) === "SELL" && qty > 0) {
        const avgCost = cost / qty;
        const soldQty = Math.min(item.quantity, qty);
        qty -= soldQty;
        cost = Math.max(0, cost - soldQty * avgCost);
      }
    }

    if (qty <= 0 || cost <= 0) return null;
    const avgCost = cost / qty;
    const pnl = (tx.price - avgCost) * tx.quantity;
    const pnlPct = avgCost > 0 ? ((tx.price - avgCost) / avgCost) * 100 : 0;
    return { avgCost, pnl, pnlPct };
  }

  function getTotalRealizedSellPnl() {
    return transactions.reduce((sum, tx) => {
      const realized = getSellRealizedPnl(tx);
      return sum + (realized?.pnl ?? 0);
    }, 0);
  }

  function calculatePortfolioPnL() {
    let totalCostBasis = 0;
    let totalMarketValue = 0;

    const symbols = [...new Set(transactions.map(t => t.assetSymbol))];
    
    for (const sym of symbols) {
      // Calculate cost basis and current holdings
      let costBasis = 0;
      let holdings = 0;
      
      for (const t of transactions) {
        if (t.assetSymbol.toUpperCase() !== sym.toUpperCase()) continue;
        if (normalizeType(t.type) === "BUY") {
          costBasis += t.quantity * t.price;
          holdings += t.quantity;
        } else if (normalizeType(t.type) === "SELL") {
          holdings -= t.quantity;
        }
      }
      
      totalCostBasis += costBasis;
      
      // Calculate market value for current holdings
      if (holdings > 0 && currentPrices[sym]) {
        totalMarketValue += holdings * currentPrices[sym];
      }
    }

    const pnl = totalMarketValue - totalCostBasis;
    const pnlPct = totalCostBasis > 0 ? (pnl / totalCostBasis) * 100 : 0;

    return { pnl, pnlPct, totalCostBasis, totalMarketValue };
  }

  useEffect(() => {
    if (transactions.length === 0) return;
    const symbols = [...new Set(transactions.map(t => t.assetSymbol))];
    symbols.forEach(async sym => {
      try {
        const res = await fetch(`/api/stock-price?symbol=${encodeURIComponent(getPriceSymbol(sym))}`);
        const d = await res.json();
        if (d.price) setCurrentPrices(prev => ({ ...prev, [sym]: d.price }));
      } catch {}
    });
  }, [transactions]);
  

  function getSector(symbol: string) {
  return sectors[symbol] ?? SECTOR_MAP[symbol.toUpperCase()] ?? SECTOR_MAP[symbol] ?? "Khác";
}

  return (
    <div className="app-shell flex">
      <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col p-4 gap-2 fixed h-full">
        <div className="mb-6 px-2">
          <h1 className="text-lg font-bold text-white">💹 Investment</h1>
          <p className="text-xs text-slate-500">Platform</p>
        </div>
        <button onClick={() => window.location.href = "/"} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">📊 Dashboard</button>
        <button onClick={() => window.location.href = "/analysis"} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all">🤖 AI Analysis</button>
        <div className="mt-auto">
          <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }} className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all text-left">🚪 Đăng xuất</button>
        </div>
      </aside>

      <main className="ml-56 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => window.location.href = "/"} className="text-slate-500 hover:text-white transition-colors">← Quay lại</button>
            <div>
              <p className="text-slate-500 text-sm">Portfolio</p>
              <h2 className="text-2xl font-bold text-white">Giao dịch</h2>
            </div>
          </div>

          <div className="hidden">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-xs mb-1">Tổng giao dịch</p>
              <p className="text-2xl font-bold text-blue-400">{transactions.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-xs mb-1">Chi phí mua</p>
              <p className="text-2xl font-bold text-green-400">${totalBuy.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-slate-500 mt-1">Tiền bôi ra</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-xs mb-1">Tổng bán</p>
              <p className="text-xl font-bold text-red-400 break-words leading-tight">
                {formatCurrencyValue(totalSell, "USD")}
              </p>
              {(() => {
                const realizedSellPnl = getTotalRealizedSellPnl();
                const isProfit = realizedSellPnl >= 0;
                return (
                  <p className={`text-xs mt-2 font-semibold ${isProfit ? "text-green-400" : "text-red-400"}`}>
                    Lãi đã chốt: {isProfit ? "+" : ""}{formatCurrencyValue(realizedSellPnl, "USD")}
                  </p>
                );
              })()}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-xs mb-1">Giá trị hiện tại</p>
              <p className="text-2xl font-bold text-cyan-400">${(() => {
                let marketValue = 0;
                const symbols = [...new Set(transactions.map(t => t.assetSymbol))];
                for (const sym of symbols) {
                  let holdings = 0;
                  for (const t of transactions) {
                    if (t.assetSymbol.toUpperCase() !== sym.toUpperCase()) continue;
                    if (normalizeType(t.type) === "BUY") holdings += t.quantity;
                    else if (normalizeType(t.type) === "SELL") holdings -= t.quantity;
                  }
                  if (holdings > 0 && currentPrices[sym]) {
                    marketValue += holdings * currentPrices[sym];
                  }
                }
                return marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 });
              })()}</p>
              <p className="text-xs text-slate-500 mt-1">Cổ phiếu còn nắm</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-500 text-xs mb-1">Lợi nhuận/Lỗ</p>
              {(() => {
                const { pnl, pnlPct } = calculatePortfolioPnL();
                return (
                  <>
                    <p className={`text-2xl font-bold ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {pnl >= 0 ? "▲ +" : "▼ "}{pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className={`text-xs mt-1 ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>({pnlPct.toFixed(1)}%)</p>
                  </>
                );
              })()}
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
               <PortfolioChart transactions={transactions} currentPrices={currentPrices} />
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Lịch sử giao dịch</h3>
            <button onClick={() => showForm && !editingTx ? resetForm() : setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors">
              {showForm ? "✕ Đóng" : "+ Thêm GD"}
            </button>
          </div>

          {showForm && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
              <h4 className="font-semibold mb-4">{editingTx ? "✏️ Sửa giao dịch" : "Thêm giao dịch mới"}</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="relative" ref={suggestRef}>
                  <label className="text-xs text-slate-500 mb-1 block">Mã cổ phiếu *</label>
                  <input value={symbol} onChange={e => handleSymbolChange(e.target.value)}
                    onFocus={() => symbol && setShowSuggestions(true)}
                    placeholder="VD: AAPL, GOOGL, VNM..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
                  {showSuggestions && (suggestions.length > 0 || searchLoading) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                      {searchLoading && <div className="px-3 py-2 text-xs text-slate-500">Đang tìm...</div>}
                      {suggestions.map(s => (
                        <button key={s.symbol} onMouseDown={() => selectSuggestion(s)}
                          className="w-full px-3 py-2.5 text-left hover:bg-slate-700 transition-colors flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-white text-sm">{s.symbol}</span>
                            <span className="text-slate-400 text-xs ml-2">{s.name}</span>
                          </div>
                          <span className="text-xs text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">{s.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Tên công ty</label>
                  <input value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="Tự điền hoặc chọn từ gợi ý"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Loại *</label>
                  <select value={type} onChange={e => setType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option value="BUY">🟢 MUA</option>
                    <option value="SELL">🔴 BÁN</option>
                    <option value="SWAP">🔄 SWAP - Hoán đổi</option>
                    <option value="STAKE">💎 STAKE - Đặt cọc</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Tiền tệ</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none">
                    <option value="USD">USD - Đô la Mỹ</option>
                    <option value="VND">VND - Việt Nam Đồng</option>
                    <option value="USDT">USDT - Tether</option>
                    <option value="BTC">BTC - Bitcoin</option>
                    <option value="ETH">ETH - Ethereum</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Số lượng *</label>
                  <input type="number" min="0" max={normalizeType(type) === "SELL" && symbol ? getAvailableToSell(symbol) : undefined} value={quantity} onChange={e => handleQuantityChange(e.target.value)} placeholder="10"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
                  {normalizeType(type) === "SELL" && symbol && (
                    <p className="mt-1 text-xs text-slate-400">
                      Có thể bán tối đa: <span className="font-semibold text-yellow-400">{getAvailableToSell(symbol).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Giá * <span className="text-blue-400">(tự động điền khi chọn mã)</span></label>
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="150.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Ngày giao dịch</label>
                  <input type="date" value={date} onChange={e => handleDateChange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Ghi chú</label>
                  <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tuỳ chọn..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" />
                </div>
              </div>
              {editingTx && currentPrice && (
                 <div className="mb-3 p-3 bg-slate-800 rounded-lg text-sm flex justify-between items-center">
                     <span className="text-slate-400">Giá vào ngày {date}: <span className="text-white font-semibold">{formatCurrencyValue(currentPrice, currency)}</span></span>
                     <span className={Number(price) > currentPrice ? "text-red-400" : Number(price) < currentPrice ? "text-green-400" : "text-slate-400"}>
                     {Number(price) > currentPrice
                     ? `↑ Cao hơn ${formatCurrencyValue(Number(price) - currentPrice, currency)} (+${(((Number(price) - currentPrice) / currentPrice) * 100).toFixed(1)}%)`
                     : Number(price) < currentPrice
                     ? `↓ Thấp hơn ${formatCurrencyValue(currentPrice - Number(price), currency)} (-${(((currentPrice - Number(price)) / currentPrice) * 100).toFixed(1)}%)`
                      : "Bằng giá hiện tại"}
                     </span>
                </div>
               )}
              {quantity && price && (
                <div className="mb-4 p-3 bg-slate-800 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tổng tiền: </span>
                    <span className={`font-semibold ${type === "BUY" ? "text-red-400" : "text-green-400"}`}>
                      {type === "BUY" ? "-" : "+"}{formatCurrencyValue(Number(quantity) * Number(price), currency)}
                    </span>
                  </div>
                  {type === "SELL" && (
                    <div className="flex justify-between mt-2 pt-2 border-t border-slate-700">
                      <span className="text-slate-400">Số lượng còn lại: </span>
                      <span className="text-yellow-400 font-semibold">{Math.max(0, getAvailableToSell(symbol) - Number(quantity)).toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={handleSubmit} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">
                  {editingTx ? "✓ Lưu thay đổi" : "✓ Xác nhận giao dịch"}
                </button>
                {editingTx && (
                  <button onClick={resetForm} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors">Hủy</button>
                )}
              </div>
            </div>
          )}

          {transactions.length === 0 && !showForm && (
            <div className="text-center py-12 text-slate-500">
              <p className="text-4xl mb-3">📭</p>
              <p>Chưa có giao dịch nào. Nhấn "+ Thêm GD" để bắt đầu!</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs">Loại</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs">Mã</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs">Công ty</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs">Ngày</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-semibold text-xs">Số lượng</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-semibold text-xs">Giá</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-semibold text-xs">Tổng tiền</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-semibold text-xs">P&L</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-semibold text-xs">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    {deleteConfirm === t.id ? (
                      <td colSpan={9} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-red-400">Xóa giao dịch này?</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleDelete(t.id)} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded transition-colors">Xóa</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded transition-colors">Hủy</button>
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${normalizeType(t.type) === "BUY" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                            {normalizeType(t.type) === "BUY" ? "🟢 MUA" : "🔴 BÁN"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">{t.assetSymbol}</td>
                        <td className="px-4 py-3 text-slate-300 text-xs">{t.assetName}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{t.transactionDate?.slice(0,10)}</td>
                        <td className="px-4 py-3 text-right text-white">{t.quantity.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                        <td className="px-4 py-3 text-right text-white">{formatCurrencyValue(t.price, t.currency)}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${normalizeType(t.type) === "BUY" ? "text-red-400" : "text-green-400"}`}>
                          {normalizeType(t.type) === "BUY" ? "-" : "+"}{formatCurrencyValue(t.quantity * t.price, t.currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {normalizeType(t.type) === "BUY" && currentPrices[t.assetSymbol] && (() => {
                            const currentVal = t.quantity * currentPrices[t.assetSymbol];
                            const costVal = t.quantity * t.price;
                            const pnl = currentVal - costVal;
                            const pnlPct = (pnl / costVal) * 100;
                            return (
                              <span className={`font-semibold text-xs ${pnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {pnl >= 0 ? "▲" : "▼"} {pnl >= 0 ? "+" : ""}{pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({pnlPct.toFixed(1)}%)
                              </span>
                            );
                          })()}
                          {normalizeType(t.type) === "BUY" && !currentPrices[t.assetSymbol] && (
                            <span className="text-slate-600 text-xs">Đang tải...</span>
                          )}
                          {normalizeType(t.type) === "SELL" && (
                            (() => {
                              const realized = getSellRealizedPnl(t);
                              if (!realized) return <span className="text-slate-600 text-xs">Thiếu giá vốn</span>;
                              const isProfit = realized.pnl >= 0;
                              return (
                                <div className="text-right">
                                  <span className={`font-semibold text-xs ${isProfit ? "text-green-400" : "text-red-400"}`}>
                                    {isProfit ? "▲ +" : "▼ "}{formatCurrencyValue(realized.pnl, t.currency)} ({realized.pnlPct.toFixed(1)}%)
                                  </span>
                                  <p className="mt-1 text-[11px] text-slate-500">
                                    Giá vốn {formatCurrencyValue(realized.avgCost, t.currency)}
                                  </p>
                                </div>
                              );
                            })()
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button onClick={() => openEdit(t)} className="p-1 rounded text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">✏️</button>
                            <button onClick={() => setDeleteConfirm(t.id)} className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">🗑️</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
