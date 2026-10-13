// Skill stickers: each skill is a native <details> whose summary looks like a
// retro push button that stays pressed while open. Opening one reveals its caption in a shared panel under the cloud;
// the `name` attribute keeps only one open at a time in current browsers.

import { css } from "remix/ui";
import { spring } from "remix/ui/animation";

import { formatStat, skillGroups } from "../data/resume.ts";
import {
  MOTION_OK,
  PIXEL_FONT,
  SectionHeading,
  bevelRules,
  windowRules,
} from "./home-primitives.tsx";

const CAPTION_SPACE = "5.5rem";

export function SkillStickers() {
  let groups = skillGroups();
  let firstId = groups[0]?.skills[0]?.id;

  return () => (
    <section
      aria-labelledby="skills-heading"
      mix={css({
        ...windowRules,
        "& .stickers": { position: "relative", paddingBottom: CAPTION_SPACE },
        "& .group": { margin: "0 0 1rem" },
        "& .label": {
          margin: "0 0 0.4rem",
          fontSize: "0.75rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--muted)",
        },
        "& .cloud": {
          listStyle: "none",
          margin: 0,
          padding: "0.2rem 0",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.55rem 0.5rem",
        },
        "& details": { display: "block" },
        "& summary": {
          ...bevelRules.raised,
          listStyle: "none",
          cursor: "pointer",
          display: "inline-block",
          padding: "0.3rem 0.75rem",
          color: "var(--ink-on-chrome)",
          fontFamily: PIXEL_FONT,
          fontSize: "0.9375rem",
          lineHeight: 1.3,
          userSelect: "none",
        },
        "& summary::-webkit-details-marker": { display: "none" },
        "& summary:hover, & summary:focus-visible": { background: "var(--chrome-hover)" },
        "& details[open] > summary": {
          ...bevelRules.pressed,
          translate: "1px 1px",
          background: "var(--title)",
          color: "var(--title-ink)",
        },
        // Captions all sit in the same reserved strip below the cloud.
        "& .cap, & .hint": {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          minHeight: "5rem",
          margin: 0,
          fontSize: "0.9375rem",
          lineHeight: 1.55,
        },
        "& .cap .name": { fontWeight: 600 },
        "& .hint": { color: "var(--muted)" },
        "& .stickers:has(details[open]) .hint": { opacity: 0 },
        [MOTION_OK]: {
          "& summary": {
            transition: spring.transition(["translate"], "snappy"),
          },
          "& .hint": { transition: "opacity 160ms ease" },
          "& details[open] > .cap": { animation: "dp-reveal 260ms ease-out" },
        },
      })}
    >
      <SectionHeading id="skills-heading">Skills</SectionHeading>
      <div className="stickers">
        {groups.map((group) => (
          <div key={group.label} className="group">
            <p className="label">{group.label}</p>
            <ul className="cloud">
              {group.skills.map((skill) => {
                let stat = formatStat(skill);
                return (
                  <li key={skill.id}>
                    <details name="skill" open={skill.id === firstId}>
                      <summary>{skill.name}</summary>
                      <p className="cap">
                        <span className="name" aria-hidden="true">
                          {skill.name}
                          {" · "}
                        </span>
                        {stat ? `${stat}. ` : ""}
                        {skill.summary}
                      </p>
                    </details>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <p className="hint">Select a skill to read more.</p>
      </div>
    </section>
  );
}
