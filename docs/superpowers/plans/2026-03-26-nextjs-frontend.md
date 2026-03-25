# Next.js Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Next.js frontend on Vercel for Leo's guitar practice platform — dashboard, practice sessions, theory lookups, GP file queue, and song management.

**Architecture:** Next.js 14 App Router (TypeScript + Tailwind, dark theme, bottom tab nav). Client components make direct fetch calls to the FastAPI backend with httpOnly JWT cookies for auth. Middleware guards all routes except `/login`. SVG components render fretboard/chord diagrams from structured data returned by `/theory/*` endpoints.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, react-markdown, remark-gfm, swr, Jest, React Testing Library

**Spec:** `docs/superpowers/specs/2026-03-25-guitar-teacher-web-platform-design.md`
**Backend plan:** `docs/superpowers/plans/2026-03-25-fastapi-backend.md`

---

## File Structure

```
frontend/
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── jest.config.ts
├── jest.setup.ts
├── .env.local.example
├── app/
│   ├── globals.css
│   ├── layout.tsx                      # Root layout: dark theme, BottomNav
│   ├── middleware.ts                   # Auth guard → redirect to /login
│   ├── page.tsx                        # Dashboard: song list + progress bars
│   ├── login/
│   │   └── page.tsx                    # Pin entry form → POST /auth/login
│   ├── practice/
│   │   └── [artist]/[song]/
│   │       └── page.tsx                # Lesson walkthrough, checkboxes, auto-save
│   ├── theory/
│   │   └── page.tsx                    # Scale/chord/key lookup + fretboard SVG
│   ├── songs/
│   │   └── [artist]/[song]/
│   │       └── page.tsx                # Song overview: lesson index
│   ├── queue/
│   │   └── page.tsx                    # GP file upload + processing + polling
│   └── settings/
│       └── page.tsx                    # Settings: model prefs, backend info
├── components/
│   ├── BottomNav.tsx                   # Tab bar: Dashboard, Theory, Queue
│   ├── Fretboard.tsx                   # SVG fretboard with note positions
│   ├── MarkdownLesson.tsx              # react-markdown wrapper
│   ├── ProgressBar.tsx                 # Lessons completed / total
│   └── SaveIndicator.tsx               # "saved 2 min ago" / "saving..." / "offline"
├── lib/
│   ├── api.ts                          # All fetch calls to FastAPI backend
│   └── types.ts                        # TypeScript types matching backend JSON
└── __tests__/
    ├── lib/
    │   └── api.test.ts                 # API client unit tests (fetch mocked)
    └── components/
        ├── Fretboard.test.tsx
        ├── ProgressBar.test.tsx
        └── SaveIndicator.test.tsx
```

---

### Task 1: Project Setup — Next.js, Tailwind, Jest

**Files:**
- Create: `frontend/` (whole directory)
- Create: `frontend/jest.config.ts`
- Create: `frontend/jest.setup.ts`
- Create: `frontend/.env.local.example`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/tailwind.config.ts`

- [ ] **Step 1: Scaffold Next.js app**

Run from repo root:
```bash
cd /Users/leo/hobby/tab
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-turbopack
```
Expected: `frontend/` created with Next.js 14 App Router structure.

- [ ] **Step 2: Add runtime + test dependencies**

```bash
cd /Users/leo/hobby/tab/frontend
npm install react-markdown remark-gfm swr
npm install --save-dev jest jest-environment-jsdom \
  @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom @types/jest
```
Expected: Installs without errors.

- [ ] **Step 3: Configure Jest with Next.js preset**

```typescript
// frontend/jest.config.ts
import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterFramework: ["<rootDir>/jest.setup.ts"],
};

export default createJestConfig(config);
```

**Note:** The setup-files option name is `setupFilesAfterFramework`. If TypeScript reports an unknown key, check the exact spelling in `node_modules/jest-circus/build/types.d.ts` or the installed Jest version's type definitions and correct it.

```typescript
// frontend/jest.setup.ts
import "@testing-library/jest-dom";
```

Add `"jest"` to `package.json` scripts:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

- [ ] **Step 4: Configure dark theme**

Replace `frontend/tailwind.config.ts` content:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

Replace `frontend/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  background-color: #09090b; /* zinc-950 */
  color: #f4f4f5; /* zinc-100 */
  font-family: var(--font-inter), sans-serif;
}

/* Monospace tab display: horizontal scroll, no wrap */
.tab-content {
  font-family: "JetBrains Mono", "Fira Code", "Courier New", monospace;
  white-space: pre;
  overflow-x: auto;
  font-size: 0.75rem;
  line-height: 1.5;
}
```

- [ ] **Step 5: Create `.env.local.example`**

```bash
# frontend/.env.local.example
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

- [ ] **Step 6: Verify dev server starts**

```bash
cd /Users/leo/hobby/tab/frontend
npm run dev &
sleep 4
curl -sf http://localhost:3000 > /dev/null && echo "OK" || echo "FAIL"
kill %1
```
Expected: prints `OK`.

- [ ] **Step 7: Commit**

```bash
cd /Users/leo/hobby/tab
git add frontend/
git commit -m "feat(frontend): bootstrap Next.js app with Tailwind, dark theme, and Jest"
```

---

### Task 2: Types + API Client

**Files:**
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/api.ts`
- Create: `frontend/__tests__/lib/api.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/__tests__/lib/api.test.ts
import { api } from "@/lib/api";

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
  process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:8000";
});

function mockResponse(data: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  });
}

describe("api.login", () => {
  it("posts pin and returns token", async () => {
    mockResponse({ token: "abc.def.ghi" });
    const result = await api.login("1234");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/auth/login",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ pin: "1234" }),
        credentials: "include",
      })
    );
    expect(result.token).toBe("abc.def.ghi");
  });

  it("throws on wrong pin (401)", async () => {
    mockResponse({ detail: "Invalid pin" }, 401);
    await expect(api.login("0000")).rejects.toThrow("401");
  });
});

describe("api.listSongs", () => {
  it("fetches songs list", async () => {
    mockResponse({ songs: [{ artist: "megadeth", song: "tornado-of-souls", path: "songs/megadeth/tornado-of-souls", context: null }] });
    const result = await api.listSongs();
    expect(result.songs).toHaveLength(1);
    expect(result.songs[0].artist).toBe("megadeth");
  });
});

describe("api.getScale", () => {
  it("fetches scale data", async () => {
    mockResponse({ root: "D", name: "Dorian", notes: ["D", "E", "F", "G", "A", "B", "C"], fretboard: [] });
    const result = await api.getScale("D", "dorian");
    expect(result.root).toBe("D");
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/theory/scale/D/dorian",
      expect.objectContaining({ credentials: "include" })
    );
  });
});

describe("api.uploadToQueue", () => {
  it("posts file as FormData", async () => {
    mockResponse({ status: "uploaded", filename: "Test.gp" });
    const file = new File([new Uint8Array([1, 2, 3])], "Test.gp", { type: "application/octet-stream" });
    await api.uploadToQueue(file);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/queue/upload",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
    // FormData: Content-Type must NOT be manually set (browser sets with boundary)
    const call = mockFetch.mock.calls[0][1];
    expect(call.headers?.["Content-Type"]).toBeUndefined();
  });
});

describe("api.saveProgress", () => {
  it("posts to save-progress endpoint", async () => {
    mockResponse({ status: "saved" });
    await api.saveProgress("megadeth", "tornado-of-souls", {
      context_content: "current_lesson: 6",
      log_entry: "\n## 2026-03-26\n- Lesson 5 done",
      commit_message: "Practice: tornado-of-souls lesson 5",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8000/songs/megadeth/tornado-of-souls/save-progress",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/leo/hobby/tab/frontend
npm test -- --testPathPattern=api.test
```
Expected: FAIL — `Cannot find module '@/lib/api'`

- [ ] **Step 3: Create types**

```typescript
// frontend/lib/types.ts

export interface Song {
  artist: string;
  song: string;
  path: string;
  context: string | null;
}

export interface FretboardPosition {
  string: number;  // 0 = low E, 5 = high e
  fret: number;
  note: string;
  is_root: boolean;
}

export interface ScaleResult {
  root: string;
  name: string;
  notes: string[];
  intervals: number[];
  category: string;
  character: string;
  common_in: string[];
  chord_fit: string[];
  teaching_note: string;
  improvisation_tip: string;
  fretboard: FretboardPosition[];
}

export interface ChordResult {
  root: string;
  symbol: string;
  name: string;
  notes: string[];
  intervals: number[];
  character: string;
  voicings: Record<string, number[]> | null;
}

export interface KeyChord {
  numeral: string;
  root: string;
  symbol: string;
  notes: string[];
}

export interface KeyResult {
  key: string;
  chords: KeyChord[];
}

export interface KeyMatch {
  root: string;
  scale_name: string;
  score: number;
  notes_matched: number;
  total_notes: number;
  outside_notes: string[];
}

export interface ScaleSuggestion {
  root: string;
  name: string;
  notes: string[];
  score: number;
}

export interface IntervalResult {
  note1: string;
  note2: string;
  name: string;
  short_name: string;
  semitones: number;
  quality: string;
}

export interface QueueFile {
  name: string;
  type: string;
  path: string;
}

export interface JobStatus {
  id: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
}

export interface SaveProgressRequest {
  context_content: string;
  log_entry: string;
  commit_message: string;
}

export interface LessonFile {
  content: string;
  sha: string;
  filename: string;
}

export interface ContextFile {
  content: string;
  sha: string;
}
```

- [ ] **Step 4: Implement API client**

```typescript
// frontend/lib/api.ts
import type {
  Song, ScaleResult, ChordResult, KeyResult,
  KeyMatch, ScaleSuggestion, IntervalResult,
  QueueFile, JobStatus, SaveProgressRequest,
  LessonFile, ContextFile,
} from "@/lib/types";

const backend = () =>
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${backend()}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${backend()}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${backend()}${path}`, {
    method: "POST",
    credentials: "include",
    body: form,
    // No Content-Type header — browser sets it with boundary automatically
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export const api = {
  // Auth
  login: (pin: string) => post<{ token: string }>("/auth/login", { pin }),
  verify: () => get<{ status: string }>("/auth/verify"),

  // Songs
  listSongs: () => get<{ songs: Song[] }>("/songs"),
  getContext: (artist: string, song: string) =>
    get<ContextFile>(`/songs/${artist}/${song}/context`),
  getLesson: (artist: string, song: string, number: number) =>
    get<LessonFile>(`/songs/${artist}/${song}/lessons/${number}`),
  saveProgress: (artist: string, song: string, req: SaveProgressRequest) =>
    post<{ status: string }>(`/songs/${artist}/${song}/save-progress`, req),

  // Theory
  getScale: (root: string, scaleType: string) =>
    get<ScaleResult>(`/theory/scale/${root}/${scaleType}`),
  getChord: (name: string) =>
    get<ChordResult>(`/theory/chord/${name}`),
  getKey: (root: string, scaleType: string) =>
    get<KeyResult>(`/theory/key/${root}/${scaleType}`),
  identifyKey: (notes: string[]) =>
    get<{ matches: KeyMatch[] }>(`/theory/identify-key?${notes.map(n => `notes=${n}`).join("&")}`),
  suggestScales: (chords: string[]) =>
    get<{ suggestions: ScaleSuggestion[] }>(`/theory/suggest-scales?${chords.map(c => `chords=${c}`).join("&")}`),
  getInterval: (note1: string, note2: string) =>
    get<IntervalResult>(`/theory/interval/${note1}/${note2}`),

  // Queue
  listQueue: () => get<{ files: QueueFile[] }>("/queue"),
  uploadToQueue: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return postForm<{ status: string; filename: string }>("/queue/upload", form);
  },
  processFile: (filename: string, model?: string, order = "difficulty") =>
    post<{ job_id: string; status: string }>(`/queue/process/${encodeURIComponent(filename)}`, { model, order }),
  getJobStatus: (jobId: string) =>
    get<JobStatus>(`/queue/status/${jobId}`),
};
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --testPathPattern=api.test
```
Expected: 5 test suites, all PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/leo/hobby/tab
git add frontend/lib/ frontend/__tests__/lib/
git commit -m "feat(frontend): add TypeScript types and API client"
```

---

### Task 3: Auth — Login Page + Middleware

**Files:**
- Create: `frontend/app/login/page.tsx`
- Create: `frontend/app/middleware.ts`
- Create: `frontend/__tests__/components/` (directory stub, tests added later)

- [ ] **Step 1: Create login page**

```tsx
// frontend/app/login/page.tsx
"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(pin);
      router.push("/");
      router.refresh();
    } catch {
      setError("Wrong pin. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold mb-8 text-center text-zinc-100">
          🎸 Guitar Teacher
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-center text-2xl tracking-widest focus:outline-none focus:border-zinc-500"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || pin.length === 0}
            className="w-full py-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 font-medium transition-colors"
          >
            {loading ? "Checking..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create auth middleware**

```typescript
// frontend/middleware.ts   (at root of frontend/, not inside app/)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const isLoginPage = req.nextUrl.pathname === "/login";

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

Note: The middleware file lives at `frontend/middleware.ts` (Next.js App Router convention — at the same level as `app/`).

- [ ] **Step 3: Verify middleware is at the right path**

```bash
ls /Users/leo/hobby/tab/frontend/middleware.ts
```
Expected: file exists at `frontend/middleware.ts` (not `frontend/app/middleware.ts`).

- [ ] **Step 4: Manually test login flow**

```bash
cd /Users/leo/hobby/tab/frontend
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000 npm run build 2>&1 | tail -10
```
Expected: Build succeeds without TypeScript errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/leo/hobby/tab
git add frontend/app/login/ frontend/middleware.ts
git commit -m "feat(frontend): add pin login page and auth middleware"
```

---

### Task 4: Layout + BottomNav + Shared Components

**Files:**
- Create: `frontend/components/BottomNav.tsx`
- Create: `frontend/components/ProgressBar.tsx`
- Create: `frontend/components/SaveIndicator.tsx`
- Create: `frontend/components/MarkdownLesson.tsx`
- Modify: `frontend/app/layout.tsx`
- Create: `frontend/__tests__/components/ProgressBar.test.tsx`
- Create: `frontend/__tests__/components/SaveIndicator.test.tsx`

- [ ] **Step 1: Write failing component tests**

```tsx
// frontend/__tests__/components/ProgressBar.test.tsx
import { render, screen } from "@testing-library/react";
import ProgressBar from "@/components/ProgressBar";

describe("ProgressBar", () => {
  it("renders completed/total label", () => {
    render(<ProgressBar completed={5} total={22} />);
    expect(screen.getByText("5 / 22")).toBeInTheDocument();
  });

  it("shows percentage width", () => {
    const { container } = render(<ProgressBar completed={11} total={22} />);
    const bar = container.querySelector("[style]");
    expect(bar?.getAttribute("style")).toContain("50%");
  });

  it("handles zero total gracefully", () => {
    render(<ProgressBar completed={0} total={0} />);
    expect(screen.getByText("0 / 0")).toBeInTheDocument();
  });
});
```

```tsx
// frontend/__tests__/components/SaveIndicator.test.tsx
import { render, screen } from "@testing-library/react";
import SaveIndicator from "@/components/SaveIndicator";

describe("SaveIndicator", () => {
  it("shows saving state", () => {
    render(<SaveIndicator state="saving" savedAt={null} />);
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it("shows saved with timestamp", () => {
    const savedAt = new Date(Date.now() - 2 * 60 * 1000); // 2 min ago
    render(<SaveIndicator state="saved" savedAt={savedAt} />);
    expect(screen.getByText(/2 min ago/i)).toBeInTheDocument();
  });

  it("shows offline state", () => {
    render(<SaveIndicator state="offline" savedAt={null} />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/leo/hobby/tab/frontend
npm test -- --testPathPattern="ProgressBar|SaveIndicator"
```
Expected: FAIL — components not found.

- [ ] **Step 3: Implement BottomNav**

```tsx
// frontend/components/BottomNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/theory", label: "Theory", icon: "🎵" },
  { href: "/queue", label: "Queue", icon: "📂" },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-10">
      <div className="max-w-2xl mx-auto flex">
        {tabs.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${
                active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Implement ProgressBar**

```tsx
// frontend/components/ProgressBar.tsx
interface Props {
  completed: number;
  total: number;
}

export default function ProgressBar({ completed, total }: Props) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-zinc-400">
        <span>{completed} / {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Implement SaveIndicator**

```tsx
// frontend/components/SaveIndicator.tsx
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
```

- [ ] **Step 6: Implement MarkdownLesson**

```tsx
// frontend/components/MarkdownLesson.tsx
"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

export default function MarkdownLesson({ content }: Props) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3 text-zinc-100">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-2 text-zinc-200">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 text-zinc-300">{children}</h3>,
          p: ({ children }) => <p className="my-2 text-zinc-300 leading-relaxed">{children}</p>,
          li: ({ children }) => <li className="text-zinc-300">{children}</li>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            return isBlock ? (
              <code className="tab-content block p-3 bg-zinc-900 rounded my-3 overflow-x-auto">{children}</code>
            ) : (
              <code className="bg-zinc-800 px-1 rounded text-zinc-200 font-mono text-sm">{children}</code>
            );
          },
          input: ({ type, checked }) =>
            type === "checkbox" ? (
              <input type="checkbox" defaultChecked={checked} className="mr-2 accent-zinc-400" />
            ) : null,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 7: Update root layout to use BottomNav**

Replace `frontend/app/layout.tsx`:
```tsx
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
```

- [ ] **Step 8: Run tests**

```bash
cd /Users/leo/hobby/tab/frontend
npm test -- --testPathPattern="ProgressBar|SaveIndicator"
```
Expected: All pass.

- [ ] **Step 9: Run full test suite and build**

```bash
npm test && npm run build 2>&1 | tail -10
```
Expected: All tests pass, build succeeds.

- [ ] **Step 10: Commit**

```bash
cd /Users/leo/hobby/tab
git add frontend/components/ frontend/app/layout.tsx frontend/__tests__/
git commit -m "feat(frontend): add BottomNav, ProgressBar, SaveIndicator, MarkdownLesson components"
```

---

### Task 5: Dashboard Page

**Files:**
- Modify: `frontend/app/page.tsx`

The Dashboard fetches all songs from `GET /songs` and displays them as a list with progress bars and "resume" links. Since `/songs` returns the raw `.context.md` text, the dashboard parses `current_lesson` and `total_lessons` from the YAML frontmatter.

- [ ] **Step 1: Implement dashboard page**

```tsx
// frontend/app/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Song } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";

interface SongWithProgress extends Song {
  currentLesson: number;
  totalLessons: number;
  lastSession: string | null;
}

function parseContext(raw: string | null): { currentLesson: number; totalLessons: number; lastSession: string | null } {
  if (!raw) return { currentLesson: 1, totalLessons: 0, lastSession: null };
  const cur = raw.match(/current_lesson:\s*(\d+)/)?.[1];
  const tot = raw.match(/total_lessons:\s*(\d+)/)?.[1];
  const date = raw.match(/last_session:\s*(.+)/)?.[1]?.trim();
  return {
    currentLesson: cur ? parseInt(cur) : 1,
    totalLessons: tot ? parseInt(tot) : 0,
    lastSession: date ?? null,
  };
}

export default function DashboardPage() {
  const [songs, setSongs] = useState<SongWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listSongs()
      .then(({ songs }) => {
        setSongs(songs.map(s => ({
          ...s,
          ...parseContext(s.context),
        })));
      })
      .catch(() => setError("Could not load songs. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-zinc-500 text-sm animate-pulse">Loading songs...</div>;
  }

  if (error) {
    return <div className="text-red-400 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>

      {songs.length === 0 && (
        <p className="text-zinc-500 text-sm">No songs yet. Drop a GP file in the Queue to get started.</p>
      )}

      <div className="space-y-3">
        {songs.map(song => (
          <div
            key={song.path}
            className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-zinc-100 capitalize">
                  {song.song.replace(/-/g, " ")}
                </p>
                <p className="text-sm text-zinc-500 capitalize">
                  {song.artist.replace(/-/g, " ")}
                </p>
              </div>
              <Link
                href={`/practice/${song.artist}/${song.song}`}
                className="text-sm px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors shrink-0 ml-4"
              >
                Lesson {song.currentLesson}
              </Link>
            </div>

            {song.totalLessons > 0 && (
              <ProgressBar
                completed={song.currentLesson - 1}
                total={song.totalLessons}
              />
            )}

            {song.lastSession && (
              <p className="text-xs text-zinc-600">Last session: {song.lastSession}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it builds**

```bash
cd /Users/leo/hobby/tab/frontend && npm run build 2>&1 | tail -5
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/leo/hobby/tab
git add frontend/app/page.tsx
git commit -m "feat(frontend): add dashboard page with song list and progress bars"
```

---

### Task 6: Practice Session Page + Fretboard SVG

**Files:**
- Create: `frontend/app/practice/[artist]/[song]/page.tsx`
- Create: `frontend/components/Fretboard.tsx`
- Create: `frontend/__tests__/components/Fretboard.test.tsx`

This is the most complex page. It loads the current lesson, renders it as markdown, manages checkbox state, auto-saves every 10 minutes, and allows "Complete lesson" to advance the lesson number.

- [ ] **Step 1: Write Fretboard tests**

```tsx
// frontend/__tests__/components/Fretboard.test.tsx
import { render, screen } from "@testing-library/react";
import Fretboard from "@/components/Fretboard";
import type { FretboardPosition } from "@/lib/types";

const positions: FretboardPosition[] = [
  { string: 0, fret: 5, note: "A", is_root: true },
  { string: 0, fret: 7, note: "B", is_root: false },
  { string: 1, fret: 5, note: "D", is_root: false },
];

describe("Fretboard", () => {
  it("renders an SVG element", () => {
    const { container } = render(<Fretboard positions={positions} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders note labels", () => {
    render(<Fretboard positions={positions} />);
    expect(screen.getAllByText("A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("B").length).toBeGreaterThan(0);
  });

  it("renders root note differently", () => {
    const { container } = render(<Fretboard positions={positions} />);
    // Root notes use a different fill class
    const rootCircles = container.querySelectorAll("circle.root-note");
    expect(rootCircles.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
cd /Users/leo/hobby/tab/frontend
npm test -- --testPathPattern=Fretboard
```
Expected: FAIL.

- [ ] **Step 3: Implement Fretboard SVG component**

```tsx
// frontend/components/Fretboard.tsx
import type { FretboardPosition } from "@/lib/types";

interface Props {
  positions: FretboardPosition[];
  fretRange?: [number, number];
}

const STRING_COUNT = 6;
const FRET_SPACING = 36;
const STRING_SPACING = 20;
const LEFT_MARGIN = 28;
const TOP_MARGIN = 16;
const CIRCLE_R = 8;

const STRING_NAMES = ["E", "A", "D", "G", "B", "e"]; // low to high

export default function Fretboard({ positions, fretRange = [0, 15] }: Props) {
  const [minFret, maxFret] = fretRange;
  const fretCount = maxFret - minFret + 1;
  const width = LEFT_MARGIN + fretCount * FRET_SPACING + 20;
  const height = TOP_MARGIN + (STRING_COUNT - 1) * STRING_SPACING + TOP_MARGIN;

  function x(fret: number) {
    return LEFT_MARGIN + (fret - minFret) * FRET_SPACING + FRET_SPACING / 2;
  }
  function y(string: number) {
    // string 0 = low E (bottom), 5 = high e (top) — flip for visual
    return TOP_MARGIN + (STRING_COUNT - 1 - string) * STRING_SPACING;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      aria-label="Fretboard diagram"
    >
      {/* Fret lines */}
      {Array.from({ length: fretCount + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={LEFT_MARGIN + i * FRET_SPACING}
          y1={TOP_MARGIN}
          x2={LEFT_MARGIN + i * FRET_SPACING}
          y2={TOP_MARGIN + (STRING_COUNT - 1) * STRING_SPACING}
          stroke="#3f3f46"
          strokeWidth={i === 0 ? 3 : 1}
        />
      ))}

      {/* String lines */}
      {Array.from({ length: STRING_COUNT }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={LEFT_MARGIN}
          y1={y(i)}
          x2={LEFT_MARGIN + fretCount * FRET_SPACING}
          y2={y(i)}
          stroke="#52525b"
          strokeWidth={1}
        />
      ))}

      {/* Fret numbers */}
      {Array.from({ length: fretCount }, (_, i) => {
        const fret = minFret + i;
        if (fret % 3 !== 0 && fret !== 12) return null;
        return (
          <text
            key={`fret-num-${fret}`}
            x={x(fret)}
            y={height - 2}
            textAnchor="middle"
            fontSize="9"
            fill="#71717a"
          >
            {fret}
          </text>
        );
      })}

      {/* Note positions */}
      {positions.map((pos, idx) => (
        <g key={idx}>
          <circle
            className={pos.is_root ? "root-note" : "scale-note"}
            cx={x(pos.fret)}
            cy={y(pos.string)}
            r={CIRCLE_R}
            fill={pos.is_root ? "#f4f4f5" : "none"}
            stroke={pos.is_root ? "#f4f4f5" : "#a1a1aa"}
            strokeWidth={1.5}
          />
          <text
            x={x(pos.fret)}
            y={y(pos.string)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="8"
            fill={pos.is_root ? "#09090b" : "#a1a1aa"}
            style={{ pointerEvents: "none" }}
          >
            {pos.note}
          </text>
        </g>
      ))}
    </svg>
  );
}
```

- [ ] **Step 4: Run Fretboard tests**

```bash
npm test -- --testPathPattern=Fretboard
```
Expected: All pass.

- [ ] **Step 5: Implement practice session page**

```tsx
// frontend/app/practice/[artist]/[song]/page.tsx
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import MarkdownLesson from "@/components/MarkdownLesson";
import SaveIndicator from "@/components/SaveIndicator";

type SaveState = "idle" | "saving" | "saved" | "offline";

interface SessionState {
  contextContent: string;
  currentLesson: number;
  tempo: string;
  notes: string;
}

function parseCurrentLesson(context: string): number {
  const m = context.match(/current_lesson:\s*(\d+)/);
  return m ? parseInt(m[1]) : 1;
}

function updateContextLesson(context: string, lesson: number): string {
  return context.replace(/current_lesson:\s*\d+/, `current_lesson: ${lesson}`);
}

export default function PracticePage() {
  const { artist, song } = useParams<{ artist: string; song: string }>();
  const [lessonContent, setLessonContent] = useState<string | null>(null);
  const [contextContent, setContextContent] = useState("");
  const [currentLesson, setCurrentLesson] = useState(1);
  const [tempo, setTempo] = useState("");
  const [notes, setNotes] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load context + lesson on mount
  useEffect(() => {
    async function load() {
      try {
        const ctx = await api.getContext(artist, song);
        setContextContent(ctx.content);
        const lessonNum = parseCurrentLesson(ctx.content);
        setCurrentLesson(lessonNum);
        const lesson = await api.getLesson(artist, song, lessonNum);
        setLessonContent(lesson.content);
      } catch {
        setError("Could not load lesson. Check backend connection.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [artist, song]);

  const save = useCallback(async (newContextContent?: string) => {
    const content = newContextContent ?? contextContent;
    setSaveState("saving");
    try {
      const today = new Date().toISOString().split("T")[0];
      const logEntry = `\n## ${today}\n- Lesson ${currentLesson}${tempo ? ` — ${tempo} BPM` : ""}${notes ? `\n- Notes: ${notes}` : ""}`;
      await api.saveProgress(artist, song, {
        context_content: content,
        log_entry: logEntry,
        commit_message: `Practice: ${song} lesson ${currentLesson}`,
      });
      setSaveState("saved");
      setSavedAt(new Date());
    } catch {
      setSaveState("offline");
    }
  }, [artist, song, contextContent, currentLesson, tempo, notes]);

  // Auto-save every 10 minutes
  useEffect(() => {
    autoSaveRef.current = setInterval(() => save(), 10 * 60 * 1000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [save]);

  async function completeLesson() {
    const nextLesson = currentLesson + 1;
    const newContext = updateContextLesson(contextContent, nextLesson);
    setCurrentLesson(nextLesson);
    setContextContent(newContext);
    await save(newContext);
    // Load next lesson
    try {
      const lesson = await api.getLesson(artist, song, nextLesson);
      setLessonContent(lesson.content);
    } catch {
      setLessonContent("🎉 No more lessons! You've completed this song.");
    }
  }

  if (loading) return <div className="text-zinc-500 animate-pulse text-sm">Loading lesson...</div>;
  if (error) return <div className="text-red-400 text-sm">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold capitalize">{song.replace(/-/g, " ")}</h1>
          <p className="text-sm text-zinc-500 capitalize">{artist.replace(/-/g, " ")}</p>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator state={saveState} savedAt={savedAt} />
          <button
            onClick={() => save()}
            className="text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-1">
        <div className="flex gap-3 p-3 border-b border-zinc-800">
          <div className="flex-1">
            <label className="text-xs text-zinc-500 block mb-1">Tempo (BPM)</label>
            <input
              type="number"
              value={tempo}
              onChange={(e) => setTempo(e.target.value)}
              placeholder="120"
              className="w-full bg-zinc-800 rounded px-2 py-1 text-sm text-zinc-100 border-none outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-zinc-500 block mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's sticking..."
              className="w-full bg-zinc-800 rounded px-2 py-1 text-sm text-zinc-100 border-none outline-none"
            />
          </div>
        </div>

        <div className="p-3">
          <p className="text-xs text-zinc-600 mb-3 font-medium uppercase tracking-wider">
            Lesson {currentLesson}
          </p>
          {lessonContent && <MarkdownLesson content={lessonContent} />}
        </div>
      </div>

      <button
        onClick={completeLesson}
        className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 rounded-xl font-medium transition-colors"
      >
        ✓ Complete Lesson {currentLesson}
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Build check**

```bash
cd /Users/leo/hobby/tab/frontend && npm run build 2>&1 | tail -5
```
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
cd /Users/leo/hobby/tab
git add frontend/components/Fretboard.tsx frontend/app/practice/ frontend/__tests__/components/Fretboard.test.tsx
git commit -m "feat(frontend): add practice session page and Fretboard SVG component"
```

---

### Task 7: Theory Page

**Files:**
- Create: `frontend/app/theory/page.tsx`

The theory page provides four lookup tools: scale (with fretboard), chord, key (diatonic chords), and interval calculator.

- [ ] **Step 1: Implement theory page**

```tsx
// frontend/app/theory/page.tsx
"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { ScaleResult, ChordResult, KeyResult, IntervalResult } from "@/lib/types";
import Fretboard from "@/components/Fretboard";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SCALES = ["major", "minor", "dorian", "phrygian", "lydian", "mixolydian", "locrian",
  "harmonic-minor", "melodic-minor", "pentatonic-major", "pentatonic-minor",
  "blues", "japanese-pentatonic", "whole-tone", "diminished"];

type Tab = "scale" | "chord" | "key" | "interval";

export default function TheoryPage() {
  const [tab, setTab] = useState<Tab>("scale");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Theory</h1>

      <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
        {(["scale", "chord", "key", "interval"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 text-sm rounded capitalize transition-colors ${
              tab === t ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "scale" && <ScaleLookup />}
      {tab === "chord" && <ChordLookup />}
      {tab === "key" && <KeyLookup />}
      {tab === "interval" && <IntervalLookup />}
    </div>
  );
}

function ScaleLookup() {
  const [root, setRoot] = useState("A");
  const [scaleType, setScaleType] = useState("pentatonic-minor");
  const [result, setResult] = useState<ScaleResult | null>(null);
  const [error, setError] = useState("");

  async function lookup() {
    setError("");
    try {
      setResult(await api.getScale(root, scaleType));
    } catch {
      setError("Scale not found.");
      setResult(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select value={root} onChange={e => setRoot(e.target.value)}
          className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          {NOTES.map(n => <option key={n}>{n}</option>)}
        </select>
        <select value={scaleType} onChange={e => setScaleType(e.target.value)}
          className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          {SCALES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={lookup}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
          Look up
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
          <div>
            <h2 className="text-lg font-semibold">{result.root} {result.name}</h2>
            <p className="text-sm text-zinc-400">{result.character}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.notes.map(n => (
              <span key={n} className="px-2 py-1 bg-zinc-800 rounded text-sm font-mono">{n}</span>
            ))}
          </div>
          <Fretboard positions={result.fretboard} />
          {result.improvisation_tip && (
            <p className="text-sm text-zinc-400 italic">💡 {result.improvisation_tip}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ChordLookup() {
  const [name, setName] = useState("Am7");
  const [result, setResult] = useState<ChordResult | null>(null);
  const [error, setError] = useState("");

  async function lookup() {
    setError("");
    try {
      setResult(await api.getChord(name));
    } catch {
      setError("Chord not found.");
      setResult(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)}
          placeholder="Am7, G, Cmaj7..."
          className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700"
          onKeyDown={e => e.key === "Enter" && lookup()}
        />
        <button onClick={lookup}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
          Look up
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
          <h2 className="text-lg font-semibold">{result.symbol} — {result.name}</h2>
          <p className="text-sm text-zinc-400">{result.character}</p>
          <div className="flex flex-wrap gap-2">
            {result.notes.map(n => (
              <span key={n} className="px-2 py-1 bg-zinc-800 rounded text-sm font-mono">{n}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KeyLookup() {
  const [root, setRoot] = useState("C");
  const [scaleType, setScaleType] = useState("major");
  const [result, setResult] = useState<KeyResult | null>(null);
  const [error, setError] = useState("");

  async function lookup() {
    setError("");
    try {
      setResult(await api.getKey(root, scaleType));
    } catch {
      setError("Key not found.");
      setResult(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select value={root} onChange={e => setRoot(e.target.value)}
          className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          {NOTES.map(n => <option key={n}>{n}</option>)}
        </select>
        <select value={scaleType} onChange={e => setScaleType(e.target.value)}
          className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          <option value="major">major</option>
          <option value="minor">minor</option>
          <option value="harmonic-minor">harmonic minor</option>
          <option value="dorian">dorian</option>
        </select>
        <button onClick={lookup}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
          Look up
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <h2 className="text-lg font-semibold mb-3">{result.key}</h2>
          <div className="grid grid-cols-7 gap-1 text-center">
            {result.chords.map(chord => (
              <div key={chord.numeral} className="bg-zinc-800 rounded p-2">
                <div className="text-xs text-zinc-500">{chord.numeral}</div>
                <div className="text-sm font-mono font-medium">{chord.symbol}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IntervalLookup() {
  const [note1, setNote1] = useState("C");
  const [note2, setNote2] = useState("E");
  const [result, setResult] = useState<IntervalResult | null>(null);

  async function lookup() {
    try {
      setResult(await api.getInterval(note1, note2));
    } catch {
      setResult(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <select value={note1} onChange={e => setNote1(e.target.value)}
          className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          {NOTES.map(n => <option key={n}>{n}</option>)}
        </select>
        <span className="text-zinc-500">→</span>
        <select value={note2} onChange={e => setNote2(e.target.value)}
          className="bg-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 border border-zinc-700">
          {NOTES.map(n => <option key={n}>{n}</option>)}
        </select>
        <button onClick={lookup}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm transition-colors">
          Calculate
        </button>
      </div>

      {result && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <p className="text-xl font-bold">{result.name}</p>
          <p className="text-zinc-400 text-sm">{result.short_name} — {result.semitones} semitones — {result.quality}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
cd /Users/leo/hobby/tab/frontend && npm run build 2>&1 | tail -5
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/leo/hobby/tab
git add frontend/app/theory/
git commit -m "feat(frontend): add theory page with scale/chord/key/interval lookup and fretboard"
```

---

### Task 8: Queue Page

**Files:**
- Create: `frontend/app/queue/page.tsx`

The queue page lists files waiting in `queue/` in the repo, allows drag-and-drop upload, and lets the user trigger processing with an AI model dropdown. Shows job progress via polling.

- [ ] **Step 1: Implement queue page**

```tsx
// frontend/app/queue/page.tsx
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

  useEffect(() => { loadFiles(); }, [loadFiles]);

  // Poll job status every 3 seconds while job is running
  useEffect(() => {
    if (!activeJob || !activeJob.jobId) return;
    if (activeJob.status?.status === "completed" || activeJob.status?.status === "failed") return;

    pollRef.current = setTimeout(async () => {
      try {
        const status = await api.getJobStatus(activeJob.jobId);
        setActiveJob(prev => prev ? { ...prev, status } : null);
        if (status.status === "completed") {
          loadFiles(); // refresh queue
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
      setActiveJob({ filename, jobId: job_id, status: null });
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
            <p className="text-xs text-green-400">✓ Lessons generated successfully</p>
          )}
          {activeJob.status?.status === "failed" && (
            <p className="text-xs text-red-400">✗ {activeJob.status.error}</p>
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
```

- [ ] **Step 2: Build check**

```bash
cd /Users/leo/hobby/tab/frontend && npm run build 2>&1 | tail -5
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/leo/hobby/tab
git add frontend/app/queue/
git commit -m "feat(frontend): add queue page with GP file upload and background job polling"
```

---

### Task 9: Song Overview + Settings Pages

**Files:**
- Create: `frontend/app/songs/[artist]/[song]/page.tsx`
- Create: `frontend/app/settings/page.tsx`

- [ ] **Step 1: Implement song overview page**

```tsx
// frontend/app/songs/[artist]/[song]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface LessonEntry {
  number: number;
  filename: string;
}

function parseContext(raw: string): {
  currentLesson: number;
  totalLessons: number;
  tempo: string;
  stuckPoints: string;
} {
  return {
    currentLesson: parseInt(raw.match(/current_lesson:\s*(\d+)/)?.[1] ?? "1"),
    totalLessons: parseInt(raw.match(/total_lessons:\s*(\d+)/)?.[1] ?? "0"),
    tempo: raw.match(/tempo:\s*(.+)/)?.[1]?.trim() ?? "",
    stuckPoints: raw.match(/stuck_points?:\s*(.+)/)?.[1]?.trim() ?? "",
  };
}

export default function SongOverviewPage() {
  const { artist, song } = useParams<{ artist: string; song: string }>();
  const [context, setContext] = useState<ReturnType<typeof parseContext> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getContext(artist, song)
      .then(ctx => setContext(parseContext(ctx.content)))
      .catch(() => setError("Song not found or backend unavailable."))
      .finally(() => setLoading(false));
  }, [artist, song]);

  if (loading) return <div className="text-zinc-500 text-sm animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-400 text-sm">{error}</div>;

  const songName = song.replace(/-/g, " ");
  const artistName = artist.replace(/-/g, " ");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold capitalize">{songName}</h1>
        <p className="text-zinc-500 capitalize">{artistName}</p>
      </div>

      {context && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Current lesson</span>
            <span className="font-mono">{context.currentLesson} / {context.totalLessons}</span>
          </div>
          {context.tempo && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Tempo</span>
              <span className="font-mono">{context.tempo}</span>
            </div>
          )}
          {context.stuckPoints && (
            <div className="text-sm">
              <span className="text-zinc-400">Stuck on: </span>
              <span className="text-zinc-300">{context.stuckPoints}</span>
            </div>
          )}
        </div>
      )}

      <Link
        href={`/practice/${artist}/${song}`}
        className="block w-full py-4 bg-zinc-700 hover:bg-zinc-600 rounded-xl text-center font-medium transition-colors"
      >
        Practice → Lesson {context?.currentLesson ?? 1}
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Implement settings page**

```tsx
// frontend/app/settings/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const MODELS = ["claude-opus-4-6", "claude-sonnet-4-6", "gpt-4o", "gemini-pro"];

export default function SettingsPage() {
  const router = useRouter();
  const [defaultModel, setDefaultModel] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("defaultModel") ?? MODELS[0] : MODELS[0]
  );

  function saveModel(model: string) {
    setDefaultModel(model);
    localStorage.setItem("defaultModel", model);
  }

  async function logout() {
    // Clear cookie by calling backend logout (or just redirect; token expires in 24h)
    document.cookie = "token=; Max-Age=0; path=/";
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
        <div>
          <label className="text-sm text-zinc-400 block mb-2">Default AI Model</label>
          <select
            value={defaultModel}
            onChange={e => saveModel(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100"
          >
            {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <p className="text-xs text-zinc-600 mt-1">Used when processing GP files in the Queue</p>
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-1">Backend</label>
          <p className="text-xs text-zinc-600 font-mono">
            {process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"}
          </p>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm text-zinc-400 transition-colors"
      >
        Log out
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Build check**

```bash
cd /Users/leo/hobby/tab/frontend && npm run build 2>&1 | tail -5
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/leo/hobby/tab
git add frontend/app/songs/ frontend/app/settings/
git commit -m "feat(frontend): add song overview and settings pages"
```

---

### Task 10: Final Tests, Vercel Config, and Deployment Setup

**Files:**
- Create: `frontend/vercel.json`
- Create: `frontend/.env.local.example` (already done in Task 1, verify it's complete)

- [ ] **Step 1: Run full test suite**

```bash
cd /Users/leo/hobby/tab/frontend
npm test 2>&1 | tail -15
```
Expected: All tests pass — api.test, Fretboard, ProgressBar, SaveIndicator.

- [ ] **Step 2: Final production build**

```bash
npm run build 2>&1 | tail -10
```
Expected: Build completes with no TypeScript errors. Note any warnings but don't block on them.

- [ ] **Step 3: Create Vercel config**

```json
// frontend/vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_BACKEND_URL": "@backend_url"
  }
}
```

This tells Vercel to use the `backend_url` secret for the public backend URL. Set this in Vercel dashboard: Settings → Environment Variables → `NEXT_PUBLIC_BACKEND_URL` = your Railway URL.

- [ ] **Step 4: Verify .env.local.example is complete**

```bash
cat /Users/leo/hobby/tab/frontend/.env.local.example
```
Expected output:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

- [ ] **Step 5: Update root .gitignore to exclude frontend env files**

```bash
grep -q "frontend/.env.local" /Users/leo/hobby/tab/.gitignore || echo "frontend/.env.local" >> /Users/leo/hobby/tab/.gitignore
```

- [ ] **Step 6: Commit**

```bash
cd /Users/leo/hobby/tab
git add frontend/vercel.json .gitignore
git commit -m "feat(frontend): add Vercel deployment config"
```

---

## Summary

After all 10 tasks, the frontend provides:

| Page | Path | Description |
|------|------|-------------|
| Login | `/login` | Pin entry, sets httpOnly JWT cookie |
| Dashboard | `/` | All songs with progress bars and "resume" links |
| Practice | `/practice/{artist}/{song}` | Lesson walkthrough, checkboxes, auto-save |
| Theory | `/theory` | Scale/chord/key lookup + interactive fretboard SVG |
| Song Overview | `/songs/{artist}/{song}` | Progress summary, entry point to practice |
| Queue | `/queue` | GP file upload, process with AI model, poll progress |
| Settings | `/settings` | Model preference, backend info, logout |

**Deploy:** Push `frontend/` to Vercel. Set `NEXT_PUBLIC_BACKEND_URL` to your Railway backend URL. Set `ALLOWED_ORIGINS` on the Railway backend to your Vercel URL.

Next: **Plan 3 — AI Pipeline with Quality Gates** (`/ai/enhance` endpoint + lesson enrichment).
