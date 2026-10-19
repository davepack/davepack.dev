// The stats dashboard page: server-rendered, no client JavaScript, in the
// site's own look. Kept independent of where it runs, so it can move into the
// site later behind Cloudflare Access.

import type { Handle, RemixNode } from "remix/component";
import { css } from "remix/component";

import { skillName, timeline } from "../../app/data/resume.ts";
import { Document } from "../../app/actions/document.tsx";
import { DAY_TOKENS, FONT_STACK, NIGHT_TOKENS, fontLinks } from "../../app/actions/home-page.tsx";
import {
  PIXEL_FONT,
  bevelRules,
  titleBarStyles,
  windowRules,
} from "../../app/actions/home-primitives.tsx";
import { themeRules } from "../../app/actions/home-theme.tsx";
import { RANGES, type Count, type Report } from "./analytics.ts";

const EVENT_NAMES: Record<string, string> = {
  view: "Page views",
  "game-start": "Ski runs started",
  "game-over": "Ski runs ended",
  skill: "Skills picked",
  "entry-open": "Detail windows opened",
  window: "Desktop actions",
  theme: "Theme switches",
  link: "Outbound links",
};

const entryNames = new Map(timeline().map((e) => [e.id, e.org ?? e.title]));
const total = (counts: Count[], key: string) => counts.find((c) => c.key === key)?.count ?? 0;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export function DashboardPage(
  handle: Handle<{ report: Report | null; error?: string; refresh: boolean }>,
) {
  return () => {
    let { report, error, refresh } = handle.props;
    return (
      <Document
        title="davepack.dev stats"
        description="Local analytics dashboard for davepack.dev."
        head={
          <>
            {fontLinks}
            {refresh ? <meta httpEquiv="refresh" content="60" /> : null}
          </>
        }
      >
        <main
          mix={css({
            ...themeRules(DAY_TOKENS, NIGHT_TOKENS),
            "& *, & *::before, & *::after": { boxSizing: "border-box" },
            minHeight: "100vh",
            margin: 0,
            padding: "24px",
            background: "var(--bg)",
            color: "var(--ink)",
            fontFamily: FONT_STACK,
            fontSize: "15px",
            lineHeight: 1.5,
            "& h1": { margin: "0 0 4px", fontFamily: PIXEL_FONT, fontSize: "1.75rem" },
            "& .sub": { margin: "0 0 20px", color: "var(--muted)" },
            "& .grid": {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 22rem), 1fr))",
              gap: "24px",
              alignItems: "start",
            },
            "& .wide": { gridColumn: "1 / -1" },
          })}
        >
          <h1>davepack.dev stats</h1>
          <p className="sub">
            Interaction events from Workers Analytics Engine. Visitors with Global Privacy Control
            or Do Not Track aren't counted, and the newest minute or two may not be in yet.
          </p>
          <Controls days={report?.days ?? 30} refresh={refresh} />
          {error ? (
            <Panel title="Couldn't load the data">
              <p>{error}</p>
            </Panel>
          ) : null}
          {report ? <ReportView report={report} /> : null}
        </main>
      </Document>
    );
  };
}

function Controls(handle: Handle<{ days: number; refresh: boolean }>) {
  return () => {
    let { days, refresh } = handle.props;
    return (
      <form
        method="get"
        mix={css({
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "8px",
          margin: "0 0 24px",
          "& button, & a": {
            ...bevelRules.raised,
            padding: "0.3rem 0.75rem",
            color: "var(--ink-on-chrome)",
            fontFamily: PIXEL_FONT,
            fontSize: "0.875rem",
            textDecoration: "none",
            cursor: "pointer",
          },
          "& [aria-pressed=true], & [aria-current]": {
            ...bevelRules.pressed,
            background: "var(--title)",
            color: "var(--title-ink)",
          },
          "& .spacer": { flex: 1 },
        })}
      >
        {refresh ? <input type="hidden" name="refresh" value="1" /> : null}
        {RANGES.map((n) => (
          <button
            key={n}
            type="submit"
            name="days"
            value={String(n)}
            aria-pressed={n === days ? "true" : "false"}
          >
            {n === 1 ? "24 hours" : `${n} days`}
          </button>
        ))}
        <span className="spacer" />
        <a
          href={`?days=${days}${refresh ? "" : "&refresh=1"}`}
          aria-current={refresh ? "true" : undefined}
        >
          {refresh ? "Auto-refresh on" : "Auto-refresh off"}
        </a>
      </form>
    );
  };
}

function ReportView(handle: Handle<{ report: Report }>) {
  return () => {
    let r = handle.props.report;
    let views = total(r.totals, "view");
    let skillPicks = total(r.totals, "skill");
    let opens = total(r.totals, "entry-open");
    let byEntry = new Map<string, number>();
    for (let e of r.entries) byEntry.set(e.entry, (byEntry.get(e.entry) ?? 0) + e.count);
    let fromWork = r.entries.filter((e) => e.from === "work").reduce((s, e) => s + e.count, 0);

    return (
      <div className="grid">
        <div className="wide">
          <Tiles
            tiles={[
              { label: "Page views", value: fmt(views) },
              {
                label: "Ski runs",
                value: fmt(r.ski.starts),
                note: r.ski.best ? `best ${fmt(r.ski.best)} m` : undefined,
              },
              { label: "Skills picked", value: fmt(skillPicks) },
              {
                label: "Windows opened",
                value: fmt(opens),
                note: opens ? `${fmt(fromWork)} from Work` : undefined,
              },
            ]}
          />
        </div>
        <Panel title="Page views per day" wide>
          <DailyBars days={r.dailyViews} />
        </Panel>
        <Panel title="Referrers">
          <BarList
            items={r.referrers.map((c) => ({ label: c.key, count: c.count }))}
            empty="No views yet."
          />
        </Panel>
        <Panel title="Skills picked">
          <BarList
            items={r.skills.map((c) => ({ label: skillName(c.key), count: c.count }))}
            empty="No skills picked yet."
          />
        </Panel>
        <Panel title="Detail windows opened">
          <BarList
            items={[...byEntry]
              .sort((a, b) => b[1] - a[1])
              .map(([id, count]) => ({ label: entryNames.get(id) ?? id, count }))}
            empty="No windows opened yet."
          />
        </Panel>
        <Panel title="Ski runs">
          <p>
            {fmt(r.ski.starts)} started, {fmt(r.ski.runs)} caught by the snow beast
            {r.ski.runs ? `, averaging ${fmt(r.ski.average)} m` : ""}.
          </p>
          <BarList
            items={r.distances.map((d) => ({
              label: `${fmt(d.bucket)}–${fmt(d.bucket + 249)} m`,
              count: d.count,
            }))}
            empty="No finished runs yet."
          />
        </Panel>
        <Panel title="Desktop actions">
          <BarList
            items={r.desktop.map((c) => ({ label: c.key.replace(":", " · "), count: c.count }))}
            empty="No window actions yet."
          />
        </Panel>
        <Panel title="Screens">
          <BarList
            items={r.screens.map((c) => ({
              label: c.key === "wide" ? "Wide (700 px+)" : "Narrow (phone)",
              count: c.count,
            }))}
            empty="No views yet."
          />
        </Panel>
        <Panel title="Countries">
          <BarList
            items={r.countries.map((c) => ({ label: c.key || "Unknown", count: c.count }))}
            empty="No views yet."
          />
        </Panel>
        <Panel title="Outbound links">
          <BarList
            items={r.links.map((c) => ({ label: c.key, count: c.count }))}
            empty="No links followed yet."
          />
        </Panel>
        <Panel title="All events">
          <BarList
            items={r.totals.map((c) => ({ label: EVENT_NAMES[c.key] ?? c.key, count: c.count }))}
            empty="Nothing recorded yet."
          />
        </Panel>
      </div>
    );
  };
}

function Panel(handle: Handle<{ title: string; wide?: boolean; children: RemixNode }>) {
  return () => (
    <section
      className={handle.props.wide ? "wide" : undefined}
      aria-label={handle.props.title}
      mix={css({ ...windowRules, "& > p": { margin: "0 0 0.75rem" } })}
    >
      <div className="titlebar" mix={titleBarStyles}>
        <span className="box menu" aria-hidden="true" />
        <h2>{handle.props.title}</h2>
        <span className="box min" aria-hidden="true" />
      </div>
      {handle.props.children}
    </section>
  );
}

function Tiles(handle: Handle<{ tiles: { label: string; value: string; note?: string }[] }>) {
  return () => (
    <ul
      mix={css({
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))",
        gap: "16px",
        "& li": { ...windowRules, padding: "0.75rem 1rem" },
        "& .label": { color: "var(--muted)", fontSize: "0.875rem" },
        "& .value": { display: "block", fontFamily: PIXEL_FONT, fontSize: "2rem", lineHeight: 1.2 },
        "& .note": { color: "var(--muted)", fontSize: "0.8125rem" },
      })}
    >
      {handle.props.tiles.map((t) => (
        <li key={t.label}>
          <span className="label">{t.label}</span>
          <span className="value">{t.value}</span>
          {t.note ? <span className="note">{t.note}</span> : null}
        </li>
      ))}
    </ul>
  );
}

// A ranked list with a bar behind each count; the numbers are always shown,
// so nothing depends on color or hovering.
function BarList(handle: Handle<{ items: { label: string; count: number }[]; empty: string }>) {
  return () => {
    let { items, empty } = handle.props;
    if (items.length === 0) return <p mix={css({ margin: 0, color: "var(--muted)" })}>{empty}</p>;
    let max = Math.max(...items.map((i) => i.count), 1);
    return (
      <ol
        mix={css({
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: "2px",
          "& li": {
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "0.2rem 0.5rem",
          },
          "& .bar": {
            position: "absolute",
            inset: "0 auto 0 0",
            zIndex: 0,
            background: "var(--accent-soft)",
            borderRadius: "0 4px 4px 0",
          },
          "& .label, & .count": { position: "relative", zIndex: 1 },
          "& .label": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
          "& .count": { fontVariantNumeric: "tabular-nums" },
        })}
      >
        {items.map((item) => (
          <li key={item.label}>
            <span className="bar" style={`width: ${(item.count / max) * 100}%`} />
            <span className="label">{item.label}</span>
            <span className="count">{fmt(item.count)}</span>
          </li>
        ))}
      </ol>
    );
  };
}

// Views per day as columns, with each day's count in a native tooltip and
// the peak and total labeled, so the exact numbers are readable without hovering.
function DailyBars(handle: Handle<{ days: { day: string; views: number }[] }>) {
  return () => {
    let { days } = handle.props;
    let max = Math.max(...days.map((d) => d.views), 1);
    let sum = days.reduce((s, d) => s + d.views, 0);
    // Drawn at roughly the size it's shown, so text stays near 12px.
    let W = 1200;
    let H = 140;
    let slot = W / days.length;
    let gap = Math.min(2, slot / 3);
    let peak = days.reduce((a, b) => (b.views > a.views ? b : a), days[0]);
    let label = (day: string) =>
      new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
    let every = Math.ceil(days.length / 8);
    return (
      <figure
        mix={css({
          margin: 0,
          "& svg": { display: "block", width: "100%", height: "auto" },
          "& figcaption": { color: "var(--muted)", fontSize: "0.875rem" },
        })}
      >
        <svg
          viewBox={`0 0 ${W} ${H + 22}`}
          role="img"
          aria-label={`Page views per day, ${fmt(sum)} total`}
        >
          <line x1="0" x2={W} y1={H} y2={H} stroke="var(--rule)" strokeWidth="1" />
          {days.map((d, i) => {
            let h = d.views ? Math.max(2, (d.views / max) * (H - 8)) : 0;
            let x = i * slot + gap / 2;
            let w = slot - gap;
            let r = Math.min(4, w / 2, h);
            return (
              <g key={d.day}>
                <title>{`${label(d.day)}: ${fmt(d.views)} views`}</title>
                <rect x={x} y={0} width={w} height={H} fill="transparent" />
                {h ? (
                  <path
                    d={`M${x},${H} V${H - h + r} Q${x},${H - h} ${x + r},${H - h} H${x + w - r} Q${x + w},${H - h} ${x + w},${H - h + r} V${H} Z`}
                    fill="var(--title)"
                  />
                ) : null}
                {i % every === 0 ? (
                  <text
                    x={i === 0 ? x : x + w / 2}
                    y={H + 16}
                    textAnchor={i === 0 ? "start" : "middle"}
                    fontSize="12"
                    fill="var(--muted)"
                  >
                    {label(d.day)}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
        <figcaption>
          {fmt(sum)} views in {days.length === 1 ? "the last day" : `${days.length} days`}
          {peak && peak.views ? `; peak ${fmt(peak.views)} on ${label(peak.day)}` : ""}.
        </figcaption>
      </figure>
    );
  };
}
