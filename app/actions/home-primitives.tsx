// Small pieces shared by the home page's route-owned modules.

import type { Handle, RemixNode } from "remix/ui";
import { css } from "remix/ui";

// Wrap every transition and animation in this so reduced-motion users get a
// static page.
export const MOTION_OK = "@media (prefers-reduced-motion: no-preference)";
export const DARK = "@media (prefers-color-scheme: dark)";

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
        borderRadius: "3px",
        "&:hover, &:focus-visible": { backgroundSize: "100% 45%" },
        [MOTION_OK]: { transition: "background-size 200ms ease" },
      })}
    >
      {handle.props.children}
    </a>
  );
}

// Quiet pill for skill names and small labels.
export function Chip(handle: Handle<{ children: RemixNode }>) {
  return () => (
    <span
      mix={css({
        display: "inline-block",
        padding: "0.05rem 0.6rem",
        border: "1px solid var(--rule)",
        borderRadius: "999px",
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

// Small-caps section label used by the Work and Skills sections.
export function SectionHeading(handle: Handle<{ id: string; children: RemixNode }>) {
  return () => (
    <h2
      id={handle.props.id}
      mix={css({
        margin: "0 0 1rem",
        fontSize: "0.8125rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--muted)",
      })}
    >
      {handle.props.children}
    </h2>
  );
}

// Rules shared by every <details> on the page: hide the native marker and draw
// a small chevron that turns when the disclosure opens.
export const chevronRules = {
  "& > summary::-webkit-details-marker": { display: "none" },
  "& > summary::before": {
    content: '""',
    flex: "none",
    alignSelf: "center",
    width: "0.45em",
    height: "0.45em",
    marginRight: "0.35rem",
    borderRight: "1.5px solid var(--accent)",
    borderBottom: "1.5px solid var(--accent)",
    rotate: "-45deg",
    translate: "0 -0.1em",
  },
  "&[open] > summary::before": { rotate: "45deg", translate: "0 -0.2em" },
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
