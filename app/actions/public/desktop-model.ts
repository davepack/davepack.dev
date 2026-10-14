// The desktop's state: which windows are open, where they sit once they've
// been moved, how they stack, and which one is active. Plain data with no DOM,
// shared by every client entry in the bundle (title bars and desktop icons);
// they subscribe to "change" and render or apply what they need from it.
//
// Windows start in the page's normal flow. The first time one is moved, every
// window is "pinned": given an explicit position where it already sits, so
// moving one doesn't reflow the rest.

import { TypedEventTarget } from "remix/component";

export interface Position {
  x: number;
  y: number;
}

interface WindowState {
  open: boolean;
  position: Position | null;
  z: number;
}

export class DesktopModel extends TypedEventTarget<{ change: Event }> {
  #windows = new Map<string, WindowState>();
  // Closed windows, oldest first: the order their icons appear in.
  #closed: string[] = [];
  #topZ = 0;
  #active: string | null = null;
  #pinned = false;

  /** Adds a window the first time a component for it appears. */
  register(id: string): void {
    if (!this.#windows.has(id)) this.#windows.set(id, { open: true, position: null, z: 0 });
  }

  isOpen(id: string): boolean {
    return this.#windows.get(id)?.open ?? false;
  }

  position(id: string): Position | null {
    return this.#windows.get(id)?.position ?? null;
  }

  z(id: string): number {
    return this.#windows.get(id)?.z ?? 0;
  }

  /** The window last brought to the front, or null before any interaction. */
  get active(): string | null {
    return this.#active;
  }

  get pinned(): boolean {
    return this.#pinned;
  }

  get closed(): readonly string[] {
    return this.#closed;
  }

  /** Raises a window to the front and makes it the active one. */
  focus(id: string): void {
    let win = this.#windows.get(id);
    if (!win?.open) return;
    if (this.#active === id && win.z === this.#topZ && win.z > 0) return;
    win.z = ++this.#topZ;
    this.#active = id;
    this.#emit();
  }

  /** Gives every window an explicit position. Only the first call counts. */
  pin(positions: Record<string, Position>): void {
    if (this.#pinned) return;
    this.#pinned = true;
    for (let [id, position] of Object.entries(positions)) {
      let win = this.#windows.get(id);
      if (win) win.position = { ...position };
    }
    this.#emit();
  }

  /** Back to the page's normal flow (a phone-sized screen has no free moving). */
  unpin(): void {
    if (!this.#pinned) return;
    this.#pinned = false;
    for (let win of this.#windows.values()) win.position = null;
    this.#emit();
  }

  moveTo(id: string, position: Position): void {
    let win = this.#windows.get(id);
    if (!win) return;
    win.position = { ...position };
    this.#emit();
  }

  close(id: string): void {
    let win = this.#windows.get(id);
    if (!win?.open) return;
    win.open = false;
    this.#closed.push(id);
    if (this.#active === id) this.#active = null;
    this.#emit();
  }

  /** Reopens a window in front. `position` places it if the desktop is pinned. */
  open(id: string, position?: Position): void {
    let win = this.#windows.get(id);
    if (!win || win.open) return;
    win.open = true;
    if (position && this.#pinned) win.position = { ...position };
    this.#closed = this.#closed.filter((closed) => closed !== id);
    win.z = ++this.#topZ;
    this.#active = id;
    this.#emit();
  }

  #emit(): void {
    this.dispatchEvent(new Event("change"));
  }
}

/** The one desktop on the page, shared by every client entry in the bundle. */
export const desktop = new DesktopModel();
