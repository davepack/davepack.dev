import type { Handle, RemixNode } from "remix/ui";
import { css } from "remix/ui";

export interface DocumentProps {
  children?: RemixNode;
  head?: RemixNode;
  title?: string;
  description?: string;
}

const DEFAULT_TITLE = "Dave Pack";
const DEFAULT_DESCRIPTION =
  "Dave Pack — full-stack engineer and web platform lead in Arvada, Colorado.";

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    let { children, head, title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION } = handle.props;

    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light dark" />
          <meta name="description" content={description} />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
          <title>{title}</title>
          {head}
        </head>
        <body mix={css({ margin: 0 })}>{children}</body>
      </html>
    );
  };
}
