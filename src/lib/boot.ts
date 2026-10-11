/** Lift the first-load screen in index.html (once), then drop it from the DOM. */
export const hideBoot = () => {
  const el = document.getElementById("boot");
  if (!el || el.hasAttribute("data-done")) return;
  el.setAttribute("data-done", "");
  setTimeout(() => el.remove(), 500);
};
