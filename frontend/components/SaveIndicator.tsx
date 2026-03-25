interface Props {
  state: "idle" | "saving" | "saved" | "offline";
  savedAt: Date | null;
}

function minutesAgo(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 60000);
}

export default function SaveIndicator({ state, savedAt }: Props) {
  if (state === "saving") {
    return <span className="text-xs text-zinc-400 animate-pulse">saving...</span>;
  }
  if (state === "offline") {
    return <span className="text-xs text-amber-400">offline — will sync later</span>;
  }
  if (state === "saved" && savedAt) {
    const mins = minutesAgo(savedAt);
    const label = mins === 0 ? "just now" : `${mins} min ago`;
    return <span className="text-xs text-zinc-500">saved {label}</span>;
  }
  return null;
}
