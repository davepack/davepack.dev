// Remembers the theme switcher's choice in a cookie so the server can render
// the same theme on the next visit. Switching itself is pure CSS.

const YEAR = 60 * 60 * 24 * 365;

// Analytics: picked up by app/actions/public/analytics.ts, if it's loaded.
const track = (name, fields = {}) =>
  dispatchEvent(new CustomEvent("dp:track", { detail: { name, ...fields } }));

document.addEventListener("change", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.name !== "theme") return;
  document.cookie = `theme=${input.value}; Path=/; Max-Age=${YEAR}; SameSite=Lax`;
  track("theme", { label: input.value });
});
