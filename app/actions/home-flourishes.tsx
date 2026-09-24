// Decorative touches for the home page: the hand-drawn underline under the
// name and the Front Range ridge line above the footer. Both are inline SVG
// styled from CSS so they follow the light and dark tokens.

import { css } from "remix/ui";

import { DARK, MOTION_OK } from "./home-primitives.tsx";

// A long wave; the svg clips it to the width of whatever it sits under.
const SQUIGGLE_PATH =
  "M1 5 Q10 1 20 5 " + Array.from({ length: 19 }, (_, i) => `T${40 + i * 20} 5`).join(" ");

export function Squiggle() {
  return () => (
    <svg
      viewBox="0 0 400 8"
      height="8"
      preserveAspectRatio="xMinYMid slice"
      aria-hidden="true"
      mix={css({
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        display: "block",
        width: "100%",
        height: "8px",
        overflow: "hidden",
        "& path": { stroke: "var(--accent)", strokeDasharray: "1", strokeDashoffset: "0" },
        [MOTION_OK]: {
          "& path": {
            strokeDashoffset: "1",
            animation: "dp-draw 700ms ease-out 700ms forwards",
          },
        },
        "@keyframes dp-draw": { to: { strokeDashoffset: "0" } },
      })}
    >
      <path d={SQUIGGLE_PATH} pathLength="1" fill="none" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Two ridge lines with a sun in light mode and a crescent moon in dark mode.
export function RidgeDivider() {
  return () => (
    <svg
      viewBox="0 0 600 60"
      width="100%"
      height="60"
      preserveAspectRatio="none"
      aria-hidden="true"
      mix={css({
        display: "block",
        width: "100%",
        height: "60px",
        marginBottom: "1rem",
        "& .ridge": { fill: "var(--rule)" },
        "& .ridge-back": { opacity: 0.55 },
        "& .sun, & .moon": { fill: "var(--accent)" },
        "& .moon": { display: "none" },
        [DARK]: {
          "& .sun": { display: "none" },
          "& .moon": { display: "block" },
        },
      })}
    >
      <circle className="sun" cx="500" cy="20" r="8" />
      <path className="moon" d="M503 10 a10 10 0 1 0 0 20 a12 12 0 0 1 0 -20 z" />
      <polyline
        className="ridge ridge-back"
        points="0,60 0,34 40,26 90,38 140,18 190,32 240,22 290,40 340,24 390,34 440,20 490,36 540,28 600,38 600,60"
      />
      <polyline
        className="ridge"
        points="0,60 0,46 50,40 100,50 150,38 200,48 250,42 300,52 350,44 400,50 450,40 500,48 550,44 600,50 600,60"
      />
    </svg>
  );
}
