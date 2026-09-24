# Davepack.dev Agent Guide

This app was scaffolded with `remix new`. Use these conventions when continuing to build it out.

## Commands

```sh
npm i
npm run dev        # wrangler dev at http://localhost:8787
npm run deploy
npm run typecheck
npm run lint
npm run fmt
```

The app is server-rendered only and runs on Cloudflare Workers. There is no client entry, no asset server, and no test suite yet.

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
- Root `public/` contains static files served unchanged from the app root by Cloudflare Workers assets

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
