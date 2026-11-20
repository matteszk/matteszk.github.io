// Light/dark toggle for /work and the case studies.
// Default follows the system setting; a click saves the visitor's choice.
// Fires a "themechange" event on document so the 3D hero can relight itself.
(function () {
  const root = document.documentElement, sys = matchMedia('(prefers-color-scheme: light)');
  const current = () => root.dataset.theme || (sys.matches ? 'light' : 'dark');
  const btn = document.querySelector('.theme-btn');
  function sync() {
    const light = current() === 'light';
    if (btn) {
      btn.textContent = light ? '☾' : '☀';
      btn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
      btn.title = btn.getAttribute('aria-label');
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = light ? '#e9e2d1' : '#1c1820';
    document.dispatchEvent(new CustomEvent('themechange', { detail: current() }));
  }
  window.currentTheme = current;
  if (btn) btn.addEventListener('click', () => {
    const next = current() === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
  sys.addEventListener && sys.addEventListener('change', () => { if (!root.dataset.theme) sync(); });
  sync();
})();
