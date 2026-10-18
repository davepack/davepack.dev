import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_BODY, parseEvent } from "./events.ts";

test("accepts a known event and keeps only what it needs", () => {
  assert.deepEqual(
    parseEvent(JSON.stringify({ name: "game-over", value: 1264, wide: true, extra: "x" })),
    { name: "game-over", label: "", from: "", value: 1264, wide: true },
  );
  assert.deepEqual(
    parseEvent(JSON.stringify({ name: "entry-open", label: "kroger", from: "work" })),
    { name: "entry-open", label: "kroger", from: "work", value: 0, wide: false },
  );
});

test("drops unknown names, bad labels, and junk", () => {
  assert.equal(parseEvent(JSON.stringify({ name: "purchase" })), null);
  assert.equal(parseEvent(JSON.stringify({ name: "skill", label: "<script>" })), null);
  assert.equal(parseEvent(JSON.stringify({ name: "skill", label: "x".repeat(65) })), null);
  assert.equal(parseEvent("not json"), null);
  assert.equal(parseEvent("[]"), null);
  assert.equal(parseEvent(""), null);
  assert.equal(parseEvent(" ".repeat(MAX_BODY + 1)), null);
});

test("clamps values and ignores a bad source", () => {
  let event = parseEvent(JSON.stringify({ name: "game-over", value: -5, from: "a b" }));
  assert.equal(event?.value, 0);
  assert.equal(event?.from, "");
  assert.equal(parseEvent(JSON.stringify({ name: "game-over", value: 1e12 }))?.value, 1e7);
  assert.equal(parseEvent(JSON.stringify({ name: "game-over", value: "9" }))?.value, 0);
});
