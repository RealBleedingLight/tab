import type * as AT from "@coderline/alphatab";

/**
 * In-memory cache of parsed scores, so navigating from the upload screen to
 * the song page (client-side) doesn't parse the same file twice.
 */
const scores = new Map<string, AT.model.Score>();

export function cacheScore(id: string, score: AT.model.Score) {
  scores.clear(); // keep at most one — scores can be large
  scores.set(id, score);
}

export function getCachedScore(id: string): AT.model.Score | undefined {
  return scores.get(id);
}
