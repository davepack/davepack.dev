// Regenerates the site's raster images with headless Chrome:
//   public/og.png              link-preview image, from scripts/og-image/og.html
//   public/apple-touch-icon.png  180x180, from public/favicon.svg
//   public/favicon.ico           16 and 32 px, from public/favicon.svg
//
//   npm run images     (set CHROME to use a browser other than Google Chrome)

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const root = resolve(import.meta.dirname, "..");
const tmp = mkdtempSync(join(tmpdir(), "davepack-images-"));

function screenshot(url, width, height, out, { transparent = false } = {}) {
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--allow-file-access-from-files",
      `--window-size=${width},${height}`,
      "--virtual-time-budget=5000",
      ...(transparent ? ["--default-background-color=00000000"] : []),
      `--screenshot=${out}`,
      url,
    ],
    { stdio: "ignore" },
  );
}

// Renders the favicon at a size; `fill` paints the background square, since
// iOS rounds the corners of touch icons itself.
function icon(size, { fill = null } = {}) {
  const page = join(tmp, `icon-${size}.html`);
  writeFileSync(
    page,
    `<!doctype html><style>html,body{margin:0;background:${fill ?? "transparent"}}` +
      `img{display:block;width:${size}px;height:${size}px;image-rendering:pixelated}</style>` +
      `<img src="${pathToFileURL(join(root, "public/favicon.svg"))}">`,
  );
  const out = join(tmp, `icon-${size}.png`);
  screenshot(pathToFileURL(page).href, size, size, out, { transparent: !fill });
  return readFileSync(out);
}

// An ICO file holding PNG images (supported everywhere that reads .ico).
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

try {
  screenshot(
    pathToFileURL(join(root, "scripts/og-image/og.html")).href,
    1200,
    630,
    join(root, "public/og.png"),
  );
  writeFileSync(join(root, "public/apple-touch-icon.png"), icon(180, { fill: "#1d2f91" }));
  writeFileSync(
    join(root, "public/favicon.ico"),
    ico([16, 32].map((size) => ({ size, data: icon(size) }))),
  );
  console.log("Wrote public/og.png, public/apple-touch-icon.png, public/favicon.ico");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
