import type {
  SongSummary,
  SongDetail,
  ScaleListItem,
  ScaleResponse,
  ChordTypeItem,
  ChordResponse,
  KeyResponse,
} from "./types"

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  songs: {
    list: () =>
      request<SongSummary[]>("/songs"),
    get: (id: string) =>
      request<SongDetail>(`/songs/${id}`),
    delete: (id: string) =>
      request<void>(`/songs/${id}`, { method: "DELETE" }),
    toggleComplete: (songId: string, sectionId: string) =>
      request<SongDetail>(
        `/songs/${songId}/sections/${sectionId}/complete`,
        { method: "POST" }
      ),
    upload: (file: File) => {
      const form = new FormData()
      form.append("file", file)
      return request<SongSummary>("/upload", { method: "POST", body: form })
    },
  },
  theory: {
    scales: () =>
      request<ScaleListItem[]>("/theory/scales"),
    scale: (root: string, type: string) =>
      request<ScaleResponse>(`/theory/scale/${root}/${type}`),
    chords: () =>
      request<ChordTypeItem[]>("/theory/chords"),
    chord: (name: string) =>
      request<ChordResponse>(`/theory/chord/${name}`),
    key: (root: string, type: string) =>
      request<KeyResponse>(`/theory/key/${root}/${type}`),
  },
}
