"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type AuthResponse = { token: string; user: { id: string; name: string; email: string } };

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { name, email, password };
      const data = await api<AuthResponse>(endpoint, { method: "POST", body: JSON.stringify(body) });
      setAuth(data.token, data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not authenticate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md space-y-5 rounded-lg border border-slate-800 p-6">
      <div className="flex gap-2">
        <button className={`rounded px-3 py-1 ${mode === "login" ? "bg-indigo-600" : "bg-slate-800"}`} onClick={() => setMode("login")}>Login</button>
        <button className={`rounded px-3 py-1 ${mode === "register" ? "bg-indigo-600" : "bg-slate-800"}`} onClick={() => setMode("register")}>Register</button>
      </div>
      <form className="space-y-3" onSubmit={submit}>
        {mode === "register" && (
          <input className="w-full rounded bg-slate-900 p-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
        )}
        <input className="w-full rounded bg-slate-900 p-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
        <input className="w-full rounded bg-slate-900 p-2" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button className="w-full rounded bg-indigo-600 p-2" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}</button>
      </form>
    </section>
  );
}
