// Sends interaction events to the /events route (app/actions/events.ts) with
// navigator.sendBeacon: no cookies, no identifiers, nothing that waits on the
// response. Visitors who send Global Privacy Control or Do Not Track are
// never counted.
//
// The Remix client entries call track() directly. The plain scripts in
// public/ (ski.js, skills.js, theme.js) dispatch a "dp:track" event on
// window with the same fields, so they don't depend on this bundle.

import type { EventName } from "../events.ts";

export interface TrackFields {
  label?: string;
  from?: string;
  value?: number;
}

const optedOut = () =>
  (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true ||
  navigator.doNotTrack === "1";

export function track(name: EventName, fields: TrackFields = {}) {
  if (optedOut() || !navigator.sendBeacon) return;
  let body = JSON.stringify({ name, ...fields, wide: innerWidth >= 700 });
  navigator.sendBeacon("/events", new Blob([body], { type: "application/json" }));
}

/** Page views, outbound links, and events from the plain scripts. */
export function startAnalytics(signal?: AbortSignal) {
  let referrer = "direct";
  try {
    let host = new URL(document.referrer).host;
    if (host && host !== location.host) referrer = host;
  } catch {
    // No referrer.
  }
  track("view", { label: referrer.replace(/^www\./, "") });

  addEventListener(
    "dp:track",
    (event) => {
      let { name, ...fields } = (event as CustomEvent).detail ?? {};
      if (typeof name === "string") track(name as EventName, fields);
    },
    { signal },
  );

  // Outbound links, counted by host only.
  document.addEventListener(
    "click",
    (event) => {
      let link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || link.host === location.host) return;
      track("link", { label: link.host.replace(/^www\./, "") });
    },
    { signal },
  );
}
