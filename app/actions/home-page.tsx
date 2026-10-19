import type { Handle } from "remix/component";
import { css } from "remix/component";

import { Document } from "./document.tsx";
import { DesktopIcons } from "./public/desktop-icons.tsx";
import { WindowTitleBar } from "./public/window-title-bar.tsx";
import { MountainDivider, SkiTracks } from "./home-flourishes.tsx";
import { MOTION_OK, PIXEL_FONT, TextLink, windowRules } from "./home-primitives.tsx";
import { SkiSlope, skiRootRules } from "./home-ski.tsx";
import { EntryWindows, SkillStickers } from "./home-skills.tsx";
import { ThemeSwitcher, themeRules, type Theme } from "./home-theme.tsx";
import { WorkTimeline } from "./home-work.tsx";

// Everything on the page is driven by this object.
const content = {
  name: "Dave Pack",
  avatar: { src: "/profile.jpeg", alt: "Portrait of Dave Pack" },
  role: "Full-stack engineer & web platform lead · Arvada, Colorado",
  bio: [
    "I've spent 15 years building for the web, the last eight at Kroger, where I now lead the web platform team that stewards architecture, performance, and code quality for an e-commerce codebase shared by more than twenty teams and eleven million weekly visitors.",
    "I care about leaving codebases and teams better than I found them: architecture decision records, pragmatic standards, pairing, and a daily AI-native workflow with Claude Code. Before Kroger I worked on open source React Native tooling at Expo, shipped a cross-platform mobile app, and cofounded a startup.",
  ],
  links: [
    { label: "GitHub", href: "https://github.com/davepack" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/dpack" },
  ],
};

// A springy overshoot for the avatar's hover tilt.
const SPRING_BOUNCY = "450ms cubic-bezier(0.34, 1.56, 0.64, 1)";

// The windows that can be moved, minimized, and reopened from an icon.
const DESKTOP_WINDOWS = [
  { id: "about", label: "About", art: "about" },
  { id: "work", label: "Work", art: "work" },
  { id: "skills", label: "Skills", art: "skills" },
] as const satisfies { id: string; label: string; art: string }[];

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap";

export const fontLinks = (
  <>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link rel="stylesheet" href={FONT_HREF} />
    {/* The Remix browser runtime and the client entries it hydrates. */}
    <script type="module" src="/js/app.js" />
  </>
);

// Day on the mountain: fresh snow, ink outlines, a navy title bar, and a red
// ski-jacket accent.
export const DAY_TOKENS = {
  colorScheme: "light",
  "--bg": "#f7fafd",
  "--ink": "#13161c",
  "--muted": "#566173",
  "--accent": "#1f4fd1",
  "--accent-soft": "rgba(31, 79, 209, 0.18)",
  "--tint": "rgba(31, 79, 209, 0.07)",
  "--hot": "#d12b2b",
  "--rule": "#cdd5e1",
  "--card": "#ffffff",
  "--frame": "#13161c",
  "--title": "#1d2f91",
  "--title-ink": "#ffffff",
  "--chrome": "#c3cad4",
  "--chrome-hover": "#d3d9e1",
  "--ink-on-chrome": "#13161c",
  "--bevel-light": "#ffffff",
  "--bevel-dark": "#7d8796",
  "--mtn": "#c9d3e0",
  "--mtn-back": "#dfe6ef",
  "--snowcap": "#ffffff",
  "--sun-display": "block",
  "--moon-display": "none",
};

// Night skiing.
export const NIGHT_TOKENS = {
  colorScheme: "dark",
  "--bg": "#0d1726",
  "--ink": "#e6edf7",
  "--muted": "#93a1b8",
  "--accent": "#8fb0ff",
  "--accent-soft": "rgba(143, 176, 255, 0.24)",
  "--tint": "rgba(143, 176, 255, 0.10)",
  "--hot": "#ff6b5e",
  "--rule": "#2a3a55",
  "--card": "#121f33",
  "--frame": "#6f84a8",
  "--title": "#2b46c4",
  "--title-ink": "#ffffff",
  "--chrome": "#34445f",
  "--chrome-hover": "#3d4f6d",
  "--ink-on-chrome": "#e6edf7",
  "--bevel-light": "#56698a",
  "--bevel-dark": "#0a111d",
  "--mtn": "#22324c",
  "--mtn-back": "#1a2840",
  "--snowcap": "#c9d6ea",
  "--sun-display": "none",
  "--moon-display": "block",
};

export function HomePage(handle: Handle<{ theme: Theme }>) {
  return () => (
    <Document head={fontLinks}>
      <main
        data-ski-root
        mix={css({
          ...themeRules(DAY_TOKENS, NIGHT_TOKENS),
          ...skiRootRules,
          "& *, & *::before, & *::after": { boxSizing: "border-box" },
          position: "relative",
          isolation: "isolate",
          minHeight: "100vh",
          margin: 0,
          padding: "0 24px",
          background: "var(--bg)",
          color: "var(--ink)",
          fontFamily: FONT_STACK,
          fontSize: "17px",
          lineHeight: 1.65,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          display: "flex",
          justifyContent: "center",
          "@media (max-width: 600px)": { padding: "0 16px" },
          "& ::selection": { background: "var(--title)", color: "var(--title-ink)" },
          "& :focus-visible": { outline: "2px solid var(--accent)", outlineOffset: "3px" },
        })}
      >
        <SkiSlope />
        <ThemeSwitcher theme={handle.props.theme} />
        <div
          className="page"
          mix={css({
            width: "100%",
            maxWidth: "40rem",
            padding: "14vh 0 16vh",
            display: "flex",
            flexDirection: "column",
            gap: "2.5rem",
            "@media (max-width: 600px)": { padding: "8vh 0 14vh", gap: "2rem" },
            // Windows drop in one after another on load.
            [MOTION_OK]: {
              "& > *": { animation: "dp-rise 600ms cubic-bezier(0.2, 0.7, 0.2, 1) both" },
              "& > :nth-child(2)": { animationDelay: "100ms" },
              "& > :nth-child(3)": { animationDelay: "200ms" },
              "& > :nth-child(4)": { animationDelay: "300ms" },
            },
            "@keyframes dp-rise": {
              from: { opacity: 0, transform: "translateY(10px)" },
              to: { opacity: 1, transform: "none" },
            },
          })}
        >
          <DesktopIcons windows={DESKTOP_WINDOWS} />
          <div
            data-window="about"
            mix={css({ ...windowRules, display: "flex", flexDirection: "column", gap: "2rem" })}
          >
            <div>
              <WindowTitleBar windowId="about" label="About" />
              <Header />
            </div>
            <Bio />
            <Links />
          </div>
          <WorkTimeline />
          <SkillStickers />
          <Footer />
        </div>
        <EntryWindows />
      </main>
    </Document>
  );
}

function Header() {
  return () => (
    <header>
      <img
        src={content.avatar.src}
        alt={content.avatar.alt}
        width={88}
        height={88}
        mix={css({
          display: "block",
          width: "88px",
          height: "88px",
          objectFit: "cover",
          border: "2px solid var(--frame)",
          boxShadow: "3px 3px 0 var(--frame)",
          marginBottom: "1.25rem",
          // Tips its cap when you hover.
          transformOrigin: "50% 80%",
          [MOTION_OK]: {
            transition: `transform ${SPRING_BOUNCY}`,
            "&:hover": { transform: "rotate(-7deg) translateY(-3px) scale(1.04)" },
            "&:active": { transform: "rotate(-4deg) scale(0.96)" },
          },
        })}
      />
      <h1
        mix={css({
          margin: 0,
          fontFamily: PIXEL_FONT,
          fontSize: "2.5rem",
          fontWeight: 600,
          lineHeight: 1.1,
        })}
      >
        <span
          mix={css({
            // The tracks are absolutely positioned so their 400-unit viewBox
            // never widens the name (or the page on small screens).
            position: "relative",
            display: "inline-block",
            paddingBottom: "0.9rem",
          })}
        >
          {content.name}
          <SkiTracks />
        </span>
      </h1>
      <p
        mix={css({
          margin: "0.5rem 0 0",
          fontSize: "1.0625rem",
          color: "var(--muted)",
        })}
      >
        {content.role}
      </p>
    </header>
  );
}

function Bio() {
  return () => (
    <section aria-label="About">
      {content.bio.map((paragraph) => (
        <p
          key={paragraph}
          mix={css({
            margin: "0 0 1.25rem",
            "&:last-child": { marginBottom: 0 },
          })}
        >
          {paragraph}
        </p>
      ))}
    </section>
  );
}

function Links() {
  return () => (
    <nav aria-label="Elsewhere">
      <ul
        mix={css({
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          gap: "1.5rem",
        })}
      >
        {content.links.map((link) => (
          <li key={link.href}>
            <TextLink href={link.href}>{link.label}</TextLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Footer() {
  return () => (
    <footer
      mix={css({
        ...windowRules,
        paddingTop: "var(--pad)",
        fontSize: "0.875rem",
        color: "var(--muted)",
        "& p": { margin: 0 },
      })}
    >
      <MountainDivider />
      <p>
        &copy; {new Date().getFullYear()} Dave Pack &middot;{" "}
        <TextLink href="https://v1.davepack.dev">v1 of this site</TextLink>
      </p>
      <p>Made about a mile above sea level.</p>
    </footer>
  );
}
