(() => {
  const menuButton = document.querySelector('[data-menu-button]');
  const navigation = document.getElementById('main-navigation');
  const lang = document.documentElement.lang;
  const locale = lang === 'de' ? 'de-DE' : 'sq-AL';
  if (menuButton && navigation) {
    function closeMenu() { menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', menuButton.dataset.open); navigation.classList.remove('is-open'); }
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? menuButton.dataset.close : menuButton.dataset.open);
      navigation.classList.toggle('is-open', open);
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); } });
    navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    window.matchMedia('(min-width: 1080px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  }
  // Use the mosque timezone rather than the visitor's local date.
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const pick = type => parts.find(part => part.type === type).value;
  const today = `${pick('year')}-${pick('month')}-${pick('day')}`;
  let selected = today;
  const dateElements = document.querySelectorAll('[data-prayer-date]');
  function showDate() {
    const date = new Date(`${selected}T12:00:00Z`);
    const monthsSq = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
    const label = lang === 'sq' ? `${date.getUTCDate()} ${monthsSq[date.getUTCMonth()]} ${date.getUTCFullYear()}` : new Intl.DateTimeFormat(locale, { timeZone: 'Europe/Berlin', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    dateElements.forEach(el => { el.textContent = label; el.setAttribute('datetime', selected); });
    document.querySelectorAll('[data-date-reset]').forEach(el => { el.hidden = selected === today; });
  }
  document.querySelectorAll('[data-date-step]').forEach(button => button.addEventListener('click', () => {
    const date = new Date(`${selected}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + Number(button.dataset.dateStep)); selected = date.toISOString().slice(0, 10); showDate();
  }));
  document.querySelectorAll('[data-date-reset]').forEach(button => button.addEventListener('click', () => { selected = today; showDate(); }));
  showDate();
})();
