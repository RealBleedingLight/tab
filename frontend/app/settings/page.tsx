export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">About</h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
        <p className="text-sm text-zinc-400">
          Guitar Tab Engine — algorithmic music theory analysis for guitar.
        </p>
        <p className="text-sm text-zinc-400">
          All analysis runs locally in your browser. No backend, no API keys required.
        </p>
      </div>
    </div>
  );
}
