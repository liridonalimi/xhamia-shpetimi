(() => {
  const email = document.querySelector('[data-session-email]');
  const environment = document.querySelector('[data-environment]');
  const database = document.querySelector('[data-database-status]');
  const status = document.querySelector('[data-session-status]');

  async function loadSession() {
    try {
      const response = await fetch('/admin/api/session', {
        headers: { accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error(`Session returned ${response.status}`);
      const payload = await response.json();
      email.textContent = payload.user.email;
      environment.textContent = payload.environment === 'production' ? 'Production' : 'Preview';
      database.textContent = payload.database === 'ready' ? 'E lidhur' : 'E padisponueshme';
      status.textContent = 'Sesioni është aktiv';
      document.body.dataset.session = 'ready';
    } catch {
      email.textContent = 'Nuk u verifikua';
      database.textContent = 'E padisponueshme';
      status.textContent = 'Sesioni nuk u verifikua';
      document.body.dataset.session = 'error';
    }
  }

  loadSession();
})();
