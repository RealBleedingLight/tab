import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Guitar Teacher",
  description: "Practice solos. Learn theory.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        <header className="border-b border-zinc-800 px-6 py-4">
          <nav className="max-w-6xl mx-auto flex items-center gap-8">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Guitar Teacher
            </Link>
            <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Songs
            </Link>
            <Link href="/theory" className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">
              Theory
            </Link>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
