import { useState } from "react";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  LogIn,
  ReceiptText,
} from "lucide-react";
import { BRAND } from "./Brand";
import logoImg from "../../imports/image-7.png";
import { api } from "../api";

export type Role = "admin" | "cashier" | "kitchen" | "manager";

export function Login({
  onLogin,
  onTrack,
}: {
  onLogin: (role: Role, name: string) => void;
  onTrack?: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api<{ user: { role: Role; name: string } }>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      onLogin(data.user.role, data.user.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="size-full min-h-screen bg-neutral-950 px-4 py-4 flex flex-col items-center justify-center gap-3 overflow-hidden">
      <div
        className="w-full rounded-2xl bg-neutral-900 text-neutral-200 overflow-hidden shadow-[0_22px_60px_-26px_rgba(220,38,38,0.35)]"
        style={{ border: "1px solid #262626", maxWidth: 390 }}
      >
        {/* Form side */}
        <form
          onSubmit={submit}
          className="relative p-5 md:p-6 flex flex-col bg-neutral-900"
        >
          <div className="absolute -bottom-14 -right-14 w-48 h-48 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            {/* Logo at top of form */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center overflow-hidden shadow">
                <img src={logoImg} alt="GrabEat Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <div className="text-neutral-100 text-sm leading-tight">{BRAND.name}</div>
                <div className="text-xs text-neutral-500">{BRAND.tagline}</div>
              </div>
            </div>

            <div className="text-[10px] tracking-[0.25em] text-red-500 mb-1.5">SIGN IN</div>
            <div className="text-neutral-100 text-xl mb-1">Login Portal</div>
            <div className="text-xs text-neutral-500 mb-4">
              Welcome back — choose your station to continue.
            </div>

            <label className="text-xs text-neutral-400 mb-1 block">Username</label>
            <div className="relative mb-3">
              <User className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-neutral-800/70 border border-neutral-800 rounded-xl pl-11 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
            </div>

            <label className="text-xs text-neutral-400 mb-1 block">Password</label>
            <div className="relative mb-2">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-neutral-800/70 border border-neutral-800 rounded-xl pl-11 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
              <span />
              <a className="text-red-500 hover:text-red-400 cursor-pointer">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-600 hover:from-red-500 hover:to-red-500 text-white rounded-xl py-2 text-sm shadow-lg shadow-red-600/20 transition disabled:opacity-70"
            >
              <LogIn className="w-4 h-4" /> {loading ? "Signing in..." : "Sign in"}
            </button>

            {error && (
              <div className="mt-3 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <div className="mt-4 text-[10px] text-neutral-600 text-center">
              © 2026 GrabEat · v1.0 · OOP Midterm Project
            </div>
          </div>
        </form>
      </div>

      {onTrack && (
        <button
          type="button"
          onClick={onTrack}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 hover:border-red-600 hover:text-red-500 text-neutral-400 text-sm transition"
        >
          <ReceiptText className="w-4 h-4" />
          Track my order
        </button>
      )}
    </div>
  );
}
