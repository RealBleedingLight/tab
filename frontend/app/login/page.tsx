"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(pin);
      router.push("/");
      router.refresh();
    } catch {
      setError("Wrong pin. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold mb-8 text-center text-zinc-100">
          Guitar Teacher
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-center text-2xl tracking-widest focus:outline-none focus:border-zinc-500"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || pin.length === 0}
            className="w-full py-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? "Checking..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
