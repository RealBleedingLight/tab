import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Guitar Teacher",
  description: "Leo's guitar practice platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen pb-20`}>
        <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
