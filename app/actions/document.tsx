import type { Handle, RemixNode } from 'remix/ui'
import { css } from 'remix/ui'

export interface DocumentProps {
  children?: RemixNode
  head?: RemixNode
  title?: string
  description?: string
}

const DEFAULT_TITLE = 'Dave Pack'
const DEFAULT_DESCRIPTION = 'Personal site of Dave Pack, software engineer.'

export function Document(handle: Handle<DocumentProps>) {
  return () => {
    let {
      children,
      head,
      title = DEFAULT_TITLE,
      description = DEFAULT_DESCRIPTION,
    } = handle.props

    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light dark" />
          <meta name="description" content={description} />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <title>{title}</title>
          {head}
        </head>
        <body mix={css({ margin: 0 })}>{children}</body>
      </html>
    )
  }
}
