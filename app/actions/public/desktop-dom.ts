// The desktop's DOM work that no single component owns: finding windows on
// the page, pinning them when the first one moves, keeping them reachable,
// and the view transitions between a window and its desktop icon.
//
// Everything here runs in the browser only, from event handlers and tasks.

import { track } from "./analytics.ts";
import { desktop, type Position } from "./desktop-model.ts";
import { DRAG_MEDIA } from "./drag.tsx";

export const windowElement = (id: string) =>
  document.querySelector<HTMLElement>(`[data-window="${id}"]`);
const iconElement = (id: string) => document.querySelector<HTMLElement>(`[data-icon="${id}"]`);
const page = () => document.querySelector<HTMLElement>(".page");

// The Remix runtime's flush, set by entry.ts: applies pending component
// updates synchronously, so a view transition can capture the new state.
let flush = () => {};
export function setFlush(fn: () => void) {
  flush = fn;
}

/** Applies the model's state for one window to its element. */
export function applyWindow(id: string, el: HTMLElement) {
  el.style.display = desktop.isOpen(id) ? "" : "none";
  el.toggleAttribute("data-inactive", desktop.active !== null && desktop.active !== id);
  el.style.zIndex = desktop.z(id) ? String(desktop.z(id)) : "";
  let position = desktop.position(id);
  if (!position) return;
  el.style.position = "absolute";
  el.style.margin = "0";
  el.style.left = `${position.x}px`;
  el.style.top = `${position.y}px`;
  if (!el.style.width) el.style.width = `${page()?.clientWidth ?? el.offsetWidth}px`;
}

/**
 * The first time a window moves, give every window on the page an explicit
 * position where it already sits, so moving one doesn't reflow the others.
 */
export function pinWindows() {
  let container = page();
  if (desktop.pinned || !container) return;
  let box = container.getBoundingClientRect();
  // Measure everything before changing anything.
  let measured = [...container.children]
    .filter((el): el is HTMLElement => el instanceof HTMLElement)
    .filter((el) => getComputedStyle(el).position !== "fixed")
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 0);
  container.style.height = `${container.offsetHeight}px`;

  let positions: Record<string, Position> = {};
  for (let { el, rect } of measured) {
    let position = { x: rect.left - box.left, y: rect.top - box.top };
    el.style.width = `${rect.width}px`;
    let id = el.dataset.window;
    if (id) {
      positions[id] = position;
    } else {
      // Not a window (the footer): pinned in place, but it never moves.
      Object.assign(el.style, {
        position: "absolute",
        margin: "0",
        left: `${position.x}px`,
        top: `${position.y}px`,
      });
    }
  }
  desktop.pin(positions);
}

/** Keeps at least a corner of the title bar on screen and below the page top. */
export function keepReachable(el: HTMLElement, position: Position): Position {
  let box = page()?.getBoundingClientRect();
  if (!box) return position;
  let grab = 80;
  let x = Math.min(
    Math.max(position.x, grab - el.offsetWidth - box.left),
    innerWidth - grab - box.left,
  );
  return { x, y: Math.max(position.y, 0) };
}

/** Lets the page scroll as far as the lowest window. */
export function growPage(el: HTMLElement) {
  let container = page();
  if (!container) return;
  let needed = el.offsetTop + el.offsetHeight + 48;
  if (needed > container.offsetHeight) container.style.height = `${needed}px`;
}

/** Where a reopened window lands once the desktop is pinned: near the top of the view. */
function reopenPosition(): Position {
  let box = page()?.getBoundingClientRect();
  let cascade = 24 * (desktop.closed.length % 4);
  return { x: cascade, y: Math.max(0, (box ? -box.top : 0) + 48 + cascade) };
}

const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function transition(update: () => void, finish: () => void) {
  if (!document.startViewTransition || reduceMotion()) {
    update();
    finish();
    return;
  }
  let t = document.startViewTransition(update);
  t.ready.catch(() => {});
  t.finished.catch(() => {}).then(finish);
}

// A window and its icon share one view-transition name, handed from one to
// the other inside the transition: the window shrinks into its icon, and the
// icon grows back into the window.
const nameFor = (id: string) => `window-${id}`;

export function closeWindow(id: string) {
  let el = windowElement(id);
  if (!el || !desktop.isOpen(id)) return;
  track("window", { label: `${id}:minimize` });
  el.style.viewTransitionName = nameFor(id);
  transition(
    () => {
      el.style.viewTransitionName = "";
      desktop.close(id);
      flush();
      let icon = iconElement(id);
      if (icon) {
        icon.style.viewTransitionName = nameFor(id);
        icon.focus({ preventScroll: true });
      }
    },
    () => {
      let icon = iconElement(id);
      if (icon) icon.style.viewTransitionName = "";
    },
  );
}

export function openWindow(id: string) {
  let icon = iconElement(id);
  if (desktop.isOpen(id)) return;
  track("window", { label: `${id}:open` });
  if (icon) icon.style.viewTransitionName = nameFor(id);
  transition(
    () => {
      if (icon) icon.style.viewTransitionName = "";
      desktop.open(id, desktop.pinned ? reopenPosition() : undefined);
      flush();
      let el = windowElement(id);
      if (!el) return;
      el.style.viewTransitionName = nameFor(id);
      el.querySelector<HTMLElement>(".titlebar button")?.focus({ preventScroll: true });
    },
    () => {
      let el = windowElement(id);
      if (!el) return;
      el.style.viewTransitionName = "";
      // In the page's flow (always, on a phone) it may have reopened off screen.
      if (!desktop.pinned) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    },
  );
}

/** Below the drag breakpoint, windows go back to the page's flow. */
export function unpinOnNarrowScreens(signal: AbortSignal) {
  let wide = matchMedia(DRAG_MEDIA);
  wide.addEventListener(
    "change",
    () => {
      if (wide.matches || !desktop.pinned) return;
      let container = page();
      if (!container) return;
      container.style.height = "";
      for (let el of container.children) {
        if (!(el instanceof HTMLElement)) continue;
        for (let prop of ["position", "margin", "left", "top", "width"] as const)
          el.style[prop] = "";
      }
      desktop.unpin();
    },
    { signal },
  );
}
