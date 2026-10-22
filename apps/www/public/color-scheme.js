// Applies the reader's light/dark choice before the first paint (no flash). A file, not an inline script, so every
// page shares one CSP. Set by components/site/theme-switch.tsx.
try {
  var scheme = localStorage.getItem("aedis-ui-color-scheme");
  if (scheme === "light" || scheme === "dark") document.documentElement.setAttribute("data-theme", scheme);
} catch (e) {}
