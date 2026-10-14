// Bundles the browser code (app/actions/public/entry.ts and the client
// entries it registers) into public/js/app.js. Wrangler runs this before dev
// and deploy (build.command in wrangler.jsonc), and `npm run build:client`
// runs it by hand. It calls esbuild directly rather than through a package
// manager, so it behaves the same under npm and pnpm.

import { build } from "esbuild";

await build({
  entryPoints: ["app/actions/public/entry.ts"],
  bundle: true,
  format: "esm",
  target: "es2022",
  minify: true,
  sourcemap: true,
  outfile: "public/js/app.js",
  logLevel: "info",
});
