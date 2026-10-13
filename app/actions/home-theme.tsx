// Theme switcher: Light and Dark radio buttons styled as retro push buttons.
// Until the visitor picks one, neither is checked and the page follows the
// device, with the matching button drawn pressed. The checked radio is the
// single source of truth: the page's tokens key off it with :has(), so
// switching works without JavaScript; public/theme.js saves the choice in a
// cookie, and the server reads that cookie to check the right radio on the
// next visit, so there is no flash.

import type { Handle } from "remix/component";
import { css } from "remix/component";

import { PIXEL_FONT, bevelRules } from "./home-primitives.tsx";

// "system" means no choice yet: follow the device.
export type Theme = "system" | "light" | "dark";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function themeFromRequest(request: Request): Theme {
  let match = /(?:^|;\s*)theme=(light|dark)(?:;|$)/.exec(request.headers.get("Cookie") ?? "");
  return (match?.[1] as Theme | undefined) ?? "system";
}

type Styles = Parameters<typeof css>[0];

const NO_CHOICE = "&:not(:has(input[name=theme]:checked))";

// Selectors for the page root: apply the night tokens when the visitor chose
// Dark, or hasn't chosen and their device is in dark mode.
export function themeRules(light: Styles, night: Styles): Styles {
  return {
    ...light,
    "@media (prefers-color-scheme: dark)": { [NO_CHOICE]: night },
    "&:has(input[name=theme][value=dark]:checked)": night,
  };
}

const pressedRules = {
  ...bevelRules.pressed,
  background: "var(--title)",
  color: "var(--title-ink)",
};
const raisedRules = { ...bevelRules.raised, color: "var(--ink-on-chrome)" };

export function ThemeSwitcher(handle: Handle<{ theme: Theme }>) {
  return () => (
    <fieldset
      mix={css({
        position: "absolute",
        top: "16px",
        right: "16px",
        zIndex: 10,
        display: "flex",
        gap: 0,
        margin: 0,
        padding: 0,
        border: 0,
        boxShadow: "3px 3px 0 var(--frame)",
        "@media (min-width: 1100px)": { position: "fixed" },
        "[data-mode=play] > &": { display: "none" },
        "& legend": {
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        },
        "& label": {
          ...bevelRules.raised,
          position: "relative",
          padding: "0.3rem 0.7rem",
          color: "var(--ink-on-chrome)",
          fontFamily: PIXEL_FONT,
          fontSize: "0.875rem",
          lineHeight: 1.2,
          cursor: "pointer",
          userSelect: "none",
        },
        "& label + label": { borderLeft: 0 },
        "& label:hover": { background: "var(--chrome-hover)" },
        // Before a choice, the button matching the device looks pressed.
        [`${NO_CHOICE} label:has([value=light])`]: pressedRules,
        "@media (prefers-color-scheme: dark)": {
          [`${NO_CHOICE} label:has([value=light])`]: raisedRules,
          [`${NO_CHOICE} label:has([value=dark])`]: pressedRules,
        },
        "& label:has(:checked)": { ...pressedRules, cursor: "default" },
        "& label:has(:focus-visible)": {
          outline: "2px solid var(--accent)",
          outlineOffset: "2px",
          zIndex: 1,
        },
        "& input": { position: "absolute", opacity: 0, inset: 0, margin: 0, cursor: "inherit" },
      })}
    >
      <legend>Theme</legend>
      {OPTIONS.map((option) => (
        <label key={option.value}>
          <input
            type="radio"
            name="theme"
            value={option.value}
            checked={handle.props.theme === option.value}
          />
          {option.label}
        </label>
      ))}
      <script type="module" src="/theme.js?v=2" />
    </fieldset>
  );
}
