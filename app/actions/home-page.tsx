import { css } from "remix/ui";
import { spring } from "remix/ui/animation";

import { Document } from "./document.tsx";
import { RidgeDivider, Squiggle } from "./home-flourishes.tsx";
import { DARK, MOTION_OK, TextLink } from "./home-primitives.tsx";
import { SkillStickers } from "./home-skills.tsx";
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

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// Faint grey paper grain, tiled. Desaturated so it never tints the page.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function HomePage() {
  return () => (
    <Document>
      <main
        mix={css({
          // Light-mode tokens (default): warm paper, near-black ink,
          // terracotta accent.
          "--bg": "#fbfaf8",
          "--ink": "#1c1b1a",
          "--muted": "#6f6b66",
          "--accent": "#b3541e",
          "--accent-soft": "rgba(179, 84, 30, 0.18)",
          "--tint": "rgba(179, 84, 30, 0.07)",
          "--rule": "#e5e1db",
          "--card": "#ffffff",
          "--shadow": "rgba(28, 27, 26, 0.08)",
          "--glow": "rgba(179, 84, 30, 0.10)",
          "--grain-opacity": "0.05",
          [DARK]: {
            "--bg": "#131211",
            "--ink": "#e7e4e0",
            "--muted": "#97918a",
            "--accent": "#e08e57",
            "--accent-soft": "rgba(224, 142, 87, 0.22)",
            "--tint": "rgba(224, 142, 87, 0.10)",
            "--rule": "#2c2a27",
            "--card": "#1c1b19",
            "--shadow": "rgba(0, 0, 0, 0.4)",
            "--glow": "rgba(224, 142, 87, 0.12)",
            "--grain-opacity": "0.06",
          },
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
          // Paper: a grain layer and a warm glow behind the header, both fixed
          // and behind the content but above the page background.
          "&::before, &::after": {
            content: '""',
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: -1,
          },
          "&::before": {
            backgroundImage: GRAIN,
            backgroundSize: "160px 160px",
            opacity: "var(--grain-opacity)",
          },
          "&::after": {
            background: "radial-gradient(60rem 28rem at 50% -8rem, var(--glow), transparent 70%)",
          },
          "& ::selection": { background: "var(--accent)", color: "var(--bg)" },
          "& :focus-visible": { outline: "2px solid var(--accent)", outlineOffset: "3px" },
        })}
      >
        <div
          mix={css({
            width: "100%",
            maxWidth: "38rem",
            padding: "18vh 0 12vh",
            display: "flex",
            flexDirection: "column",
            gap: "3rem",
            "@media (max-width: 600px)": { padding: "14vh 0 10vh" },
            // Sections rise in one after another on load.
            [MOTION_OK]: {
              "& > *": { animation: "dp-rise 600ms cubic-bezier(0.2, 0.7, 0.2, 1) both" },
              "& > :nth-child(2)": { animationDelay: "80ms" },
              "& > :nth-child(3)": { animationDelay: "160ms" },
              "& > :nth-child(4)": { animationDelay: "240ms" },
              "& > :nth-child(5)": { animationDelay: "320ms" },
              "& > :nth-child(6)": { animationDelay: "400ms" },
            },
            "@keyframes dp-rise": {
              from: { opacity: 0, transform: "translateY(10px)" },
              to: { opacity: 1, transform: "none" },
            },
          })}
        >
          <Header />
          <Bio />
          <Links />
          <WorkTimeline />
          <SkillStickers />
          <Footer />
        </div>
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
          borderRadius: "50%",
          objectFit: "cover",
          border: "1px solid var(--rule)",
          marginBottom: "1.25rem",
          // Tips its cap when you hover.
          transformOrigin: "50% 80%",
          [MOTION_OK]: {
            transition: spring.transition("transform", "bouncy"),
            "&:hover": { transform: "rotate(-7deg) translateY(-3px) scale(1.04)" },
            "&:active": { transform: "rotate(-4deg) scale(0.96)" },
          },
        })}
      />
      <h1
        mix={css({
          margin: 0,
          fontSize: "2rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        })}
      >
        <span
          mix={css({
            // The squiggle is absolutely positioned so its 400-unit viewBox
            // never widens the name (or the page on small screens).
            position: "relative",
            display: "inline-block",
            paddingBottom: "0.7rem",
          })}
        >
          {content.name}
          <Squiggle />
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
        fontSize: "0.875rem",
        color: "var(--muted)",
        "& p": { margin: 0 },
      })}
    >
      <RidgeDivider />
      <p>
        &copy; {new Date().getFullYear()} Dave Pack &middot;{" "}
        <TextLink href="https://v1.davepack.dev">v1 of this site</TextLink>
      </p>
      <p>Made about a mile above sea level.</p>
    </footer>
  );
}
