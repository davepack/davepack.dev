// Work timeline: one native <details> per role, newest first, with side
// projects at the end. Everything comes from app/data/resume.ts.

import type { Handle } from "remix/ui";
import { css } from "remix/ui";

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
  SectionHeading,
  TextLink,
  chevronRules,
  detailsHeightRules,
  windowRules,
} from "./home-primitives.tsx";

export function WorkTimeline() {
  let entries = timeline();

  return () => (
    <section aria-labelledby="work-heading" mix={css(windowRules)}>
      <SectionHeading id="work-heading">Work</SectionHeading>
      <ol
        mix={css({
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          interpolateSize: "allow-keywords",
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

    return (
      <details
        data-compact={entry.featured ? undefined : ""}
        mix={css({
          ...chevronRules,
          ...detailsHeightRules,
          "&[data-compact]": { fontSize: "0.9375rem", color: "var(--muted)" },
          "& > summary": {
            listStyle: "none",
            cursor: "pointer",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: "0.25rem 0.6rem",
            padding: "0.55rem 0.75rem",
            margin: "0 -0.75rem",
          },
          "& > summary:hover": { background: "var(--tint)" },
          "& h3": { margin: 0, fontSize: "1rem", fontWeight: 600 },
          "& .role": { color: "var(--muted)" },
          "& .when": {
            marginLeft: "auto",
            color: "var(--muted)",
            fontSize: "0.9375rem",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          },
          "& > .body": { padding: "0.25rem 0 1rem 1.05rem" },
          "& > .body > p": { margin: "0 0 0.75rem" },
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
          [MOTION_OK]: {
            "& > summary::before": { transition: "rotate 200ms steps(3)" },
            "&[open] > .body": { animation: "dp-reveal 260ms ease-out" },
          },
          "@keyframes dp-reveal": {
            from: { opacity: 0, transform: "translateY(-4px)" },
            to: { opacity: 1, transform: "none" },
          },
        })}
      >
        <summary>
          <h3>{heading}</h3>
          {role ? <span className="role">{role}</span> : null}
          {entry.kind === "project" ? <Chip>side project</Chip> : null}
          <span className="when">{formatRange(entry.start, entry.end, entry.current)}</span>
        </summary>
        <div className="body">
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
                <li key={id}>
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
      </details>
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
