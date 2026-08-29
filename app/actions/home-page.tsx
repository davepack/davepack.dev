import type { Handle, RemixNode } from "remix/ui";
import { css } from "remix/ui";

import { Document } from "./document.tsx";

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
          "--rule": "#e5e1db",
          "@media (prefers-color-scheme: dark)": {
            "--bg": "#131211",
            "--ink": "#e7e4e0",
            "--muted": "#97918a",
            "--accent": "#e08e57",
            "--rule": "#2c2a27",
          },
          "& *, & *::before, & *::after": { boxSizing: "border-box" },
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
          })}
        >
          <Header />
          <Bio />
          <Links />
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
        {content.name}
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
        borderTop: "1px solid var(--rule)",
        paddingTop: "1.5rem",
        fontSize: "0.875rem",
        color: "var(--muted)",
      })}
    >
      <p mix={css({ margin: 0 })}>
        &copy; {new Date().getFullYear()} Dave Pack &middot;{" "}
        <TextLink href="https://v1.davepack.dev">v1 of this site</TextLink>
      </p>
    </footer>
  );
}

function TextLink(handle: Handle<{ href: string; children: RemixNode }>) {
  return () => {
    let { href, children } = handle.props;

    return (
      <a
        href={href}
        mix={css({
          color: "var(--accent)",
          textDecoration: "none",
          borderBottom: "1px solid transparent",
          transition: "border-color 120ms ease",
          "&:hover, &:focus-visible": {
            borderBottomColor: "var(--accent)",
            outline: "none",
          },
        })}
      >
        {children}
      </a>
    );
  };
}
