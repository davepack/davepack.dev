// Search and link-preview metadata for the home page: canonical URL, Open
// Graph and Twitter/X cards (with the preview image from
// `npm run images`; bump ?v= when it changes so previews refetch it), mobile
// theme colors, and a schema.org Person.

export const SITE_URL = "https://davepack.dev/";
export const SEO_TITLE = "Dave Pack · Full-stack engineer & web platform lead";
export const SEO_DESCRIPTION =
  "Dave Pack, full-stack engineer and web platform lead in Arvada, Colorado.";
const IMAGE = { url: `${SITE_URL}og.png?v=2`, width: 1200, height: 630 };
const IMAGE_ALT =
  "Dave Pack, full-stack engineer and web platform lead, in a retro desktop window over a snowy ski slope.";

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Dave Pack",
  url: SITE_URL,
  image: `${SITE_URL}profile.jpeg`,
  jobTitle: "Web Platform Lead",
  worksFor: { "@type": "Organization", name: "Kroger Technology" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Arvada",
    addressRegion: "CO",
    addressCountry: "US",
  },
  sameAs: ["https://github.com/davepack", "https://www.linkedin.com/in/dpack"],
};

export const seoHead = (
  <>
    <link rel="canonical" href={SITE_URL} />
    <meta property="og:type" content="profile" />
    <meta property="og:site_name" content="Dave Pack" />
    <meta property="og:url" content={SITE_URL} />
    <meta property="og:title" content={SEO_TITLE} />
    <meta property="og:description" content={SEO_DESCRIPTION} />
    <meta property="og:image" content={IMAGE.url} />
    <meta property="og:image:width" content={String(IMAGE.width)} />
    <meta property="og:image:height" content={String(IMAGE.height)} />
    <meta property="og:image:alt" content={IMAGE_ALT} />
    <meta property="profile:first_name" content="Dave" />
    <meta property="profile:last_name" content="Pack" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={SEO_TITLE} />
    <meta name="twitter:description" content={SEO_DESCRIPTION} />
    <meta name="twitter:image" content={IMAGE.url} />
    <meta name="twitter:image:alt" content={IMAGE_ALT} />
    {/* Browser chrome on mobile: snow by day, night skiing in dark mode. */}
    <meta name="theme-color" content="#f7fafd" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#0d1726" media="(prefers-color-scheme: dark)" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <script type="application/ld+json">{JSON.stringify(person)}</script>
  </>
);
