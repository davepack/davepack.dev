// The desktop's icons, a client entry: the ski game, plus one for each window
// that has been minimized or closed. Like Windows 3.1, a mouse click selects
// an icon and a double-click opens it; a tap or the keyboard opens it
// straight away. On wide screens they sit at the bottom left of the screen,
// under the windows; on a phone they're a row at the top of the page.

import { clientEntry, css, on } from "remix/component";
import type { Handle } from "remix/component";

import { PIXEL_FONT } from "../home-primitives.tsx";
import { openWindow } from "./desktop-dom.ts";
import { desktop } from "./desktop-model.ts";

const COLORS: Record<string, string> = {
  r: "#d12b2b",
  s: "#f2c29b",
  k: "#141820",
  w: "#ffffff",
  B: "#2251c7",
  n: "#4a5160",
  y: "#f2b630",
  g: "#2f8f46",
  G: "#1d5e30",
  b: "#7a4a24",
};

// 16x16 pixel art, one letter per color.
const ART = {
  // The skier from the game, in profile, beside a little pine.
  ski: [
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
  ],
  // An ID card with a portrait.
  about: [
    "................",
    "................",
    ".kkkkkkkkkkkkkk.",
    ".kBBBBBBBBBBBBk.",
    ".kwwwwwwwwwwwwk.",
    ".kwrrrwwwwwwwwk.",
    ".kwssswwkkkkkwk.",
    ".kwssswwwwwwwwk.",
    ".kwBBBwwkkkkwwk.",
    ".kwBBBwwwwwwwwk.",
    ".kwwwwwwkkkwwwk.",
    ".kwwwwwwwwwwwwk.",
    ".kkkkkkkkkkkkkk.",
    "................",
    "................",
    "................",
  ],
  // A briefcase.
  work: [
    "................",
    "................",
    "......kkkk......",
    ".....k....k.....",
    ".kkkkkkkkkkkkkk.",
    ".kbbbbbbbbbbbbk.",
    ".kbbbbbbbbbbbbk.",
    ".kbbbbbyybbbbbk.",
    ".kkkkkkyykkkkkk.",
    ".kbbbbbbbbbbbbk.",
    ".kbbbbbbbbbbbbk.",
    ".kbbbbbbbbbbbbk.",
    ".kkkkkkkkkkkkkk.",
    "................",
    "................",
    "................",
  ],
  // A toolbox.
  skills: [
    "................",
    "................",
    "......kkkk......",
    ".....k....k.....",
    "..kkkkkkkkkkkk..",
    ".krrrrrrrrrrrrk.",
    ".krrrrrrrrrrrrk.",
    ".kkkkkkyykkkkkk.",
    ".krrrrryyrrrrrk.",
    ".krrrrrrrrrrrrk.",
    ".krrrrrrrrrrrrk.",
    ".kkkkkkkkkkkkkk.",
    "................",
    "................",
    "................",
    "................",
  ],
} as const;

export type IconArt = keyof typeof ART;

const pixelsFor = (art: IconArt) =>
  ART[art].flatMap((row, y) =>
    [...row].flatMap((color, x) => (color === "." ? [] : [{ x, y, fill: COLORS[color] }])),
  );

const iconsStyles = css({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-end",
  gap: "4px",
  margin: "0 0 -1rem",
  "@media (min-width: 700px)": {
    position: "fixed",
    left: "16px",
    bottom: "16px",
    // Under the windows, which stack above it on the page.
    zIndex: 0,
    maxWidth: "calc(100vw - 16rem)",
    margin: 0,
  },
});

const iconStyles = css({
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
  "& svg": { display: "block", width: "32px", height: "32px" },
  "& .label": {
    padding: "0 4px",
    fontFamily: PIXEL_FONT,
    fontSize: "0.8125rem",
    lineHeight: 1.3,
  },
  "&[data-selected] .label": { background: "var(--title)", color: "var(--title-ink)" },
  "&:focus-visible": { outline: "none" },
  "&:focus-visible .label": { outline: "1px dotted var(--ink)", outlineOffset: "1px" },
});

interface DesktopIconsProps {
  /** The page windows that can be minimized to an icon. */
  windows: { id: string; label: string; art: IconArt }[];
}

export const DesktopIcons = clientEntry(
  "/js/app.js#DesktopIcons",
  function DesktopIcons(handle: Handle<DesktopIconsProps>) {
    // Closed windows come from the shared model, which only exists in the
    // browser; the server (and the first browser render) shows the game.
    let closed: readonly string[] = [];
    let selected: string | null = null;

    handle.queueTask(() => {
      desktop.addEventListener(
        "change",
        () => {
          closed = desktop.closed;
          handle.update();
        },
        { signal: handle.signal },
      );
    });

    let select = (id: string | null) => {
      selected = id;
      handle.update();
    };

    let launchGame = () => {
      // public/ski.js owns the game; it listens for this.
      window.dispatchEvent(new Event("ski:play"));
    };

    return () => {
      let windows = handle.props.windows.filter((w) => closed.includes(w.id));
      windows.sort((a, b) => closed.indexOf(a.id) - closed.indexOf(b.id));
      return (
        <div mix={iconsStyles}>
          <DesktopIcon
            id="ski"
            label="Ski"
            art="ski"
            selected={selected === "ski"}
            onSelect={select}
            onOpen={launchGame}
          />
          {windows.map((w) => (
            <DesktopIcon
              key={w.id}
              id={w.id}
              label={w.label}
              art={w.art}
              selected={selected === w.id}
              onSelect={select}
              onOpen={() => openWindow(w.id)}
            />
          ))}
        </div>
      );
    };
  },
);

function DesktopIcon(
  handle: Handle<{
    id: string;
    label: string;
    art: IconArt;
    selected: boolean;
    onSelect: (id: string | null) => void;
    onOpen: () => void;
  }>,
) {
  let pointerType = "";

  return () => {
    let { id, label, art, selected, onSelect, onOpen } = handle.props;
    let open = () => {
      onSelect(null);
      onOpen();
    };
    return (
      <button
        type="button"
        data-icon={id}
        data-selected={selected ? "" : undefined}
        mix={[
          iconStyles,
          on("pointerdown", (event) => {
            pointerType = event.pointerType;
          }),
          on("click", (event) => {
            // detail is 0 for keyboard activation.
            if (event.detail === 0 || pointerType !== "mouse") open();
            else onSelect(id);
          }),
          on("dblclick", open),
          on("blur", () => {
            if (selected) onSelect(null);
          }),
        ]}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" shapeRendering="crispEdges">
          {pixelsFor(art).map(({ x, y, fill }) => (
            <rect key={`${x},${y}`} x={x} y={y} width="1" height="1" fill={fill} />
          ))}
        </svg>
        <span className="label">{label}</span>
      </button>
    );
  };
}
