// Reads the site's interaction events from Workers Analytics Engine (written
// by app/actions/events.ts; the columns are described there). Shared by the
// local dashboard and `npm run events`, and kept free of Node and Remix so it
// could also run in the Worker later.
//
// Analytics Engine samples at high volume, so counts sum _sample_interval.

export interface Credentials {
  account: string;
  token: string;
}

export const DATASET = "davepack_events";
export const RANGES = [1, 7, 30, 90] as const;

export function credentialsFromEnv(env: Record<string, string | undefined>): Credentials | null {
  let account = env.CLOUDFLARE_ACCOUNT_ID;
  let token = env.CLOUDFLARE_API_TOKEN;
  return account && token ? { account, token } : null;
}

type Row = Record<string, string | number | null>;

export async function query(credentials: Credentials, sql: string, signal?: AbortSignal) {
  let response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${credentials.account}/analytics_engine/sql`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${credentials.token}` },
      body: sql,
      signal,
    },
  );
  if (!response.ok) {
    throw new Error(
      `Analytics Engine ${response.status}: ${(await response.text()).slice(0, 300)}`,
    );
  }
  let { data } = (await response.json()) as { data: Row[] };
  return data;
}

export interface Count {
  key: string;
  count: number;
}

export interface Report {
  days: number;
  totals: Count[];
  dailyViews: { day: string; views: number }[];
  referrers: Count[];
  skills: Count[];
  entries: { entry: string; from: string; count: number }[];
  desktop: Count[];
  ski: { runs: number; best: number; average: number; starts: number };
  distances: { bucket: number; count: number }[];
  screens: Count[];
  countries: Count[];
  links: Count[];
}

// Every query interpolates only `days`, which is a number from RANGES.
const since = (days: number) => `timestamp > NOW() - INTERVAL '${days}' DAY`;
const n = (value: unknown) => Number(value ?? 0) || 0;
const counts = (rows: Row[]) => rows.map((r) => ({ key: String(r.key ?? ""), count: n(r.count) }));
const topBy = (field: string, event: string, days: number, limit = 15) =>
  `SELECT ${field} AS key, SUM(_sample_interval) AS count FROM ${DATASET}
   WHERE ${since(days)} AND blob1 = '${event}' GROUP BY key ORDER BY count DESC LIMIT ${limit}`;

/** Every number on the dashboard for the last `days` days, in parallel queries. */
export async function loadReport(credentials: Credentials, days: number, signal?: AbortSignal) {
  let q = (sql: string) => query(credentials, sql, signal);
  let [
    totals,
    daily,
    referrers,
    skills,
    entries,
    desktop,
    ski,
    starts,
    distances,
    screens,
    countries,
    links,
  ] = await Promise.all([
    q(`SELECT blob1 AS key, SUM(_sample_interval) AS count FROM ${DATASET}
         WHERE ${since(days)} GROUP BY key ORDER BY count DESC`),
    q(`SELECT toStartOfInterval(timestamp, INTERVAL '1' DAY) AS day, SUM(_sample_interval) AS views
         FROM ${DATASET} WHERE ${since(days)} AND blob1 = 'view' GROUP BY day ORDER BY day`),
    q(topBy("blob2", "view", days)),
    q(topBy("blob2", "skill", days)),
    q(`SELECT blob2 AS entry, blob3 AS source, SUM(_sample_interval) AS count FROM ${DATASET}
         WHERE ${since(days)} AND blob1 = 'entry-open' GROUP BY entry, source ORDER BY count DESC`),
    q(topBy("blob2", "window", days)),
    q(`SELECT SUM(_sample_interval) AS runs, MAX(double1) AS best, AVG(double1) AS average
         FROM ${DATASET} WHERE ${since(days)} AND blob1 = 'game-over'`),
    q(`SELECT SUM(_sample_interval) AS starts FROM ${DATASET}
         WHERE ${since(days)} AND blob1 = 'game-start'`),
    q(`SELECT intDiv(double1, 250) * 250 AS bucket, SUM(_sample_interval) AS count FROM ${DATASET}
         WHERE ${since(days)} AND blob1 = 'game-over' GROUP BY bucket ORDER BY bucket`),
    q(topBy("blob5", "view", days)),
    q(topBy("blob4", "view", days)),
    q(topBy("blob2", "link", days)),
  ]);

  return {
    days,
    totals: counts(totals),
    dailyViews: fillDays(
      daily.map((r) => ({ day: String(r.day).slice(0, 10), views: n(r.views) })),
      days,
    ),
    referrers: counts(referrers),
    skills: counts(skills),
    entries: entries.map((r) => ({
      entry: String(r.entry),
      from: String(r.source),
      count: n(r.count),
    })),
    desktop: counts(desktop),
    ski: {
      runs: n(ski[0]?.runs),
      best: n(ski[0]?.best),
      average: n(ski[0]?.average),
      starts: n(starts[0]?.starts),
    },
    distances: distances.map((r) => ({ bucket: n(r.bucket), count: n(r.count) })),
    screens: counts(screens),
    countries: counts(countries),
    links: counts(links),
  } satisfies Report;
}

/** One entry per UTC day in the range, zero where nothing happened. */
export function fillDays(rows: { day: string; views: number }[], days: number, now = new Date()) {
  let byDay = new Map(rows.map((r) => [r.day, r.views]));
  let out: { day: string; views: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    let day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
      .toISOString()
      .slice(0, 10);
    out.push({ day, views: byDay.get(day) ?? 0 });
  }
  return out;
}
