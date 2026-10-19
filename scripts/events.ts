// Prints the site's interaction events as tables, from the same queries the
// local dashboard uses (tools/dashboard/analytics.ts).
//
//   npm run events [days]      days: 1, 7, 30 (default), or 90
//
// Reads CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN from the environment or
// from .env.events (git-ignored). Not from .env: Wrangler reads that file and
// would use this read-only token in place of your login for deploys. The
// token needs the "Account Analytics: Read" permission.

import { RANGES, credentialsFromEnv, loadReport } from "../tools/dashboard/analytics.ts";

const credentials = credentialsFromEnv(process.env);
if (!credentials) {
  console.error(
    "Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (Account Analytics: Read) in .env.events.",
  );
  process.exit(1);
}

const asked = Number(process.argv[2] ?? 30);
const days = (RANGES as readonly number[]).includes(asked) ? asked : 30;
const r = await loadReport(credentials, days);

const show = (title: string, rows: object[]) => {
  console.log(`\n${title} (last ${days} days)`);
  if (rows.length === 0) console.log("  (none)");
  else console.table(rows);
};

show("Events", r.totals);
show(
  "Page views per day",
  r.dailyViews.filter((d) => d.views > 0),
);
show("Referrers", r.referrers);
show("Skills picked", r.skills);
show("Detail windows opened", r.entries);
show("Desktop actions", r.desktop);
show("Ski runs", [r.ski]);
show("Ski distances", r.distances);
show("Screens", r.screens);
show("Countries", r.countries);
show("Outbound links", r.links);
