// A local stats dashboard for davepack.dev: a small Remix app on Node that
// reads Workers Analytics Engine with the token in .env.events (never sent to
// the browser) and renders one server-side page.
//
//   npm run dashboard            then open http://localhost:4400
//
// Runs TSX directly via remix/node-tsx; there's no build step.

import * as http from "node:http";

import { createRequestListener } from "remix/node-fetch-server";
import { createController, createRouter, type MiddlewareContext } from "remix/router";
import { route } from "remix/routes";

import { render } from "../../app/middleware/render.tsx";
import { RANGES, credentialsFromEnv, loadReport } from "./analytics.ts";
import { DashboardPage } from "./dashboard-page.tsx";

const PORT = Number(process.env.PORT ?? 4400);
const credentials = credentialsFromEnv(process.env);

const routes = route({ dashboard: "/" });

type Context = MiddlewareContext<[ReturnType<typeof render>]>;

const controller = createController<typeof routes, Context>(routes, {
  actions: {
    async dashboard(context) {
      let params = context.url.searchParams;
      let asked = Number(params.get("days"));
      let days = (RANGES as readonly number[]).includes(asked) ? asked : 30;
      let refresh = params.get("refresh") === "1";
      if (!credentials) {
        return context.render(
          <DashboardPage
            report={null}
            refresh={false}
            error="Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env.events, then restart."
          />,
        );
      }
      try {
        let report = await loadReport(credentials, days, context.request.signal);
        return context.render(<DashboardPage report={report} refresh={refresh} />);
      } catch (error) {
        console.error(error);
        let message = error instanceof Error ? error.message : String(error);
        return context.render(<DashboardPage report={null} refresh={refresh} error={message} />, {
          status: 502,
        });
      }
    },
  },
});

const router = createRouter<Context>({ middleware: [render()] });
router.map(routes, controller);

// Localhost only: the dashboard is for you, not your network.
http.createServer(createRequestListener(router.fetch)).listen(PORT, "127.0.0.1", () => {
  console.log(`davepack.dev stats: http://localhost:${PORT}`);
  if (!credentials)
    console.log("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env.events.");
});
