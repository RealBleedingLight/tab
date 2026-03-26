"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import type { QueueFile, JobStatus } from "@/lib/types";

const MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "gpt-4o", "gemini-pro"];

interface ActiveJob {
  filename: string;
  jobId: string;
  status: JobStatus | null;
}

const JOB_STORAGE_KEY = "queue_active_job";

export default function QueuePage() {
  const [files, setFiles] = useState<QueueFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      const { files } = await api.listQueue();
      setFiles(files);
    } catch {
      // offline or backend down — show empty
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore in-progress job from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(JOB_STORAGE_KEY);
    if (stored) {
      try { setActiveJob(JSON.parse(stored)); } catch { localStorage.removeItem(JOB_STORAGE_KEY); }
    }
    loadFiles();
  }, [loadFiles]);

  // Poll job status every 3 seconds while job is running
  useEffect(() => {
    if (!activeJob || !activeJob.jobId) return;

    // Persist job so it survives navigation
    localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(activeJob));

    if (activeJob.status?.status === "completed" || activeJob.status?.status === "failed") {
      localStorage.removeItem(JOB_STORAGE_KEY);
      return;
    }

    pollRef.current = setTimeout(async () => {
      try {
        const status = await api.getJobStatus(activeJob.jobId);
        setActiveJob(prev => prev ? { ...prev, status } : null);
        if (status.status === "completed") {
          loadFiles();
        }
      } catch { /* ignore */ }
    }, 3000);

    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [activeJob, loadFiles]);

  async function handleUpload(file: File) {
    if (!file.name.match(/\.(gp|gp5|gpx)$/i)) {
      alert("Only Guitar Pro files (.gp, .gp5, .gpx) are supported.");
      return;
    }
    setUploading(true);
    try {
      await api.uploadToQueue(file);
      await loadFiles();
    } catch {
      alert("Upload failed. Check backend connection.");
    } finally {
      setUploading(false);
    }
  }

  async function processFile(filename: string) {
    try {
      const { job_id } = await api.processFile(filename, selectedModel);
      const job = { filename, jobId: job_id, status: null };
      setActiveJob(job);
      localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(job));
    } catch {
      alert("Failed to start processing.");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Queue</h1>

      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? "border-zinc-400 bg-zinc-800" : "border-zinc-700 hover:border-zinc-600"
        }`}
      >
        <p className="text-zinc-400 text-sm">
          {uploading ? "Uploading..." : "Drop a .gp file here or tap to browse"}
        </p>
        <p className="text-zinc-600 text-xs mt-1">File must be named: <span className="font-mono">Artist - Song.gp</span></p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".gp,.gp5,.gpx"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
        />
      </div>

      {/* Active job progress */}
      {activeJob && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium">{activeJob.filename}</p>
          {!activeJob.status && <p className="text-xs text-zinc-500 animate-pulse">Starting...</p>}
          {activeJob.status?.status === "running" && (
            <p className="text-xs text-zinc-400 animate-pulse">{activeJob.status.progress ?? "Processing..."}</p>
          )}
          {activeJob.status?.status === "completed" && (
            <p className="text-xs text-green-400">Lessons generated successfully</p>
          )}
          {activeJob.status?.status === "failed" && (
            <p className="text-xs text-red-400">{activeJob.status.error}</p>
          )}
        </div>
      )}

      {/* Queued files */}
      {loading ? (
        <p className="text-zinc-500 text-sm animate-pulse">Loading queue...</p>
      ) : files.length === 0 ? (
        <p className="text-zinc-600 text-sm">Queue is empty. Drop a Guitar Pro file above to get started.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-400">Queued files</h2>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300"
            >
              {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {files.map(file => (
            <div key={file.path} className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <span className="text-sm font-mono text-zinc-300 truncate mr-4">{file.name}</span>
              <button
                onClick={() => processFile(file.name)}
                disabled={!!activeJob && activeJob.status?.status === "running"}
                className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 rounded-lg transition-colors shrink-0"
              >
                Process
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
