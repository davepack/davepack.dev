// Small pieces shared by the home page's route-owned modules.

import type { Handle, RemixNode } from "remix/component";
import { css } from "remix/component";

// Wrap every transition and animation in this so reduced-motion users get a
// static page.
export const MOTION_OK = "@media (prefers-reduced-motion: no-preference)";

// Chunky pixel face for the name, title bars, buttons, and the game HUD.
// Body copy stays in the system stack so it reads easily.
export const PIXEL_FONT = "'Pixelify Sans', ui-monospace, 'SFMono-Regular', Menlo, monospace";

// A retro desktop window: hard outline, offset shadow, and just enough
// translucency to hint at the slope without hurting the text.
export const windowRules = {
  "--pad": "1.5rem",
  position: "relative",
  background: "color-mix(in srgb, var(--card) 97%, transparent)",
  border: "2px solid var(--frame)",
  boxShadow: "5px 5px 0 var(--frame)",
  padding: "0 var(--pad) var(--pad)",
  "@media (max-width: 600px)": { "--pad": "1rem", boxShadow: "4px 4px 0 var(--frame)" },
} as const;

// Raised and pressed bevels for buttons drawn in the same style.
export const bevelRules = {
  raised: {
    background: "var(--chrome)",
    border: "2px solid var(--frame)",
    boxShadow: "inset -2px -2px 0 var(--bevel-dark), inset 2px 2px 0 var(--bevel-light)",
  },
  pressed: {
    boxShadow: "inset 2px 2px 0 var(--bevel-dark), inset -2px -2px 0 var(--bevel-light)",
  },
} as const;

// Accent text with a thin underline that sweeps up into a marker highlight on
// hover or focus.
export function TextLink(handle: Handle<{ href: string; children: RemixNode }>) {
  return () => (
    <a
      href={handle.props.href}
      mix={css({
        color: "var(--accent)",
        textDecoration: "none",
        backgroundImage: "linear-gradient(var(--accent-soft), var(--accent-soft))",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 2px",
        backgroundPosition: "0 100%",
        padding: "0 0.1em",
        margin: "0 -0.1em",
        "&:hover, &:focus-visible": { backgroundSize: "100% 45%" },
        [MOTION_OK]: { transition: "background-size 200ms ease" },
      })}
    >
      {handle.props.children}
    </a>
  );
}

// Quiet square tag for skill names and small labels.
export function Chip(handle: Handle<{ children: RemixNode }>) {
  return () => (
    <span
      mix={css({
        display: "inline-block",
        padding: "0 0.5rem",
        border: "2px solid var(--rule)",
        fontSize: "0.8125rem",
        lineHeight: 1.6,
        color: "var(--muted)",
        whiteSpace: "nowrap",
      })}
    >
      {handle.props.children}
    </span>
  );
}

// The title bar across the top of a window: a control box on the left, the
// title in the middle, and minimize/maximize boxes on the right. Without a
// title it is purely decorative.
export function TitleBar(
  handle: Handle<{ id?: string; autofocus?: boolean; children?: RemixNode }>,
) {
  return () => {
    let { id, autofocus, children } = handle.props;
    return (
      <div
        aria-hidden={children ? undefined : "true"}
        mix={css({
          display: "flex",
          alignItems: "stretch",
          height: "1.875rem",
          margin: "0 calc(var(--pad) * -1) var(--pad)",
          background: "var(--title)",
          color: "var(--title-ink)",
          borderBottom: "2px solid var(--frame)",
          "& .box": {
            flex: "none",
            width: "1.875rem",
            background: "var(--chrome)",
            boxShadow: "inset -2px -2px 0 var(--bevel-dark), inset 2px 2px 0 var(--bevel-light)",
            display: "grid",
            placeItems: "center",
          },
          "& .menu": { borderRight: "2px solid var(--frame)" },
          "& .menu::before": {
            content: '""',
            width: "0.75rem",
            height: "0.1875rem",
            background: "var(--ink-on-chrome)",
            boxShadow: "1px 1px 0 var(--bevel-light)",
          },
          "& .min, & .max": { borderLeft: "2px solid var(--frame)" },
          "& .min::before, & .max::before": {
            content: '""',
            borderLeft: "0.3rem solid transparent",
            borderRight: "0.3rem solid transparent",
          },
          "& .min::before": { borderTop: "0.3rem solid var(--ink-on-chrome)" },
          "& .max::before": { borderBottom: "0.3rem solid var(--ink-on-chrome)" },
          "& h2": {
            flex: 1,
            margin: 0,
            alignSelf: "center",
            textAlign: "center",
            fontFamily: PIXEL_FONT,
            fontSize: "0.9375rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            lineHeight: 1,
          },
          "& h2:focus": { outline: "none" },
          "& .spacer": { flex: 1 },
        })}
      >
        <span className="box menu" aria-hidden="true" />
        {children ? (
          <h2 id={id} autofocus={autofocus} tabIndex={autofocus ? -1 : undefined}>
            {children}
          </h2>
        ) : (
          <span className="spacer" />
        )}
        <span className="box min" aria-hidden="true" />
        <span className="box max" aria-hidden="true" />
      </div>
    );
  };
}

// Section label used by the Work and Skills windows.
export function SectionHeading(handle: Handle<{ id: string; children: RemixNode }>) {
  return () => <TitleBar id={handle.props.id}>{handle.props.children}</TitleBar>;
}

// Rules shared by every <details> on the page: hide the native marker and draw
// a small pixel arrow that turns when the disclosure opens.
export const chevronRules = {
  "& > summary::-webkit-details-marker": { display: "none" },
  "& > summary::before": {
    content: '""',
    flex: "none",
    alignSelf: "center",
    width: 0,
    height: 0,
    marginRight: "0.4rem",
    borderTop: "0.3rem solid transparent",
    borderBottom: "0.3rem solid transparent",
    borderLeft: "0.4rem solid var(--hot)",
  },
  "&[open] > summary::before": { rotate: "90deg" },
} as const;

// Progressive open/close height animation for <details>. Browsers without
// ::details-content or interpolate-size ignore it and simply snap open.
export const detailsHeightRules = {
  "&::details-content": {
    blockSize: 0,
    overflow: "clip",
    transition: "block-size 260ms ease, content-visibility 260ms allow-discrete",
  },
  "&[open]::details-content": { blockSize: "auto" },
} as const;
