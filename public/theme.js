// Remembers the theme switcher's choice in a cookie so the server can render
// the same theme on the next visit. Switching itself is pure CSS.

const YEAR = 60 * 60 * 24 * 365;

document.addEventListener("change", (event) => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.name !== "theme") return;
  document.cookie =
    input.value === "system"
      ? "theme=; Path=/; Max-Age=0; SameSite=Lax"
      : `theme=${input.value}; Path=/; Max-Age=${YEAR}; SameSite=Lax`;
});
