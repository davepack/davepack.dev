// Skills: a set of skill buttons over a grid of job and project cards, after
// the mechanism on v1 of the site. Picking a skill keeps only the cards that
// used it; clicking a card opens it as a window with the full details.
//
// The skill buttons are radios, and the filtering is CSS (:has() on the
// checked radio), so it all works without JavaScript. Cards open native modal
// <dialog>s through invoker commands. public/skills.js layers view
// transitions on top: cards slide into place when the filter changes and grow
// into their window when opened.

import type { Handle } from "remix/component";
import { css } from "remix/component";

import {
  formatRange,
  formatStat,
  skillGroups,
  timeline,
  type SkillGroup,
  type TimelineEntry,
} from "../data/resume.ts";
import {
  Chip,
  MOTION_OK,
  PIXEL_FONT,
  SectionHeading,
  TitleBar,
  bevelRules,
  windowRules,
} from "./home-primitives.tsx";
import { EntryBody } from "./home-work.tsx";

const ALL = "all";
const SCRIPT_VERSION = "5";

type Styles = Parameters<typeof css>[0];

// Ids from the resume JSON are slugs, but quote them anyway so a stray
// character can never break a selector or a transition name.
const quote = (value: string) => JSON.stringify(value);
const slug = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "-");
const checked = (skillId: string) => `&:has(input[name=skill][value=${quote(skillId)}]:checked)`;

// One set of rules per skill: hide the cards that don't use it, show its
// caption, and mark it among the skills listed inside each card's window.
function filterRules(groups: SkillGroup[]): Styles {
  let rules: Styles = {};
  for (let group of groups) {
    for (let skill of group.skills) {
      let id = quote(skill.id);
      rules[`${checked(skill.id)} .card-slot:not([data-skills~=${id}])`] = { display: "none" };
      rules[`${checked(skill.id)} .cap[data-for=${id}]`] = { display: "block" };
      rules[`${checked(skill.id)} li[data-skill=${id}] > span`] = {
        borderColor: "var(--title)",
        background: "var(--title)",
        color: "var(--title-ink)",
      };
    }
  }
  return rules;
}

export function SkillStickers() {
  let groups = skillGroups();
  let entries = timeline();
  let rules = filterRules(groups);

  return () => (
    <section
      aria-labelledby="skills-heading"
      data-skill-cards
      mix={css({
        ...windowRules,
        ...rules,
        "& fieldset": { margin: "0 0 1rem", padding: 0, border: 0, minWidth: 0 },
        "& legend": {
          margin: "0 0 0.4rem",
          padding: 0,
          fontSize: "0.75rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--muted)",
        },
        "& .cloud": {
          display: "flex",
          flexWrap: "wrap",
          gap: "0.55rem 0.5rem",
          padding: "0.2rem 0",
        },
        // Skill buttons: raised until picked, then pressed in title-bar blue.
        "& label.pill": {
          ...bevelRules.raised,
          position: "relative",
          display: "inline-block",
          padding: "0.3rem 0.75rem",
          color: "var(--ink-on-chrome)",
          fontFamily: PIXEL_FONT,
          fontSize: "0.9375rem",
          lineHeight: 1.3,
          cursor: "pointer",
          userSelect: "none",
        },
        "& label.pill:hover": { background: "var(--chrome-hover)" },
        "& label.pill:has(:checked)": {
          ...bevelRules.pressed,
          translate: "1px 1px",
          background: "var(--title)",
          color: "var(--title-ink)",
        },
        "& label.pill:has(:focus-visible)": {
          outline: "2px solid var(--accent)",
          outlineOffset: "2px",
        },
        "& label.pill input": {
          position: "absolute",
          inset: 0,
          margin: 0,
          opacity: 0,
          cursor: "inherit",
        },
        // The All button sits beside the caption of whatever is picked.
        "& .status": {
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem",
          minHeight: "3.25rem",
          margin: "0.25rem 0 0",
          paddingTop: "1rem",
          borderTop: "2px solid var(--rule)",
        },
        "& .status .pill": { flex: "none" },
        "& .cap, & .hint": { margin: 0, fontSize: "0.9375rem", lineHeight: 1.55 },
        "& .cap": { display: "none" },
        "& .cap .name": { fontWeight: 600 },
        "& .hint": { color: "var(--muted)" },
        "&:has(input[name=skill]:not([value=all]):checked) .hint": { display: "none" },
        [MOTION_OK]: {
          "& label.pill": { transition: "translate 160ms cubic-bezier(0.2, 0.8, 0.2, 1)" },
        },
      })}
    >
      <SectionHeading id="skills-heading">Skills</SectionHeading>
      {groups.map((group) => (
        <fieldset key={group.label}>
          <legend>{group.label}</legend>
          <div className="cloud">
            {group.skills.map((skill) => (
              <label key={skill.id} className="pill">
                <input type="radio" name="skill" value={skill.id} />
                {skill.name}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="status">
        <label className="pill">
          <input type="radio" name="skill" value={ALL} checked />
          All
        </label>
        <p className="hint">Select a skill to read more.</p>
        {groups.flatMap((group) =>
          group.skills.map((skill) => {
            let stat = formatStat(skill);
            return (
              <p key={skill.id} className="cap" data-for={skill.id}>
                <span className="name">{skill.name}</span>
                {" · "}
                {stat ? `${stat}. ` : ""}
                {skill.summary}
              </p>
            );
          }),
        )}
      </div>
      <Cards entries={entries} />
      <script type="module" src={`/skills.js?v=${SCRIPT_VERSION}`} />
    </section>
  );
}

function Cards(handle: Handle<{ entries: TimelineEntry[] }>) {
  return () => (
    <ul
      mix={css({
        listStyle: "none",
        margin: "1rem 0 0",
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(14rem, 1fr))",
        gap: "1rem",
      })}
    >
      {handle.props.entries.map((entry) => (
        <li key={entry.id} className="card-slot" data-skills={entry.skillIds.join(" ")}>
          <Card entry={entry} />
        </li>
      ))}
    </ul>
  );
}

// A card is a tiny window; opening it shows the same window at full size.
function Card(handle: Handle<{ entry: TimelineEntry }>) {
  return () => {
    let { entry } = handle.props;
    let id = slug(entry.id);
    let dialogId = `entry-${id}`;

    return (
      <>
        <button
          type="button"
          className="card"
          commandfor={dialogId}
          command="show-modal"
          data-vt={`card-${id}`}
          mix={css({
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            padding: 0,
            textAlign: "left",
            font: "inherit",
            color: "var(--ink)",
            background: "var(--card)",
            border: "2px solid var(--frame)",
            boxShadow: "3px 3px 0 var(--frame)",
            cursor: "pointer",
            "&:hover, &:focus-visible": {
              translate: "-2px -2px",
              boxShadow: "5px 5px 0 var(--frame)",
            },
            "& .bar": {
              display: "block",
              padding: "0.3rem 0.6rem",
              background: "var(--title)",
              color: "var(--title-ink)",
              borderBottom: "2px solid var(--frame)",
              fontFamily: PIXEL_FONT,
              fontSize: "0.875rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
            // Block layout, not flex: line clamping needs its -webkit-box.
            "& .face": { display: "block", padding: "0.6rem 0.75rem 0.75rem" },
            "& .role": {
              display: "block",
              fontWeight: 600,
              fontSize: "0.9375rem",
              lineHeight: 1.35,
            },
            "& .when": {
              display: "block",
              marginTop: "0.15rem",
              color: "var(--muted)",
              fontSize: "0.8125rem",
              fontVariantNumeric: "tabular-nums",
            },
            "& .blurb": {
              display: "-webkit-box",
              marginTop: "0.4rem",
              overflow: "hidden",
              color: "var(--muted)",
              fontSize: "0.875rem",
              lineHeight: 1.5,
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: "3", // a string, or css() appends "px"
            },
            [MOTION_OK]: {
              transition: "translate 140ms ease, box-shadow 140ms ease",
            },
          })}
        >
          <span className="bar">{entry.org ?? entry.title}</span>
          <span className="face">
            {entry.org ? <span className="role">{entry.title}</span> : <Chip>side project</Chip>}
            <span className="when">{formatRange(entry.start, entry.end, entry.current)}</span>
            <span className="blurb">{entry.summary}</span>
          </span>
        </button>
        <EntryWindow entry={entry} dialogId={dialogId} />
      </>
    );
  };
}

function EntryWindow(handle: Handle<{ entry: TimelineEntry; dialogId: string }>) {
  return () => {
    let { entry, dialogId } = handle.props;
    let headingId = `${dialogId}-heading`;
    let formId = `${dialogId}-form`;

    return (
      <dialog
        id={dialogId}
        aria-labelledby={headingId}
        mix={css({
          width: "min(40rem, calc(100vw - 32px))",
          maxHeight: "calc(100dvh - 32px)",
          margin: "auto",
          padding: 0,
          overflow: "auto",
          overscrollBehavior: "contain",
          color: "var(--ink)",
          background: "var(--card)",
          border: "2px solid var(--frame)",
          boxShadow: "6px 6px 0 var(--frame)",
          overflowX: "hidden",
          interpolateSize: "allow-keywords",
          "&::backdrop": { background: "rgb(8 12 20 / 0.55)" },
          "& > .inner": {
            "--pad": "1.5rem",
            padding: "0 var(--bleed, var(--pad)) var(--pad)",
            "@media (max-width: 600px)": { "--pad": "1rem" },
          },
          // Maximized: fill the screen, but keep the text a readable width.
          "&:has(.tb-maximize:checked)": {
            width: "100vw",
            height: "100dvh",
            maxWidth: "100vw",
            maxHeight: "100dvh",
            boxShadow: "none",
            "& > .inner": { "--bleed": "max(var(--pad), (100vw - 46rem) / 2)" },
          },
          "& .when": {
            margin: "0 0 0.75rem",
            color: "var(--muted)",
            fontSize: "0.9375rem",
          },
          "& form": { display: "flex", justifyContent: "flex-end", margin: "1rem 0 0" },
          "& form button": {
            ...bevelRules.raised,
            padding: "0.35rem 1rem",
            color: "var(--ink-on-chrome)",
            fontFamily: PIXEL_FONT,
            fontSize: "0.9375rem",
            cursor: "pointer",
          },
          "& form button:hover": { background: "var(--chrome-hover)" },
          "& form button:active": bevelRules.pressed,
          [MOTION_OK]: {
            transition: "width 260ms ease, height 260ms ease, max-height 260ms ease",
            "&::backdrop": { transition: "background-color 260ms ease" },
            "@starting-style": { "&[open]::backdrop": { background: "transparent" } },
          },
        })}
      >
        <div className="inner">
          {/* Focus starts on the title, so the window opens at the top rather
              than scrolled down to the first link inside. */}
          <TitleBar
            variant="dialog"
            id={headingId}
            label={entry.org ?? entry.title}
            formId={formId}
            autofocus
          >
            {entry.org ?? entry.title}
          </TitleBar>
          <p className="when">
            {entry.org ? `${entry.title} · ` : "Side project · "}
            {formatRange(entry.start, entry.end, entry.current)}
          </p>
          <EntryBody entry={entry} />
          <form method="dialog" id={formId}>
            <button type="submit" data-close>
              Close
            </button>
          </form>
        </div>
      </dialog>
    );
  };
}
