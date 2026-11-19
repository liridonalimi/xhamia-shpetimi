(() => {
  const schedule = document.querySelector('[data-public-jummah]');
  const notices = document.querySelector('[data-public-announcements]');
  const lang = document.documentElement.lang === 'de' ? 'de' : 'sq';

  async function showUpdates() {
    const response = await fetch(`/api/public-updates?lang=${lang}`);
    if (!response.ok) return;
    const { jummah, announcements } = await response.json();
    if (schedule && jummah) {
      const time = schedule.querySelector('time');
      time.dateTime = jummah;
      time.textContent = jummah;
      schedule.hidden = false;
    }
    if (!notices || !Array.isArray(announcements) || !announcements.length) return;
    const list = notices.querySelector('[data-notices-list]');
    for (const { title, body } of announcements) {
      const card = document.createElement('article');
      card.className = 'community-card';
      const heading = document.createElement('h3');
      heading.textContent = title;
      card.append(heading);
      for (const line of body.split(/\r?\n/).filter(line => line.trim())) {
        const paragraph = document.createElement('p');
        paragraph.textContent = line;
        card.append(paragraph);
      }
      list.append(card);
    }
    notices.hidden = false;
  }

  showUpdates().catch(() => {});
})();
