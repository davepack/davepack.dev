// The title bar of a page window (About, Work, Skills), a client entry. It
// renders on the server like the rest of the page, then hydrates to make the
// window work like one on a Windows 3.1 desktop:
//
// - drag the bar to move the window (screens 700px and wider)
// - click anywhere in the window to bring it to the front
// - the control box (left) opens the window menu: Move, Minimize, Close.
//   Double-clicking it closes the window, as in 3.1.
// - minimize (right) sends the window to the desktop as an icon
//
// The window's content stays server-rendered. The bar finds the window
// around it (the element marked data-window) and applies the desktop
// model's state to it: position, stacking, visibility.

import { clientEntry, css, on, ref } from "remix/component";
import type { Handle } from "remix/component";

import { PIXEL_FONT, titleBarStyles } from "../home-primitives.tsx";
import {
  applyWindow,
  closeWindow,
  growPage,
  keepReachable,
  pinWindows,
  unpinOnNarrowScreens,
} from "./desktop-dom.ts";
import { track } from "./analytics.ts";
import { desktop, type Position } from "./desktop-model.ts";
import { DRAG_MEDIA, dragEndType, dragMoveType, dragStartType, pointerDrag } from "./drag.tsx";

interface WindowTitleBarProps {
  /** Matches the data-window attribute on the window element. */
  windowId: string;
  /** Names the window in control labels ("Minimize Work"). */
  label: string;
  /** Visible title; About's bar has none. */
  title?: string;
  headingId?: string;
}

export const WindowTitleBar = clientEntry(
  "/js/app.js#WindowTitleBar",
  function WindowTitleBar(handle: Handle<WindowTitleBarProps>) {
    let id = handle.props.windowId;
    let menuId = `${id}-window-menu`;
    // The server renders inert boxes; the working controls appear once the
    // browser has taken over, so they never show up without JavaScript.
    let hydrated = false;
    let bar: HTMLElement | null = null;
    let win: HTMLElement | null = null;
    let dragFrom: Position | null = null;
    let moving: Position | null = null; // keyboard Move: where it started

    handle.queueTask(() => {
      desktop.register(id);
      desktop.addEventListener("change", () => win && applyWindow(id, win), {
        signal: handle.signal,
      });
      unpinOnNarrowScreens(handle.signal);
      hydrated = true;
      handle.update();
    });

    function moveTo(position: Position) {
      if (!win) return;
      desktop.moveTo(id, keepReachable(win, position));
      growPage(win);
    }

    function startKeyboardMove() {
      if (!win || !bar) return;
      pinWindows();
      desktop.focus(id);
      moving = desktop.position(id);
      handle.update();
      handle.queueTask(() => bar?.focus());
    }

    function endKeyboardMove(cancel: boolean) {
      if (!moving) return;
      if (cancel) moveTo(moving);
      moving = null;
      handle.update();
    }

    return () => (
      <div
        className="titlebar page-bar"
        tabIndex={moving ? -1 : undefined}
        aria-label={moving ? `Moving ${handle.props.label}: arrow keys, then Enter` : undefined}
        data-moving={moving ? "" : undefined}
        mix={[
          titleBarStyles,
          dragHandleStyles,
          pointerDrag(),
          ref((node, signal) => {
            bar = node;
            win = node.closest<HTMLElement>("[data-window]");
            // Any click or focus inside the window brings it to the front.
            let raise = () => desktop.focus(id);
            win?.addEventListener("pointerdown", raise, { signal });
            win?.addEventListener("focusin", raise, { signal });
          }),
          on(dragStartType, () => {
            pinWindows();
            desktop.focus(id);
            dragFrom = desktop.position(id);
          }),
          on(dragMoveType, (event) => {
            if (dragFrom) moveTo({ x: dragFrom.x + event.dx, y: dragFrom.y + event.dy });
          }),
          on(dragEndType, () => {
            let to = desktop.position(id);
            if (dragFrom && to && (to.x !== dragFrom.x || to.y !== dragFrom.y)) {
              track("window", { label: `${id}:move` });
            }
            dragFrom = null;
          }),
          on("keydown", (event) => {
            if (!moving) return;
            let step = event.shiftKey ? 40 : 10;
            let position = desktop.position(id) ?? { x: 0, y: 0 };
            let moves: Record<string, Position> = {
              ArrowLeft: { x: position.x - step, y: position.y },
              ArrowRight: { x: position.x + step, y: position.y },
              ArrowUp: { x: position.x, y: position.y - step },
              ArrowDown: { x: position.x, y: position.y + step },
            };
            if (moves[event.key]) moveTo(moves[event.key]);
            else if (event.key === "Enter") endKeyboardMove(false);
            else if (event.key === "Escape") endKeyboardMove(true);
            else return;
            event.preventDefault();
          }),
          on("blur", () => endKeyboardMove(false)),
        ]}
      >
        {hydrated ? (
          <WindowMenu
            menuId={menuId}
            label={handle.props.label}
            onMove={startKeyboardMove}
            onClose={() => closeWindow(id)}
          />
        ) : (
          <span className="box menu" aria-hidden="true" />
        )}
        {handle.props.title ? (
          <h2 id={handle.props.headingId}>{handle.props.title}</h2>
        ) : (
          <span className="spacer" />
        )}
        {hydrated ? (
          <button
            type="button"
            className="box min"
            aria-label={`Minimize ${handle.props.label}`}
            mix={on("click", () => closeWindow(id))}
          />
        ) : (
          <span className="box min" aria-hidden="true" />
        )}
      </div>
    );
  },
);

// Where dragging is on, the bar is a handle: a move cursor, and touch drags
// move the window instead of scrolling the page.
const dragHandleStyles = css({
  [`@media ${DRAG_MEDIA}`]: { cursor: "move", touchAction: "none", userSelect: "none" },
});

const menuStyles = css({
  // A popover sits in the top layer; place it under the control box.
  position: "fixed",
  inset: "auto",
  margin: 0,
  minWidth: "9rem",
  padding: "2px",
  color: "var(--ink)",
  background: "var(--card)",
  border: "2px solid var(--frame)",
  boxShadow: "3px 3px 0 var(--frame)",
  fontFamily: PIXEL_FONT,
  fontSize: "0.875rem",
  "& button": {
    display: "block",
    width: "100%",
    padding: "0.3rem 0.75rem",
    border: 0,
    textAlign: "left",
    font: "inherit",
    color: "inherit",
    background: "none",
    cursor: "pointer",
  },
  "& button:hover, & button:focus-visible": {
    outline: "none",
    background: "var(--title)",
    color: "var(--title-ink)",
  },
  "& button:disabled": { color: "var(--muted)", background: "none", cursor: "default" },
  "& hr": { margin: "2px 0", border: 0, borderTop: "2px solid var(--rule)" },
});

// The window menu behind the control box. It's a native popover, so the
// browser handles opening, closing on Escape, and closing on a click outside.
function WindowMenu(
  handle: Handle<{ menuId: string; label: string; onMove: () => void; onClose: () => void }>,
) {
  let menu: HTMLElement | null = null;
  let control: HTMLElement | null = null;

  // Run an item's action with the menu out of the way first.
  let choose = (action: () => void) => () => {
    menu?.hidePopover();
    action();
  };

  return () => {
    let { menuId, label, onMove, onClose } = handle.props;
    let canMove = matchMedia(DRAG_MEDIA).matches;
    return (
      <>
        <button
          type="button"
          className="box menu"
          popovertarget={menuId}
          aria-haspopup="menu"
          aria-label={`${label} window menu`}
          mix={[
            ref((node) => {
              control = node;
            }),
            on("dblclick", choose(onClose)),
          ]}
        />
        <div
          id={menuId}
          popover="auto"
          role="menu"
          aria-label={`${label} window`}
          mix={[
            menuStyles,
            ref((node) => {
              menu = node;
            }),
            on("toggle", (event) => {
              if (event.newState !== "open" || !control || !menu) return;
              let box = control.getBoundingClientRect();
              menu.style.left = `${box.left}px`;
              menu.style.top = `${box.bottom}px`;
              menu.querySelector<HTMLElement>("button:not(:disabled)")?.focus();
            }),
            on("keydown", (event) => {
              // Up and down move between items, as in a menu.
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
              event.preventDefault();
              let items = [...(menu?.querySelectorAll<HTMLElement>("button:not(:disabled)") ?? [])];
              let index = items.indexOf(document.activeElement as HTMLElement);
              let next = event.key === "ArrowDown" ? index + 1 : index - 1;
              items[(next + items.length) % items.length]?.focus();
            }),
          ]}
        >
          <button
            type="button"
            role="menuitem"
            disabled={!canMove}
            mix={on("click", choose(onMove))}
          >
            Move
          </button>
          <button type="button" role="menuitem" mix={on("click", choose(onClose))}>
            Minimize
          </button>
          <hr />
          <button type="button" role="menuitem" mix={on("click", choose(onClose))}>
            Close
          </button>
        </div>
      </>
    );
  };
}
