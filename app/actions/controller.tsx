import { env } from "cloudflare:workers";
import { createController } from "remix/router";

import { routes } from "../routes.ts";
import { MAX_BODY, parseEvent, writeEvent } from "./events.ts";
import { HomePage } from "./home-page.tsx";
import { themeFromRequest } from "./home-theme.tsx";

export default createController(routes, {
  actions: {
    home(context) {
      let response = context.render(<HomePage theme={themeFromRequest(context.request)} />);
      response.headers.append("Vary", "Cookie");
      return response;
    },

    // Beacons from the page's own scripts (app/actions/public/analytics.ts).
    // Always answers 204 so the response says nothing about what was kept.
    async events(context) {
      let { request } = context;
      let done = new Response(null, { status: 204 });
      if (request.headers.get("Sec-Fetch-Site") === "cross-site") return done;
      if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY) return done;
      let event = parseEvent(await request.text());
      if (!event || !env.EVENTS) return done;
      let cf = (request as Request & { cf?: { country?: string } }).cf;
      writeEvent(env.EVENTS, event, cf?.country ?? "");
      return done;
    },
  },
});
