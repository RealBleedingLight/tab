interface Props {
  tab: string
  className?: string
}

export function TabViewer({ tab, className = "" }: Props) {
  return (
    <pre className={`font-mono text-xs leading-5 text-zinc-300 overflow-x-auto whitespace-pre bg-zinc-950 border border-zinc-800 rounded-xl p-4 ${className}`}>
      {tab || "No tab available for this file."}
    </pre>
  )
}
