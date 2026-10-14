import assert from "node:assert/strict";
import { test } from "node:test";

import { DesktopModel } from "./desktop-model.ts";

function desktopWith(...ids: string[]) {
  let desktop = new DesktopModel();
  for (let id of ids) desktop.register(id);
  return desktop;
}

test("windows start open, unpositioned, and with nothing active", () => {
  let desktop = desktopWith("about", "work");
  assert.equal(desktop.isOpen("about"), true);
  assert.equal(desktop.position("about"), null);
  assert.equal(desktop.active, null);
  assert.equal(desktop.pinned, false);
});

test("focus raises a window above the others and makes it active", () => {
  let desktop = desktopWith("about", "work");
  desktop.focus("about");
  desktop.focus("work");
  assert.ok(desktop.z("work") > desktop.z("about"));
  assert.equal(desktop.active, "work");
});

test("closing lists the window for an icon; reopening brings it to the front", () => {
  let desktop = desktopWith("about", "work", "skills");
  desktop.focus("work");
  desktop.close("work");
  desktop.close("about");
  assert.deepEqual(desktop.closed, ["work", "about"]);
  assert.equal(desktop.active, null);

  desktop.focus("skills");
  desktop.open("work");
  assert.deepEqual(desktop.closed, ["about"]);
  assert.equal(desktop.isOpen("work"), true);
  assert.equal(desktop.active, "work");
  assert.ok(desktop.z("work") > desktop.z("skills"));
});

test("pinning happens once, then windows move freely", () => {
  let desktop = desktopWith("about", "work");
  desktop.pin({ about: { x: 0, y: 0 }, work: { x: 0, y: 400 } });
  desktop.pin({ about: { x: 99, y: 99 } });
  assert.deepEqual(desktop.position("about"), { x: 0, y: 0 });

  desktop.moveTo("work", { x: 120, y: 80 });
  assert.deepEqual(desktop.position("work"), { x: 120, y: 80 });
});

test("unpinning puts every window back in the page's flow", () => {
  let desktop = desktopWith("about", "work");
  desktop.pin({ about: { x: 0, y: 0 }, work: { x: 0, y: 400 } });
  desktop.moveTo("work", { x: 50, y: 50 });
  desktop.unpin();
  assert.equal(desktop.pinned, false);
  assert.equal(desktop.position("work"), null);
  desktop.pin({ about: { x: 1, y: 1 } });
  assert.deepEqual(desktop.position("about"), { x: 1, y: 1 });
});

test("a reopened window only takes a new position once the desktop is pinned", () => {
  let desktop = desktopWith("about");
  desktop.close("about");
  desktop.open("about", { x: 10, y: 10 });
  assert.equal(desktop.position("about"), null);

  desktop.pin({ about: { x: 0, y: 0 } });
  desktop.close("about");
  desktop.open("about", { x: 10, y: 10 });
  assert.deepEqual(desktop.position("about"), { x: 10, y: 10 });
});

test("every change is announced", () => {
  let desktop = desktopWith("about");
  let changes = 0;
  desktop.addEventListener("change", () => changes++);
  desktop.focus("about");
  desktop.close("about");
  desktop.close("about"); // already closed: no change
  desktop.open("about");
  assert.equal(changes, 3);
});
