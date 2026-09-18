import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-bold">Guitar Tab Engine</h1>
        <p className="text-zinc-400 mt-2">Algorithmic music theory analysis for guitar</p>
      </div>

      <div className="space-y-3">
        <Link
          href="/tab"
          className="block bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-600 transition-colors"
        >
          <h2 className="text-lg font-semibold">Tab Analysis</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Paste ASCII tab to detect key, scales, and get improvisation suggestions
          </p>
        </Link>

        <Link
          href="/theory"
          className="block bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-zinc-600 transition-colors"
        >
          <h2 className="text-lg font-semibold">Theory Reference</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Look up scales, chords, keys, and intervals
          </p>
        </Link>
      </div>
    </div>
  );
}
