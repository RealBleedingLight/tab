"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Library" },
  { href: "/tab", label: "ASCII tab" },
  { href: "/theory", label: "Theory" },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 h-12 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <nav className="max-w-7xl mx-auto h-full px-4 flex items-center gap-1">
        <Link href="/" className="mr-4 font-semibold tracking-tight flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-amber-500 text-zinc-950 text-xs font-bold flex items-center justify-center">T</span>
          <span className="hidden sm:inline">Tab Engine</span>
        </Link>
        {LINKS.map(l => {
          const active = l.href === "/" ? pathname === "/" || pathname.startsWith("/song") : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-100"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
