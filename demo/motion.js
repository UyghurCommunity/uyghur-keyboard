// Decorative motion is independent of the editor. No user value is changed.
const sculpture = document.getElementById('key-sculpture');
const toggle = document.getElementById('key-motion-toggle');
if (sculpture && toggle) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  let inView = true;
  const activeReveals = new Set();
  const seen = new WeakSet();
  const pageEnabled = () => !userPaused && !preference.matches && !document.hidden;
  function sync() {
    const enabled = pageEnabled();
    document.body.dataset.pageMotion = enabled ? 'playing' : 'paused';
    sculpture.dataset.motion = enabled && inView ? 'playing' : 'paused';
    toggle.disabled = preference.matches;
    toggle.setAttribute('aria-pressed', String(userPaused || preference.matches));
    toggle.setAttribute('aria-label', preference.matches ? 'سىستېمىدا ھەرىكەتنى ئازايتىش ئېچىلغان' : userPaused ? 'ھەرپلەر ھەرىكىتىنى قوزغىتىش' : 'ھەرپلەر ھەرىكىتىنى توختىتىش');
    toggle.querySelector('span').textContent = userPaused || preference.matches ? '▷' : 'Ⅱ';
    if (!enabled) {
      activeReveals.forEach((element) => element.classList.remove('motion-enter'));
      activeReveals.clear();
    }
  }
  toggle.addEventListener('click', () => { if (!preference.matches) { userPaused = !userPaused; sync(); } });
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { threshold: 0.05 }).observe(sculpture);
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        target.dataset.viewport = isIntersecting ? 'inside' : 'outside';
        if (!isIntersecting || seen.has(target)) return;
        seen.add(target);
        if (!pageEnabled()) return;
        target.classList.add('motion-enter');
        activeReveals.add(target);
        target.addEventListener('animationend', () => { target.classList.remove('motion-enter'); activeReveals.delete(target); }, { once: true });
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.section-top, .code-card, .component-demo > div:first-child').forEach((element) => reveal.observe(element));
  } else {
    const checkView = () => { const bounds = sculpture.getBoundingClientRect(); inView = bounds.bottom > 0 && bounds.top < innerHeight; sync(); };
    window.addEventListener('scroll', checkView, { passive: true });
    window.addEventListener('resize', checkView, { passive: true });
    checkView();
  }
  function typingSignal(event) {
    if (sculpture.dataset.motion !== 'playing' || event.isComposing) return;
    const inserted = typeof event.data === 'string' ? event.data : '';
    sculpture.querySelectorAll('[data-letter]').forEach((key) => { key.dataset.hot = String(inserted.includes(key.dataset.letter)); });
    sculpture.dataset.stroke = sculpture.dataset.stroke === 'a' ? 'b' : 'a';
  }
  document.getElementById('message')?.addEventListener('input', typingSignal);
  document.getElementById('component-text')?.addEventListener('input', typingSignal);
  sync();
}
