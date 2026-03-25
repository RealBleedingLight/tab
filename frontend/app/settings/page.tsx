"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "gpt-4o", "gemini-pro"];

export default function SettingsPage() {
  const router = useRouter();
  const [defaultModel, setDefaultModel] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("defaultModel") ?? MODELS[0] : MODELS[0]
  );

  function saveModel(model: string) {
    setDefaultModel(model);
    localStorage.setItem("defaultModel", model);
  }

  async function logout() {
    document.cookie = "token=; Max-Age=0; path=/";
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div>
          <label className="text-sm text-zinc-400 block mb-2">Default AI Model</label>
          <select
            value={defaultModel}
            onChange={e => saveModel(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
          >
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <p className="text-xs text-zinc-600 mt-1">Used when processing GP files in the Queue</p>
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-1">Backend</label>
          <p className="text-xs text-zinc-600 font-mono">
            {process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}
          </p>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm text-zinc-400 transition-colors"
      >
        Log out
      </button>
    </div>
  );
}
