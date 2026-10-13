// Decorative touches for the home page: a pair of ski tracks carved under the
// name and a snowcapped range above the footer. Both are inline SVG styled
// from CSS so they follow the light and dark tokens.

import { css } from "remix/ui";

import { MOTION_OK } from "./home-primitives.tsx";

// One long carving turn after another; the svg clips it to the width of
// whatever it sits under. The second track is the same line shifted down.
const TRACK_PATH =
  "M1 4 Q10 0 20 4 " + Array.from({ length: 19 }, (_, i) => `T${40 + i * 20} 4`).join(" ");

export function SkiTracks() {
  return () => (
    <svg
      viewBox="0 0 400 10"
      height="10"
      preserveAspectRatio="xMinYMid slice"
      aria-hidden="true"
      mix={css({
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        display: "block",
        width: "100%",
        height: "10px",
        overflow: "hidden",
        "& path": { stroke: "var(--hot)", strokeDasharray: "1", strokeDashoffset: "0" },
        [MOTION_OK]: {
          "& path": {
            strokeDashoffset: "1",
            animation: "dp-carve 900ms steps(24) 700ms forwards",
          },
        },
        "@keyframes dp-carve": { to: { strokeDashoffset: "0" } },
      })}
    >
      <path d={TRACK_PATH} pathLength="1" fill="none" strokeWidth="2" />
      <path d={TRACK_PATH} transform="translate(0 5)" pathLength="1" fill="none" strokeWidth="2" />
    </svg>
  );
}

// Two ranges with snowcaps, a sun in light mode and a moon for night skiing.
export function MountainDivider() {
  return () => (
    <svg
      viewBox="0 0 600 70"
      width="100%"
      height="70"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
      mix={css({
        display: "block",
        width: "100%",
        height: "70px",
        marginBottom: "1rem",
        "& .back": { fill: "var(--mtn-back)" },
        "& .front": { fill: "var(--mtn)" },
        "& .cap": { fill: "var(--snowcap)" },
        "& .sun": { fill: "var(--hot)", display: "var(--sun-display)" },
        "& .moon": { fill: "var(--snowcap)", display: "var(--moon-display)" },
      })}
    >
      <rect className="sun" x="492" y="6" width="14" height="14" />
      <path className="moon" d="M503 4 a10 10 0 1 0 0 20 a12 12 0 0 1 0 -20 z" />
      <polygon
        className="back"
        points="0,70 0,40 60,22 110,36 170,10 230,32 280,18 340,38 400,14 460,30 520,20 600,36 600,70"
      />
      <polygon className="cap" points="158,15 170,10 182,14 176,17 170,14 164,18" />
      <polygon className="cap" points="388,19 400,14 412,17 406,20 400,17 394,21" />
      <polygon
        className="front"
        points="0,70 0,52 70,38 130,50 200,30 260,46 320,34 380,50 450,28 520,44 600,40 600,70"
      />
      <polygon className="cap" points="190,33 200,30 210,33 205,35 200,33 195,36" />
      <polygon className="cap" points="440,31 450,28 460,30 455,33 450,31 445,34" />
    </svg>
  );
}
