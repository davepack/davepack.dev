// The slope behind the page. The server renders an empty canvas, the game
// HUD, and the controls (hidden until the script is running); public/ski.js
// does the rest. Without JavaScript the page is simply snow-colored.

import { css } from "remix/component";

import { PIXEL_FONT, bevelRules, windowRules } from "./home-primitives.tsx";

// Applied to the page root. The script sets data-mode="play" on it to bring
// the slope to the front.
export const skiRootRules = {
  "& .page": { position: "relative", zIndex: 1 },
  "&[data-mode=play] .page": { visibility: "hidden" },
} as const;

const SCRIPT_VERSION = "8";

export function SkiSlope() {
  return () => (
    <>
      <canvas
        id="ski-canvas"
        aria-hidden="true"
        aria-label="Ski game"
        mix={css({
          position: "fixed",
          inset: 0,
          zIndex: 0,
          display: "block",
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          "[data-mode=play] > &": { zIndex: 5, touchAction: "none", cursor: "crosshair" },
          "&:focus": { outline: "none" },
        })}
      />
      <div
        id="ski-hud"
        role="status"
        hidden
        mix={css({
          ...windowRules,
          "--pad": "0.75rem",
          position: "fixed",
          top: "16px",
          left: "16px",
          zIndex: 10,
          width: "min(19rem, calc(100vw - 32px))",
          padding: "0.6rem 0.75rem",
          fontFamily: PIXEL_FONT,
          fontSize: "0.9375rem",
          lineHeight: 1.35,
          "&[hidden]": { display: "none" },
          "& dl": {
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "0.1rem 0.75rem",
            margin: 0,
          },
          "& dt": { color: "var(--muted)" },
          "& dd": { margin: 0, textAlign: "right", fontVariantNumeric: "tabular-nums" },
          // Two stats to a row on a phone, so the window covers less slope.
          "@media (max-width: 600px)": {
            "& dl": { gridTemplateColumns: "auto 1fr auto 1fr" },
          },
          "& p": {
            margin: "0.5rem 0 0",
            paddingTop: "0.5rem",
            borderTop: "2px solid var(--rule)",
          },
          "& p:empty": { display: "none" },
        })}
      >
        <dl>
          <dt>Time</dt>
          <dd data-stat="time">0:00</dd>
          <dt>Distance</dt>
          <dd data-stat="distance">0 m</dd>
          <dt>Speed</dt>
          <dd data-stat="speed">0 km/h</dd>
          <dt>Best</dt>
          <dd data-stat="best">0 m</dd>
        </dl>
        <p data-stat="message" />
      </div>
      <div
        id="ski-controls"
        hidden
        mix={css({
          position: "fixed",
          right: "16px",
          bottom: "16px",
          zIndex: 10,
          display: "flex",
          gap: "8px",
          "&[hidden]": { display: "none" },
          "& button": {
            ...bevelRules.raised,
            padding: "0.4rem 0.85rem",
            color: "var(--ink-on-chrome)",
            fontFamily: PIXEL_FONT,
            fontSize: "0.9375rem",
            lineHeight: 1.2,
            cursor: "pointer",
            boxShadow: `${bevelRules.raised.boxShadow}, 3px 3px 0 var(--frame)`,
          },
          "& button:hover": { background: "var(--chrome-hover)" },
          "& button:active, & button[aria-pressed=true]": {
            boxShadow: `${bevelRules.pressed.boxShadow}, 1px 1px 0 var(--frame)`,
            translate: "2px 2px",
          },
          "& :focus-visible": { outline: "2px solid var(--accent)", outlineOffset: "2px" },
        })}
      >
        <button id="ski-pause" type="button" aria-pressed="false">
          Pause
        </button>
        <button id="ski-play" type="button">
          Play game
        </button>
      </div>
      <script type="module" src={`/ski.js?v=${SCRIPT_VERSION}`} />
    </>
  );
}
