// Summarizes the site's interaction events from Workers Analytics Engine.
//
//   npm run events [days]
//
// Reads CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN from the environment or
// from .env.events (git-ignored). Not from .env: Wrangler reads that file and
// would use this read-only token in place of your login for deploys. The
// token needs the "Account Analytics: Read" permission. Columns are
// described in app/actions/events.ts. Analytics Engine samples at high
// volume, so counts are sums of _sample_interval.

const days = Number(process.argv[2] ?? 30);
const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
if (!account || !token) {
  console.error(
    "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (Account Analytics: Read) in .env.events.",
  );
  process.exit(1);
}

const since = `timestamp > NOW() - INTERVAL '${days}' DAY`;
const queries = {
  Events: `SELECT blob1 AS event, SUM(_sample_interval) AS count FROM davepack_events WHERE ${since} GROUP BY event ORDER BY count DESC`,
  Referrers: `SELECT blob2 AS referrer, SUM(_sample_interval) AS views FROM davepack_events WHERE ${since} AND blob1 = 'view' GROUP BY referrer ORDER BY views DESC LIMIT 15`,
  "Skills picked": `SELECT blob2 AS skill, SUM(_sample_interval) AS picks FROM davepack_events WHERE ${since} AND blob1 = 'skill' GROUP BY skill ORDER BY picks DESC LIMIT 15`,
  "Windows opened": `SELECT blob2 AS entry, blob3 AS source, SUM(_sample_interval) AS opens FROM davepack_events WHERE ${since} AND blob1 = 'entry-open' GROUP BY entry, source ORDER BY opens DESC`,
  Desktop: `SELECT blob2 AS action, SUM(_sample_interval) AS count FROM davepack_events WHERE ${since} AND blob1 = 'window' GROUP BY action ORDER BY count DESC`,
  "Ski runs": `SELECT SUM(_sample_interval) AS runs, MAX(double1) AS best, AVG(double1) AS average FROM davepack_events WHERE ${since} AND blob1 = 'game-over'`,
  "Screens and countries": `SELECT blob5 AS screen, blob4 AS country, SUM(_sample_interval) AS views FROM davepack_events WHERE ${since} AND blob1 = 'view' GROUP BY screen, country ORDER BY views DESC LIMIT 15`,
  "Outbound links": `SELECT blob2 AS host, SUM(_sample_interval) AS clicks FROM davepack_events WHERE ${since} AND blob1 = 'link' GROUP BY host ORDER BY clicks DESC`,
};

for (const [title, sql] of Object.entries(queries)) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: sql },
  );
  if (!response.ok) {
    console.error(`${title}: ${response.status} ${await response.text()}`);
    continue;
  }
  const { data } = await response.json();
  console.log(`\n${title} (last ${days} days)`);
  if (data.length === 0) console.log("  (none)");
  else console.table(data);
}
