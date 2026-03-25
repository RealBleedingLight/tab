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
