// Copies the alphaTab runtime (UMD build, music font, soundfont) into
// public/alphatab so it is served as static, cacheable files and never
// ends up in the Next.js JS bundle. Runs on postinstall/predev/prebuild.
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "@coderline", "alphatab", "dist");
const dest = join(root, "public", "alphatab");

if (!existsSync(src)) {
  console.warn("[copy-alphatab] @coderline/alphatab not installed, skipping");
  process.exit(0);
}

const files = [
  "alphaTab.min.js",
  "font/Bravura.woff2",
  "font/Bravura.woff",
  "font/Bravura.otf",
  "font/Bravura-OFL.txt",
  "soundfont/sonivox.sf3",
  "soundfont/LICENSE",
];

for (const f of files) {
  mkdirSync(dirname(join(dest, f)), { recursive: true });
  cpSync(join(src, f), join(dest, f));
}
console.log(`[copy-alphatab] copied ${files.length} files to public/alphatab`);
