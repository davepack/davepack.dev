// Work timeline: a compact list of roles, newest first, with side projects at
// the end. Each row opens that entry's detail window (the same one the skill
// cards open), so the details live in one place. Everything comes from
// app/data/resume.ts.

import type { Handle } from "remix/component";
import { css } from "remix/component";

import {
  formatRange,
  skillName,
  timeline,
  type Story,
  type TimelineEntry,
} from "../data/resume.ts";
import {
  Chip,
  MOTION_OK,
  TextLink,
  chevronRules,
  detailsHeightRules,
  windowRules,
} from "./home-primitives.tsx";
import { entryWindowId } from "./home-skills.tsx";
import { WindowTitleBar } from "./public/window-title-bar.tsx";

export function WorkTimeline() {
  let entries = timeline();

  return () => (
    <section aria-labelledby="work-heading" data-window="work" mix={css(windowRules)}>
      <WindowTitleBar windowId="work" label="Work" title="Work" headingId="work-heading" />
      <ol
        mix={css({
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.125rem",
        })}
      >
        {entries.map((entry) => (
          <li key={entry.id}>
            <Entry entry={entry} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Entry(handle: Handle<{ entry: TimelineEntry }>) {
  return () => {
    let { entry } = handle.props;
    let heading = entry.org ?? entry.title;
    let role = entry.org ? entry.title : null;
    let dialogId = entryWindowId(entry);

    return (
      <button
        type="button"
        commandfor={dialogId}
        command="show-modal"
        aria-haspopup="dialog"
        data-vt={`work-${dialogId}`}
        data-compact={entry.featured ? undefined : ""}
        mix={css({
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          gap: "0.25rem 0.6rem",
          width: "calc(100% + 1.5rem)",
          padding: "0.55rem 0.75rem",
          margin: "0 -0.75rem",
          border: 0,
          textAlign: "left",
          font: "inherit",
          color: "var(--ink)",
          background: "none",
          cursor: "pointer",
          "&[data-compact]": { fontSize: "0.9375rem", color: "var(--muted)" },
          "&:hover": { background: "var(--tint)" },
          "&:focus-visible": { outlineOffset: "-2px" },
          // A small window glyph: this opens a window.
          "&::before": {
            content: '""',
            flex: "none",
            alignSelf: "center",
            width: "0.6rem",
            height: "0.5rem",
            border: "1.5px solid var(--hot)",
            borderTopWidth: "3px",
          },
          "& .org": { fontWeight: 600 },
          "& .role": { color: "var(--muted)" },
          "& .when": {
            marginLeft: "auto",
            color: "var(--muted)",
            fontSize: "0.9375rem",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          },
          // On a phone: company and dates on one line, the role under them.
          "@media (max-width: 600px)": {
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gridTemplateAreas: '"icon org when" ". role role"',
            columnGap: "0.6rem",
            rowGap: "0.1rem",
            "&::before": { gridArea: "icon", alignSelf: "start", marginTop: "0.5em" },
            "& .org": { gridArea: "org" },
            "& .when": { gridArea: "when", fontSize: "0.8125rem" },
            "& .role, & .role-chip": { gridArea: "role", justifySelf: "start" },
            "& .role": { fontSize: "0.9375rem", lineHeight: 1.4 },
          },
        })}
      >
        <span className="org">{heading}</span>
        {role ? <span className="role">{role}</span> : null}
        {entry.kind === "project" ? (
          <span className="role-chip">
            <Chip>side project</Chip>
          </span>
        ) : null}
        <span className="when">{formatRange(entry.start, entry.end, entry.current)}</span>
      </button>
    );
  };
}

// The details of one job or project: summary, highlights, skills, link, and
// stories, shown in its detail window.
export function EntryBody(handle: Handle<{ entry: TimelineEntry }>) {
  return () => {
    let { entry } = handle.props;

    return (
      <div
        className="body"
        mix={css({
          "& > p": { margin: "0 0 0.75rem" },
          "& .highlights": { margin: "0 0 0.75rem", paddingLeft: "1.1rem" },
          "& .highlights li": { margin: "0 0 0.35rem" },
          "& .chips": {
            listStyle: "none",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem",
            margin: "0 0 0.75rem",
            padding: 0,
          },
          "& .more": { fontSize: "0.9375rem" },
        })}
      >
        <p>{entry.summary}</p>
        {entry.highlights.length > 0 ? (
          <ul className="highlights">
            {entry.highlights.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        ) : null}
        {entry.skillIds.length > 0 ? (
          <ul className="chips" aria-label="Skills used">
            {entry.skillIds.map((id) => (
              <li key={id} data-skill={id}>
                <Chip>{skillName(id)}</Chip>
              </li>
            ))}
          </ul>
        ) : null}
        {entry.orgUrl ? (
          <p className="more">
            <TextLink href={entry.orgUrl}>{hostname(entry.orgUrl)}</TextLink>
          </p>
        ) : null}
        {entry.stories.map((story) => (
          <StoryDetails key={story.id} story={story} />
        ))}
      </div>
    );
  };
}

function StoryDetails(handle: Handle<{ story: Story }>) {
  return () => {
    let { story } = handle.props;

    return (
      <details
        mix={css({
          ...chevronRules,
          ...detailsHeightRules,
          marginTop: "0.5rem",
          borderLeft: "2px dashed var(--rule)",
          paddingLeft: "0.75rem",
          fontSize: "0.9375rem",
          "& > summary": {
            listStyle: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            padding: "0.25rem 0",
          },
          "& > .body > p": { margin: "0.5rem 0 0" },
          "& .takeaway": { color: "var(--muted)" },
          [MOTION_OK]: {
            "& > summary::before": { transition: "rotate 200ms steps(3)" },
            "&[open] > .body": { animation: "dp-reveal 260ms ease-out" },
          },
        })}
      >
        <summary>{story.title}</summary>
        <div className="body">
          <p>{story.context}</p>
          <p>{story.problem}</p>
          <p>{story.action}</p>
          <p>{story.result}</p>
          <p className="takeaway">
            <em>{story.takeaway}</em>
          </p>
        </div>
      </details>
    );
  };
}
