(() => {
  const schedule = document.querySelector('[data-public-jummah]');
  const notices = document.querySelector('[data-public-announcements]');
  const lang = document.documentElement.lang === 'de' ? 'de' : 'sq';
  const full = notices?.dataset.publicAnnouncements === 'full';
  const status = notices?.querySelector('[data-notices-status]');
  const more = notices?.querySelector('[data-notices-more]');
  let page = 1;

  async function showUpdates() {
    const response = await fetch(`/api/public-updates?lang=${lang}${full ? `&page=${page}` : ''}`);
    if (!response.ok) throw new Error('updates_unavailable');
    const { jummah, announcements, hasMore } = await response.json();
    if (schedule && jummah) {
      const time = schedule.querySelector('time');
      time.dateTime = jummah;
      time.textContent = jummah;
      schedule.hidden = false;
    }
    if (!notices || !Array.isArray(announcements)) return;
    if (full) {
      status.textContent = page === 1 && !announcements.length ? status.dataset.empty : '';
      more.hidden = !hasMore;
      page += 1;
    } else if (!announcements.length) return;
    const list = notices.querySelector('[data-notices-list]');
    for (const { title, body } of full ? announcements : announcements.slice(0, 2)) {
      const card = document.createElement('article');
      card.className = 'public-notice';
      const heading = document.createElement(full ? 'h2' : 'h3');
      heading.textContent = title;
      card.append(heading);
      const summary = body.trim().replace(/\s+/g, ' ');
      const excerpt = summary.length > 180 ? `${summary.slice(0, 177).trimEnd()}…` : summary;
      const content = full ? body : excerpt;
      for (const line of content.split(/\r?\n/).filter(line => line.trim())) {
        const paragraph = document.createElement('p');
        paragraph.textContent = line;
        card.append(paragraph);
      }
      list.append(card);
    }
    notices.hidden = false;
  }

  async function load() {
    if (status) status.textContent = status.dataset.loading;
    if (more) more.disabled = true;
    try {
      await showUpdates();
    } catch {
      if (status) status.textContent = status.dataset.error;
      if (more) more.hidden = false;
    } finally {
      if (more) more.disabled = false;
    }
  }

  more?.addEventListener('click', load);
  load();
})();
