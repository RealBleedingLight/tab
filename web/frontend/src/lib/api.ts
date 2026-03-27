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
      request<import("./types").SongSummary[]>("/songs"),
    get: (id: string) =>
      request<import("./types").SongDetail>(`/songs/${id}`),
    delete: (id: string) =>
      request<void>(`/songs/${id}`, { method: "DELETE" }),
    toggleComplete: (songId: string, sectionId: string) =>
      request<import("./types").SongDetail>(
        `/songs/${songId}/sections/${sectionId}/complete`,
        { method: "POST" }
      ),
    upload: (file: File) => {
      const form = new FormData()
      form.append("file", file)
      return request<import("./types").SongSummary>("/upload", { method: "POST", body: form })
    },
  },
  theory: {
    scales: () =>
      request<import("./types").ScaleListItem[]>("/theory/scales"),
    scale: (root: string, type: string) =>
      request<import("./types").ScaleResponse>(`/theory/scale/${root}/${type}`),
    chords: () =>
      request<import("./types").ChordTypeItem[]>("/theory/chords"),
    chord: (name: string) =>
      request<import("./types").ChordResponse>(`/theory/chord/${name}`),
    key: (root: string, type: string) =>
      request<import("./types").KeyResponse>(`/theory/key/${root}/${type}`),
  },
}
