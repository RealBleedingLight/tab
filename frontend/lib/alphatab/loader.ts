import type * as AlphaTab from "@coderline/alphatab";

export type AlphaTabModule = typeof AlphaTab;

/** Base path of the static alphaTab runtime (see scripts/copy-alphatab.mjs). */
export const ALPHATAB_BASE = "/alphatab/";
export const ALPHATAB_SCRIPT = `${ALPHATAB_BASE}alphaTab.min.js`;
export const ALPHATAB_FONT_DIR = `${ALPHATAB_BASE}font/`;
export const ALPHATAB_SOUNDFONT = `${ALPHATAB_BASE}soundfont/sonivox.sf3`;

declare global {
  interface Window {
    alphaTab?: AlphaTabModule;
  }
}

let loading: Promise<AlphaTabModule> | null = null;

/**
 * Loads the alphaTab UMD build from /public on demand.
 *
 * Loading it as a plain script (instead of bundling the ESM build) keeps
 * ~1 MB out of the app bundle, lets the browser cache it independently,
 * and lets alphaTab spawn its render/audio workers from its own script URL
 * without any bundler plugin.
 */
export function loadAlphaTab(): Promise<AlphaTabModule> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("alphaTab can only be loaded in the browser"));
  }
  if (window.alphaTab) return Promise.resolve(window.alphaTab);
  if (loading) return loading;

  loading = new Promise<AlphaTabModule>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = ALPHATAB_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (window.alphaTab) resolve(window.alphaTab);
      else reject(new Error("alphaTab script loaded but global is missing"));
    };
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Could not load the tab engine. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/** Warm the cache (e.g. on hover of an upload button) without awaiting. */
export function preloadAlphaTab(): void {
  loadAlphaTab().catch(() => { /* surfaced later on real use */ });
}

/** Parses Guitar Pro / MusicXML / alphaTex bytes into an alphaTab Score. */
export async function parseScoreBytes(data: Uint8Array): Promise<AlphaTab.model.Score> {
  const at = await loadAlphaTab();
  const settings = new at.Settings();
  settings.core.logLevel = at.LogLevel.Error;
  return at.importer.ScoreLoader.loadScoreFromBytes(data, settings);
}
