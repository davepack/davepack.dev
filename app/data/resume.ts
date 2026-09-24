// Typed, publish-safe view over data/davepack-resume.json.
//
// This is the only module that touches the JSON. It never exposes `profile`
// (contact details live there) and it drops anything the data marks as
// unverified, so the page can only render what Dave has confirmed.

import raw from "../../data/davepack-resume.json" with { type: "json" };

export interface Skill {
  id: string;
  name: string;
  category: string;
  yearsInProduction: number | null;
  firstUsed: string | null;
  current: boolean;
  proficiency: number;
  summary: string;
}

export interface SkillGroup {
  label: string;
  skills: Skill[];
}

export interface Story {
  id: string;
  title: string;
  context: string;
  problem: string;
  action: string;
  result: string;
  takeaway: string;
}

export interface TimelineEntry {
  id: string;
  kind: "job" | "project";
  org: string | null;
  orgUrl: string | null;
  title: string;
  start: string;
  end: string | null;
  current: boolean;
  featured: boolean;
  summary: string;
  highlights: string[];
  skillIds: string[];
  stories: Story[];
}

// Highlights beyond this many stay in the data but off the page. Reorder the
// JSON to choose which ones show.
const MAX_HIGHLIGHTS = 4;

// Coarse clusters for the sticker cloud. Categories not listed fall into the
// first group.
const SKILL_GROUPS: { label: string; categories: string[] }[] = [
  {
    label: "Stack",
    categories: [
      "language",
      "frontend",
      "backend",
      "data",
      "mobile",
      "cloud",
      "testing",
      "desktop",
    ],
  },
  { label: "Practices", categories: ["practice", "ai"] },
  { label: "Leadership & product", categories: ["leadership", "product"] },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// `verify: true` marks values the resume agent inferred but Dave has not
// confirmed. Those stay off the site until the flag is cleared in the JSON.
function isUnverified(entry: object): boolean {
  return "verify" in entry && entry.verify === true;
}

function toSkill(s: (typeof raw.skills)[number]): Skill {
  return {
    id: s.id,
    name: s.name,
    category: s.category,
    yearsInProduction: s.yearsInProduction ?? null,
    firstUsed: s.firstUsed ?? null,
    current: s.current,
    proficiency: s.proficiency,
    summary: s.summary,
  };
}

// Every skill the page may name anywhere (chips inside timeline entries
// included). Historical and non-featured skills are fine here; unverified
// ones are not.
const nameableSkills = new Map<string, Skill>(
  raw.skills.filter((s) => !isUnverified(s)).map((s) => [s.id, toSkill(s)]),
);

// Skills shown in the headline sticker cloud.
const featuredSkills: Skill[] = raw.skills
  .filter((s) => s.featured && !s.legacy && !isUnverified(s))
  .map(toSkill);

const storiesByExperience = new Map<string, Story[]>();
for (let story of raw.stories) {
  let list = storiesByExperience.get(story.experienceId) ?? [];
  list.push({
    id: story.id,
    title: story.title,
    context: story.context,
    problem: story.problem,
    action: story.action,
    result: story.result,
    takeaway: story.takeaway,
  });
  storiesByExperience.set(story.experienceId, list);
}

function publishableSkillIds(skills: { skillId: string }[]): string[] {
  return skills.map((s) => s.skillId).filter((id) => nameableSkills.has(id));
}

// "YYYY-MM" or "YYYY" to a comparable month count.
function monthIndex(date: string): number {
  let [year, month = "1"] = date.split("-");
  return Number(year) * 12 + (Number(month) - 1);
}

const jobs: TimelineEntry[] = raw.experience
  .filter((e) => !isUnverified(e))
  .map((e) => ({
    id: e.id,
    kind: "job" as const,
    org: e.org ?? null,
    orgUrl: e.orgUrl ?? null,
    title: e.title,
    start: e.start,
    end: e.end ?? null,
    current: e.current,
    featured: e.featured,
    summary: e.summary,
    highlights: e.highlights.slice(0, MAX_HIGHLIGHTS),
    skillIds: publishableSkillIds(e.skills),
    stories: storiesByExperience.get(e.id) ?? [],
  }))
  .sort((a, b) => monthIndex(b.start) - monthIndex(a.start));

const projects: TimelineEntry[] = raw.projects
  .filter((p) => p.featured && !isUnverified(p))
  .map((p) => ({
    id: p.id,
    kind: "project" as const,
    org: null,
    orgUrl: p.links?.live ?? p.links?.repo ?? null,
    title: p.name,
    start: p.start,
    end: p.end ?? null,
    current: p.current,
    featured: p.featured,
    summary: p.summary,
    highlights: p.highlights.slice(0, MAX_HIGHLIGHTS),
    skillIds: publishableSkillIds(p.skills),
    stories: [],
  }));

/** Featured skills clustered for the sticker cloud, in JSON order within each group. */
export function skillGroups(): SkillGroup[] {
  let groups = SKILL_GROUPS.map((g) => ({ label: g.label, skills: [] as Skill[] }));
  for (let skill of featuredSkills) {
    let index = SKILL_GROUPS.findIndex((g) => g.categories.includes(skill.category));
    groups[index === -1 ? 0 : index].skills.push(skill);
  }
  return groups.filter((g) => g.skills.length > 0);
}

/** Jobs newest first, then side projects. */
export function timeline(): TimelineEntry[] {
  return [...jobs, ...projects];
}

export function skillName(id: string): string {
  return nameableSkills.get(id)?.name ?? id;
}

function formatDate(date: string): string {
  let [year, month] = date.split("-");
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
}

/** "Jul 2018 – now", "Apr 2015 – Oct 2015", or "2011 – 2015". */
export function formatRange(start: string, end: string | null, current: boolean): string {
  let from = formatDate(start);
  let to = current ? "now" : end ? formatDate(end) : null;
  return to ? `${from} – ${to}` : from;
}

/**
 * "11 years in production · since 2015" for current skills,
 * "1 year in production (2017)" for past ones, or null when nothing is known.
 */
export function formatStat(skill: Skill): string | null {
  let years = skill.yearsInProduction;
  let since = skill.firstUsed;
  let yearsPart = years == null ? null : `${years} ${years === 1 ? "year" : "years"} in production`;

  if (skill.current) {
    let parts = [yearsPart, since ? `since ${since}` : null].filter((p) => p != null);
    return parts.length ? parts.join(" · ") : null;
  }

  if (yearsPart && since) return `${yearsPart} (${since})`;
  return yearsPart ?? since;
}
