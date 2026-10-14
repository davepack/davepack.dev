// pointerDrag(): turns pointer events on a handle (a window's title bar) into
// three semantic events, so the component using it only deals in distances:
//
//   app:dragstart   the pointer went down and was captured
//   app:dragmove    it moved; dx and dy are measured from where it started
//   app:dragend     it was released or the drag was cancelled
//
// Mouse and touch go through the same pointer events. Dragging only starts
// on screens at least 700px wide (on phones the windows fill the width, and
// a drag would fight with scrolling), and never from a button or other
// control inside the handle.

import { createMixin, on } from "remix/component";

export const dragStartType = "app:dragstart" as const;
export const dragMoveType = "app:dragmove" as const;
export const dragEndType = "app:dragend" as const;

export class PointerDragEvent extends Event {
  constructor(
    type: string,
    readonly dx = 0,
    readonly dy = 0,
  ) {
    super(type, { bubbles: true });
  }
}

declare global {
  interface HTMLElementEventMap {
    [dragStartType]: PointerDragEvent;
    [dragMoveType]: PointerDragEvent;
    [dragEndType]: PointerDragEvent;
  }
}

export const DRAG_MEDIA = "(min-width: 700px)";
const INTERACTIVE = "button, input, label, a, select, textarea, [popover]";

export const pointerDrag = createMixin<HTMLElement>((handle) => {
  // Aborts when this mixin is disposed. It has to be read here, during
  // setup, to be used later from an event handler.
  let lifetime = handle.signal;

  return () => (
    <handle.element
      mix={on("pointerdown", (event) => {
        let node = event.currentTarget;
        if (event.button !== 0 || !matchMedia(DRAG_MEDIA).matches) return;
        if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return;
        event.preventDefault();

        // Follow the pointer with temporary window listeners rather than
        // pointer capture, which the browser can drop when the page's
        // layout changes under it (as pinning the windows does). They go
        // away when the drag ends or this mixin is disposed.
        let { pointerId, clientX: x, clientY: y } = event;
        let drag = new AbortController();
        lifetime.addEventListener("abort", () => drag.abort(), { signal: drag.signal });
        let end = (e: PointerEvent) => {
          if (e.pointerId !== pointerId) return;
          drag.abort();
          node.dispatchEvent(new PointerDragEvent(dragEndType));
        };
        window.addEventListener(
          "pointermove",
          (e) => {
            if (e.pointerId !== pointerId) return;
            node.dispatchEvent(new PointerDragEvent(dragMoveType, e.clientX - x, e.clientY - y));
          },
          { signal: drag.signal },
        );
        window.addEventListener("pointerup", end, { signal: drag.signal });
        window.addEventListener("pointercancel", end, { signal: drag.signal });
        node.dispatchEvent(new PointerDragEvent(dragStartType));
      })}
    />
  );
});
