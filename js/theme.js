/* ==========================================================================
   theme.js — Light / Dark / System theme management
   ========================================================================== */
const THEME = (() => {
  const STORAGE_KEY = 'vgt_theme';
  let currentMode = localStorage.getItem(STORAGE_KEY) || 'system';
  const mq = window.matchMedia('(prefers-color-scheme: dark)');

  function resolvedTheme() {
    if (currentMode === 'system') return mq.matches ? 'dark' : 'light';
    return currentMode;
  }

  function apply() {
    const resolved = resolvedTheme();
    document.documentElement.setAttribute('data-theme', resolved);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? '#131319' : '#3A4AFF');
    document.querySelectorAll('[data-theme-btn]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.theme === currentMode);
    });
    window.dispatchEvent(new CustomEvent('themechange', { detail: resolved }));
  }

  function setMode(mode) {
    currentMode = mode;
    localStorage.setItem(STORAGE_KEY, mode);
    apply();
  }

  function getMode() { return currentMode; }

  mq.addEventListener('change', () => { if (currentMode === 'system') apply(); });

  apply();

  return { setMode, getMode, apply, resolvedTheme };
})();
