// Browser entry: starts the Remix component runtime, which hydrates the
// client entries the server rendered into the page.
//
// esbuild bundles this file and every client entry into public/js/app.js
// (`npm run build:client`, which Wrangler runs before dev and deploy).
// Client entry IDs all point at that one bundle, so loading a component is a
// lookup by export name rather than a dynamic import.

import { run } from "remix/component";

import { GameIcon } from "./game-icon.tsx";

const components: Record<string, unknown> = { GameIcon };

let app = run({
  async loadModule(moduleUrl, exportName) {
    let Component = components[exportName];
    if (typeof Component !== "function") {
      throw new Error(`Unknown component: ${moduleUrl}#${exportName}`);
    }
    return Component;
  },
});

app.addEventListener("error", (event) => {
  console.error("Component error:", event.error);
});

await app.ready();
