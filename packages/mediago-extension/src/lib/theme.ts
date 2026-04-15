/**
 * Toggle the `dark` class on <html> to match the OS preference. Called
 * once at popup / options mount; re-evaluated on `prefers-color-scheme`
 * media query changes so the surface stays in sync while open.
 */
export function applySystemTheme(): void {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => {
    document.documentElement.classList.toggle("dark", query.matches);
  };
  sync();
  query.addEventListener("change", sync);
}
