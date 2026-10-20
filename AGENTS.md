# Davepack.dev Agent Guide

This app was scaffolded with `remix new`. Use these conventions when continuing to build it out.

## Commands

```sh
npm i
npm run dev        # wrangler dev at http://localhost:8787 (builds the client bundle first)
npm run deploy     # also builds the client bundle first
npm run build:client
npm test           # node --test over app/**/*.test.ts
npm run images     # regenerate public/og.png, apple-touch-icon.png, favicon.ico (headless Chrome)
npm run events     # summarize interaction events; reads .env.events (never .env, which Wrangler would use for deploys)
npm run dashboard  # local stats dashboard at http://localhost:4400 (same credentials)
npm run typecheck
npm run lint
npm run fmt
```

The app runs on Cloudflare Workers and is server-rendered, with a few Remix client entries hydrated in the browser. There is no asset server: `scripts/build-client.mjs` uses esbuild to bundle `app/actions/public/entry.ts` and the client entries it registers into `public/js/app.js` (git-ignored), and Wrangler's `build.command` runs that before dev and deploy. Client entry IDs point at that bundle (`/js/app.js#ExportName`). Never import resume data into browser code; it would ship in the public bundle.

## Building Features

Refer to ./.agents/skills/remix/SKILL.md for the Remix mental model and how to find guides and API READMEs through `node_modules/remix/INDEX.md`.

## Starter Layout

- `app/actions/controller.tsx` owns the top-level route actions
- `app/actions/home-page.tsx` and `app/actions/document.tsx` render the route-owned starter UI
- `app/routes.ts` defines the shared route contract used for type-safe hrefs
- `app/router.ts` wires routes to route handlers
- `app/middleware/render.tsx` installs the request-scoped renderer used by actions
- `app/data/resume.ts` is the only module that reads `data/davepack-resume.json`. It never exposes `profile` and drops any entry marked `verify: true`, so clear that flag in the JSON to publish an entry
- `app/actions/home-*.tsx` are the home route's sections (work timeline, skill stickers, flourishes, shared primitives)
- `app/actions/events.ts` validates the interaction events the page beacons to `POST /events` and writes them to Workers Analytics Engine (binding `EVENTS`, dataset `davepack_events`); `app/actions/public/analytics.ts` sends them. No cookies or identifiers, and visitors with Global Privacy Control or Do Not Track are skipped. The plain scripts report through a `dp:track` window event
- `tools/dashboard/` is a separate, local-only Remix app on Node (run through `remix/node-tsx`, no build): `analytics.ts` queries Analytics Engine (shared with `scripts/events.ts`), `dashboard-page.tsx` renders the page with the site's styles, `server.tsx` serves it on 127.0.0.1. It never deploys with the site
- `app/actions/public/` is browser code: `entry.ts` (starts the runtime with `run()`), the desktop model, and the client entries (window title bars, desktop icons)
- `app/actions/home-seo.tsx` holds the page title, description, Open Graph and Twitter/X cards, and schema.org Person data. The preview image is designed in `scripts/og-image/og.html` and the icons come from `public/favicon.svg`; rerun `npm run images` after changing either
- Root `public/` contains static files served unchanged from the app root by Cloudflare Workers assets, including the plain scripts `ski.js`, `skills.js`, and `theme.js`

## Route Ownership

- Start from `app/routes.ts` and map each route to the narrowest owner on disk.
- Put top-level route actions in `app/actions/controller.tsx`.
- Add `app/actions/<route-key>/controller.tsx` for nested route maps that need their own actions or middleware.
- Keep route-owned page modules next to the route that owns them.
- Move shared UI to `app/ui/`, not `app/actions/`.

## Build-Out Notes

- This starter intentionally begins small; add directories like `app/data/` and `test/` only when you need them.
- Prefer putting code in the narrowest owner before introducing shared modules.
- Avoid generic dumping-ground directories like `app/lib/` or `app/components/`.
