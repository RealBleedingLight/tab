"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SongWorkspace from "@/components/SongWorkspace";

function SongRoute() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-3">
        <p className="text-zinc-400">No song selected.</p>
        <Link href="/" className="underline">Open a Guitar Pro file</Link>
      </div>
    );
  }
  return <SongWorkspace key={id} id={id} />;
}

export default function SongPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-zinc-500">Loading…</div>}>
      <SongRoute />
    </Suspense>
  );
}
