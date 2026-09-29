"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseScoreBytes, preloadAlphaTab } from "@/lib/alphatab/loader";
import { cacheScore } from "@/lib/song/cache";
import { hashBytes, saveSong } from "@/lib/storage/library";

export const ACCEPTED = [".gp", ".gp3", ".gp4", ".gp5", ".gpx", ".gp7", ".musicxml", ".mxl", ".xml"];
const MAX_BYTES = 30 * 1024 * 1024;

export default function UploadDropzone({ onAdded }: { onAdded?: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setError(`"${file.name}" isn't a Guitar Pro or MusicXML file (${ACCEPTED.join(", ")}).`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is larger than 30 MB — is it really a tab file?");
      return;
    }
    setBusy(true);
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const score = await parseScoreBytes(data);
      const id = hashBytes(data);
      const now = Date.now();
      await saveSong({
        id,
        fileName: file.name,
        title: score.title || file.name.replace(/\.[^.]+$/, ""),
        artist: /^(https?:|www\.)/i.test(score.artist ?? "") ? "" : score.artist || "",
        trackCount: score.tracks.length,
        bars: score.masterBars.length,
        addedAt: now,
        lastOpenedAt: now,
        size: data.byteLength,
        data,
      }).catch(() => { /* private mode etc. — still open the song this session */ });
      cacheScore(id, score);
      onAdded?.();
      router.push(`/song?id=${encodeURIComponent(id)}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(/unsupported|no reader/i.test(msg)
        ? "This file format isn't supported. Try exporting it as .gp5 or .gp from Guitar Pro / TuxGuitar."
        : `Couldn't read that file: ${msg}`);
      setBusy(false);
    }
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragEnter={() => preloadAlphaTab()}
      onDragLeave={() => setDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) void handleFile(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onMouseEnter={() => preloadAlphaTab()}
        onFocus={() => preloadAlphaTab()}
        disabled={busy}
        className={`w-full rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? "border-amber-400 bg-amber-500/5" : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/60"
        } disabled:opacity-60`}
      >
        {busy ? (
          <span className="flex items-center justify-center gap-3 text-zinc-300">
            <span className="w-4 h-4 border-2 border-zinc-500 border-t-amber-400 rounded-full animate-spin" />
            Reading tab…
          </span>
        ) : (
          <span className="space-y-1 block">
            <span className="block text-base font-medium text-zinc-100">Drop a Guitar Pro file here</span>
            <span className="block text-sm text-zinc-400">or click to browse · .gp .gp5 .gpx .gp4 .gp3 · MusicXML</span>
          </span>
        )}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
