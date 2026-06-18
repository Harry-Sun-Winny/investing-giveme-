"use client";

import { useState } from "react";
import { ArrowRight, TrendingUp } from "lucide-react";
import { login, register } from "../lib/api";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = mode === "login" ? await login(email, password) : await register(email, password, fullName);
      localStorage.setItem("token", res.token);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message ?? "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell grid min-h-screen place-items-center px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/70 shadow-2xl shadow-black/30 md:grid-cols-[1fr_420px]">
        <section className="hidden bg-[radial-gradient(ellipse_at_top_left,rgba(196,77,255,0.2),transparent_30rem),radial-gradient(ellipse_at_bottom_right,rgba(84,160,255,0.15),transparent_28rem),linear-gradient(145deg,#0f1729,#050816)] p-10 md:block">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded rainbow-bg text-sm font-black text-white">↗</span>
            <p className="text-xl font-black text-white">Investment</p>
          </div>
          <h1 className="mt-20 max-w-md text-5xl font-black leading-tight rainbow-text">
            Financial workspace for focused decisions
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
            Portfolio, watchlist, market data and AI analysis in one dark dashboard.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm font-bold rainbow-text">
            <TrendingUp className="h-5 w-5" />
            Orange-first visual system
          </div>
        </section>

        <section className="p-8">
          <p className="text-sm font-bold text-[#54a0ff]">{mode === "login" ? "Welcome back" : "Create workspace"}</p>
          <h2 className="mt-2 text-3xl font-black rainbow-text">{mode === "login" ? "Đăng nhập" : "Đăng ký"}</h2>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            {mode === "register" && (
              <input type="text" placeholder="Họ tên" value={fullName} onChange={e => setFullName(e.target.value)} required className="app-input rounded-lg px-4 py-3" />
            )}
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="app-input rounded-lg px-4 py-3" />
            <input type="password" placeholder="Mật khẩu (tối thiểu 12 ký tự)" value={password} onChange={e => setPassword(e.target.value)} required className="app-input rounded-lg px-4 py-3" />
            {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="mt-2 inline-flex items-center justify-center gap-2 rainbow-btn">
              {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-black rainbow-text">
              {mode === "login" ? "Đăng ký" : "Đăng nhập"}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}
