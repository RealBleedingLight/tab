import { hashBytes, emptyProgress } from "../library";

describe("hashBytes", () => {
  it("is stable for identical bytes", () => {
    const a = new Uint8Array([1, 2, 3, 4, 5]);
    expect(hashBytes(a)).toBe(hashBytes(new Uint8Array([1, 2, 3, 4, 5])));
  });

  it("differs for different content, order and length", () => {
    const base = hashBytes(new Uint8Array([1, 2, 3]));
    expect(hashBytes(new Uint8Array([3, 2, 1]))).not.toBe(base);
    expect(hashBytes(new Uint8Array([1, 2, 3, 0]))).not.toBe(base);
  });

  it("produces URL-safe ids", () => {
    expect(hashBytes(new Uint8Array(1000).fill(7))).toMatch(/^[a-z0-9]{12,}$/);
  });
});

describe("emptyProgress", () => {
  it("keys progress by song and track", () => {
    expect(emptyProgress("abc", 2)).toMatchObject({ key: "abc:2", songId: "abc", trackIndex: 2, lessons: {}, totalSeconds: 0 });
  });
});
