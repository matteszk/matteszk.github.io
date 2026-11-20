// Light/dark toggle for /work and the case studies.
// Follows the system setting. A click overrides it until the system setting
// changes again, or until the visitor toggles back to match the system.
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
  const sysTheme = () => (sys.matches ? 'light' : 'dark');
  function follow() { delete root.dataset.theme; try { localStorage.removeItem('theme'); } catch (e) {} }
  if (btn) btn.addEventListener('click', () => {
    const next = current() === 'light' ? 'dark' : 'light';
    if (next === sysTheme()) follow(); // back in step with the system: follow it again
    else { root.dataset.theme = next; try { localStorage.setItem('theme', next); } catch (e) {} }
    sync();
  });
  // a change in the system setting always wins over an earlier click
  const onSys = () => { follow(); sync(); };
  sys.addEventListener ? sys.addEventListener('change', onSys) : sys.addListener && sys.addListener(onSys);
  sync();
})();
