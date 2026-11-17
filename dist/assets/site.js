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
  const prayerTimes = [...document.querySelectorAll('[data-prayer-key]')];
  const prayerStatus = document.querySelector('[data-prayer-status]');
  let prayerRequest = 0;
  async function loadPrayerTimes() {
    if (!prayerTimes.length || !prayerStatus) return;
    const requestId = ++prayerRequest;
    const statusTitle = prayerStatus.querySelector('[data-prayer-status-title]');
    const statusDetail = prayerStatus.querySelector('[data-prayer-status-detail]');
    prayerStatus.dataset.state = 'loading';
    statusTitle.textContent = prayerStatus.dataset.loading;
    statusDetail.textContent = prayerStatus.dataset.method;
    prayerTimes.forEach(el => { el.textContent = '—'; el.setAttribute('aria-label', prayerStatus.dataset.loading); });
    try {
      const response = await fetch(`/api/prayer-times?date=${encodeURIComponent(selected)}`, { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`Prayer API returned ${response.status}`);
      const payload = await response.json();
      if (requestId !== prayerRequest) return;
      prayerTimes.forEach(el => {
        const time = payload.timings?.[el.dataset.prayerKey];
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time ?? '')) throw new Error('Incomplete prayer schedule');
        el.textContent = time;
        el.setAttribute('aria-label', `${el.dataset.prayerLabel}: ${time}`);
      });
      prayerStatus.dataset.state = 'ready';
      statusTitle.textContent = prayerStatus.dataset.ready;
      statusDetail.textContent = prayerStatus.dataset.disclaimer;
    } catch {
      if (requestId !== prayerRequest) return;
      prayerStatus.dataset.state = 'error';
      statusTitle.textContent = prayerStatus.dataset.error;
      statusDetail.textContent = prayerStatus.dataset.disclaimer;
    }
  }
  function showDate() {
    const date = new Date(`${selected}T12:00:00Z`);
    const monthsSq = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor'];
    const label = lang === 'sq' ? `${date.getUTCDate()} ${monthsSq[date.getUTCMonth()]} ${date.getUTCFullYear()}` : new Intl.DateTimeFormat(locale, { timeZone: 'Europe/Berlin', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    dateElements.forEach(el => { el.textContent = label; el.setAttribute('datetime', selected); });
    document.querySelectorAll('[data-date-reset]').forEach(el => { el.hidden = selected === today; });
    loadPrayerTimes();
  }
  document.querySelectorAll('[data-date-step]').forEach(button => button.addEventListener('click', () => {
    const date = new Date(`${selected}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + Number(button.dataset.dateStep)); selected = date.toISOString().slice(0, 10); showDate();
  }));
  document.querySelectorAll('[data-date-reset]').forEach(button => button.addEventListener('click', () => { selected = today; showDate(); }));
  showDate();
})();
