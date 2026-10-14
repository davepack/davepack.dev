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

// Shared look for every title bar: the page windows' (WindowTitleBar, a
// client entry) and the skill card windows' (TitleBar below).
export const titleBarStyles = css({
  display: "flex",
  alignItems: "stretch",
  height: "1.875rem",
  // --bleed lets a maximized window pad its content more than usual
  // while the bar still runs edge to edge.
  margin: "0 calc(var(--bleed, var(--pad)) * -1) var(--pad)",
  background: "var(--title)",
  color: "var(--title-ink)",
  borderBottom: "2px solid var(--frame)",
  "& .box": {
    position: "relative",
    flex: "none",
    width: "1.875rem",
    margin: 0,
    padding: 0,
    border: 0,
    font: "inherit",
    background: "var(--chrome)",
    boxShadow: "inset -2px -2px 0 var(--bevel-dark), inset 2px 2px 0 var(--bevel-light)",
    display: "grid",
    placeItems: "center",
  },
  "& button.box, & label.box": { cursor: "pointer" },
  "& button.box:hover, & label.box:hover": { background: "var(--chrome-hover)" },
  "& button.box:active, & label.box:active": {
    boxShadow: "inset 2px 2px 0 var(--bevel-dark), inset -2px -2px 0 var(--bevel-light)",
  },
  "& button.box:focus-visible, & label.box:has(:focus-visible)": {
    outline: "2px solid var(--accent)",
    outlineOffset: "-4px",
  },
  "& .box input": {
    position: "absolute",
    inset: 0,
    margin: 0,
    opacity: 0,
    cursor: "inherit",
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
  // A maximized window shows the stacked restore arrows.
  "& .box:has(:checked)": { alignContent: "center", rowGap: "2px" },
  "& .box:has(:checked)::before, & .box:has(:checked)::after": {
    content: '""',
    borderLeft: "0.25rem solid transparent",
    borderRight: "0.25rem solid transparent",
  },
  "& .box:has(:checked)::before": {
    borderTop: 0,
    borderBottom: "0.25rem solid var(--ink-on-chrome)",
  },
  "& .box:has(:checked)::after": {
    borderBottom: 0,
    borderTop: "0.25rem solid var(--ink-on-chrome)",
  },
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
  // Windows 3.1 drew the title bars of inactive windows plain.
  "[data-inactive] &": { background: "var(--card)", color: "var(--ink)" },
  // Keyboard move mode (the control menu's Move).
  "&[data-moving]": { outline: "2px dashed var(--accent)", outlineOffset: "2px" },
});

// The title bar of a skill card window: a control box and minimize button
// that both close the window (back into its card), plus a maximize toggle.
// The close buttons submit the dialog's method="dialog" form and maximize is
// a checkbox, so they all work without JavaScript.
export function TitleBar(
  handle: Handle<{
    label: string;
    id: string;
    formId: string;
    autofocus?: boolean;
    children: RemixNode;
  }>,
) {
  return () => {
    let { label, id, formId, autofocus, children } = handle.props;
    return (
      <div className="titlebar" mix={titleBarStyles}>
        <button
          type="submit"
          form={formId}
          className="box menu"
          data-close
          aria-label={`Close ${label}`}
        />
        <h2 id={id} autofocus={autofocus} tabIndex={autofocus ? -1 : undefined}>
          {children}
        </h2>
        <button
          type="submit"
          form={formId}
          className="box min"
          data-close
          aria-label={`Minimize ${label}`}
        />
        <label className="box max">
          <input type="checkbox" className="tb-maximize" aria-label={`Maximize ${label}`} />
        </label>
      </div>
    );
  };
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
