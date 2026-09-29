import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Tab Engine — learn solos from Guitar Pro files",
  description: "Open a Guitar Pro file to see the tab, hear it, slow it down, and follow a step-by-step lesson plan. Runs entirely in your browser.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen antialiased`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
