import { createController } from "remix/router";

import { routes } from "../routes.ts";
import { HomePage } from "./home-page.tsx";
import { themeFromRequest } from "./home-theme.tsx";

export default createController(routes, {
  actions: {
    home(context) {
      let response = context.render(<HomePage theme={themeFromRequest(context.request)} />);
      response.headers.append("Vary", "Cookie");
      return response;
    },
  },
});
