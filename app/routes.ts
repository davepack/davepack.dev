import { post, route } from "remix/routes";

export const routes = route({
  home: "/",
  events: post("/events"),
});
