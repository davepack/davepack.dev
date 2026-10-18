// Interaction events from the page (game plays, skills picked, windows
// opened), written to Workers Analytics Engine. No cookies and no
// identifiers: each event is a name, a short label, an optional number, and
// coarse context (country, wide or narrow screen).
//
// Anyone can POST here, so the input is held to a fixed set of event names
// and short labels; anything else is dropped.

const EVENT_NAMES = [
  "view", // page view; label is the referring host or "direct"
  "game-start",
  "game-over", // value is the distance in meters
  "skill", // a skill filter picked; label is the skill id
  "entry-open", // a job or project window opened; label is the entry id
  "window", // label is "<window>:<action>", e.g. "work:minimize"
  "theme", // label is "light" or "dark"
  "link", // an outbound link followed; label is its host
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export interface SiteEvent {
  name: EventName;
  label: string;
  /** Where it came from, such as "work" or "card" for entry-open. */
  from: string;
  value: number;
  wide: boolean;
}

export const MAX_BODY = 512;
const LABEL = /^[a-z0-9][a-z0-9.:_-]{0,63}$/i;

const text = (value: unknown) => (typeof value === "string" && LABEL.test(value) ? value : "");

/** Parses and validates one event body, or returns null to drop it. */
export function parseEvent(body: string): SiteEvent | null {
  if (body.length === 0 || body.length > MAX_BODY) return null;
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  let { name, label, from, value, wide } = data as Record<string, unknown>;
  if (!EVENT_NAMES.includes(name as EventName)) return null;
  if (label !== undefined && !text(label)) return null;
  let number = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return {
    name: name as EventName,
    label: text(label),
    from: text(from),
    value: Math.max(0, Math.min(number, 1e7)),
    wide: wide === true,
  };
}

interface AnalyticsEngineDataset {
  writeDataPoint(point: { indexes?: string[]; blobs?: string[]; doubles?: number[] }): void;
}

/**
 * One data point per event. Columns, for queries:
 *   index1  event name
 *   blob1   event name   blob2 label   blob3 from   blob4 country   blob5 "wide" | "narrow"
 *   double1 value
 */
export function writeEvent(dataset: AnalyticsEngineDataset, event: SiteEvent, country: string) {
  dataset.writeDataPoint({
    indexes: [event.name],
    blobs: [event.name, event.label, event.from, country, event.wide ? "wide" : "narrow"],
    doubles: [event.value],
  });
}
