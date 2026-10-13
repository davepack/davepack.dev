// Motion for the skills section. Picking a skill slides the remaining job and
// project cards into place, and opening a card grows it into its window. The
// section already works without this script (CSS filtering, native dialogs);
// this adds view transitions, a fallback for browsers without invoker
// commands, closing a window by clicking outside it, and the scroll lock.

const section = document.querySelector("[data-skill-cards]");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

// Elements only carry a view-transition-name while they take part in a
// transition. Named elements are lifted above the whole page, so leaving the
// cards named all the time would draw them over an opening window.
const setName = (element, name = "") => {
  element.style.viewTransitionName = name;
};

let generation = 0;

// Run `update` inside a view transition when we can, then `finish` once it
// has played out. A newer transition (another quick click) skips this one,
// and only the newest gets to finish.
function transition(update, finish = () => {}) {
  const id = ++generation;
  const done = () => {
    if (id === generation) finish();
  };
  if (!document.startViewTransition || reduceMotion.matches) {
    update();
    done();
    return;
  }
  const t = document.startViewTransition(update);
  t.ready.catch(() => {});
  t.finished.catch(() => {}).then(done);
}

// Locking page scroll sets overflow: hidden on the root, and Chrome drops every
// fixed element (the ski slope, the controls) from the page for as long as a
// transition runs with it set. So the lock only holds between transitions:
// on once a window has finished opening, off just before it starts closing.
const lockScroll = (locked) => {
  document.documentElement.toggleAttribute("data-window-open", locked);
};

if (section) {
  const cards = [...section.querySelectorAll("button[commandfor]")];

  // ---- Filtering ---------------------------------------------------------

  let current = section.querySelector('input[name="skill"]:checked');

  section.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.name !== "skill") return;
    const previous = current;
    current = input;
    if (!previous || previous === input) return;
    // The browser has already switched radios. Switch back for a moment so
    // the transition can capture the old layout, then switch again inside it.
    previous.checked = true;
    for (const card of cards) setName(card, card.dataset.vt);
    transition(
      () => {
        input.checked = true;
      },
      () => {
        for (const card of cards) setName(card);
      },
    );
  });

  // ---- Windows -----------------------------------------------------------

  const cardFor = (dialog) => section.querySelector(`button[commandfor="${dialog.id}"]`);
  let closing = false;

  // The card and its window share one name, handed from one to the other
  // inside the transition; that hand-off is what makes the card grow.
  function open(card, dialog) {
    for (const other of cards) setName(other);
    setName(card, card.dataset.vt);
    transition(
      () => {
        setName(card);
        setName(dialog, card.dataset.vt);
        dialog.showModal();
      },
      () => {
        setName(dialog);
        if (dialog.open) lockScroll(true);
      },
    );
  }

  function close(dialog) {
    const card = cardFor(dialog);
    closing = true;
    lockScroll(false);
    if (card) setName(dialog, card.dataset.vt);
    transition(
      () => {
        dialog.close();
        setName(dialog);
        if (card) setName(card, card.dataset.vt);
      },
      () => {
        closing = false;
        if (card) setName(card);
      },
    );
  }

  section.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const card = target.closest("button[commandfor]");
    if (card) {
      const dialog = document.getElementById(card.getAttribute("commandfor"));
      if (dialog instanceof HTMLDialogElement && !dialog.open) {
        event.preventDefault();
        open(card, dialog);
      }
      return;
    }

    const closeButton = target.closest("[data-close]");
    if (closeButton) {
      event.preventDefault();
      close(closeButton.closest("dialog"));
      return;
    }

    // A click on the dialog element itself, rather than its contents, landed
    // on the backdrop.
    if (target instanceof HTMLDialogElement && target.open) close(target);
  });

  for (const dialog of section.querySelectorAll("dialog")) {
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close(dialog);
    });
    // If it closed some other way, still release the page. Either way, the
    // window opens at its normal size next time.
    dialog.addEventListener("close", () => {
      if (!closing) lockScroll(false);
      const maximize = dialog.querySelector(".tb-maximize");
      if (maximize) maximize.checked = false;
    });
  }
}
