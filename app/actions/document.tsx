import type { Handle, RemixNode } from "remix/component";
import { css } from "remix/component";

import { themeRules } from "./home-theme.tsx";

export interface DocumentProps {
  children?: RemixNode;
  head?: RemixNode;
  title?: string;
  description?: string;
}

const DEFAULT_TITLE = "Dave Pack";
const DEFAULT_DESCRIPTION =
  "Dave Pack, full-stack engineer and web platform lead in Arvada, Colorado.";

const htmlRules = {
  // The theme switcher also decides the scrollbar and form-control colors.
  ...themeRules({ colorScheme: "light" }, { colorScheme: "dark" }),
  // No scrolling the page behind an open window. public/skills.js sets this
  // between transitions (see the note there on why not with :has()).
  "&[data-window-open]": { overflow: "hidden" },
  // View transitions only animate the elements that name themselves (the
  // skill cards); everything else, the ski slope included, stays live.
  viewTransitionName: "none",
  "&::view-transition-group(*)": {
    animationDuration: "280ms",
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  },
  "&::view-transition-old(*), &::view-transition-new(*)": { animationDuration: "280ms" },
};

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    let { children, head, title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION } = handle.props;

    return (
      <html lang="en" mix={css(htmlRules)}>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light dark" />
          <meta name="description" content={description} />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3" />
          <title>{title}</title>
          {head}
        </head>
        <body mix={css({ margin: 0 })}>{children}</body>
      </html>
    );
  };
}
