// A desktop icon that launches the ski game, the first client entry on the
// site. Like a Windows 3.1 icon, a mouse click selects it and a double-click
// opens it; a tap or the keyboard opens it straight away.
//
// The server renders it like any other component; in the browser, the
// runtime started in entry.ts hydrates it with the same props.

import { clientEntry, css, on } from "remix/component";
import type { Handle } from "remix/component";

// The skier from the game, in profile, beside a little pine.
const ICON = [
  "................",
  "....rrr.........",
  "...rrrrr........",
  "....ssss....G...",
  "....sssk...GgG..",
  ".....ss...GgggG.",
  "....BBB....GgG..",
  "...BBBBB..GgggG.",
  "...BBBBBs.GgggG.",
  "...BBBB..GgggggG",
  "...nnnn.....b...",
  "....nn......b...",
  "....nn..........",
  "kyyyyyyyyyy.....",
  "................",
  "................",
];

const COLORS: Record<string, string> = {
  r: "#d12b2b",
  s: "#f2c29b",
  k: "#141820",
  B: "#2251c7",
  n: "#4a5160",
  y: "#f2b630",
  g: "#2f8f46",
  G: "#1d5e30",
  b: "#7a4a24",
};

const pixels = ICON.flatMap((row, y) =>
  [...row].flatMap((color, x) => (color === "." ? [] : [{ x, y, fill: COLORS[color] }])),
);

const iconStyles = css({
  position: "fixed",
  left: "16px",
  bottom: "16px",
  // Same layer as the page, but earlier in the document, so the windows
  // cover the icons like windows on a desktop.
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  width: "5rem",
  padding: "4px",
  border: 0,
  background: "none",
  font: "inherit",
  color: "var(--ink)",
  cursor: "pointer",
  "& svg": { display: "block", width: "32px", height: "32px", imageRendering: "pixelated" },
  "& .label": {
    padding: "0 4px",
    fontFamily: "'Pixelify Sans', ui-monospace, monospace",
    fontSize: "0.8125rem",
    lineHeight: 1.3,
  },
  "&[data-selected] .label": { background: "var(--title)", color: "var(--title-ink)" },
  "&:focus-visible": { outline: "none" },
  "&:focus-visible .label": { outline: "1px dotted var(--ink)", outlineOffset: "1px" },
});

export const GameIcon = clientEntry("/js/app.js#GameIcon", function GameIcon(handle: Handle) {
  let selected = false;
  let pointerType = "";

  function launch() {
    selected = false;
    handle.update();
    // public/ski.js owns the game; it listens for this.
    window.dispatchEvent(new Event("ski:play"));
  }

  return () => (
    <button
      type="button"
      data-selected={selected ? "" : undefined}
      mix={[
        iconStyles,
        on("pointerdown", (event) => {
          pointerType = event.pointerType;
        }),
        on("click", (event) => {
          // detail is 0 for keyboard activation.
          if (event.detail === 0 || pointerType !== "mouse") {
            launch();
            return;
          }
          selected = true;
          handle.update();
        }),
        on("dblclick", launch),
        on("blur", () => {
          selected = false;
          handle.update();
        }),
      ]}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
        {pixels.map(({ x, y, fill }) => (
          <rect key={`${x},${y}`} x={x} y={y} width="1" height="1" fill={fill} />
        ))}
      </svg>
      <span className="label">Ski</span>
    </button>
  );
});
