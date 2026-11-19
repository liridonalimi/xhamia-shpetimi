(() => {
  const email = document.querySelector('[data-session-email]');
  const environment = document.querySelector('[data-environment]');
  const database = document.querySelector('[data-database-status]');
  const status = document.querySelector('[data-session-status]');

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: { accept: 'application/json', ...(options.headers ?? {}) },
    });
    const payload = await response.json().catch(() => ({ error: 'invalid_response' }));
    if (!response.ok) {
      const error = new Error(payload.error ?? `HTTP ${response.status}`);
      error.code = payload.error;
      error.field = payload.field;
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function loadSession() {
    try {
      const payload = await api('/admin/api/session');
      if (email) email.textContent = payload.user.email;
      if (environment) environment.textContent = payload.environment === 'production' ? 'Production' : 'Preview';
      if (database) database.textContent = payload.database === 'ready' ? 'E lidhur' : 'E padisponueshme';
      if (status) status.textContent = 'Sesioni është aktiv';
      document.body.dataset.session = 'ready';
      return payload;
    } catch {
      if (email) email.textContent = 'Nuk u verifikua';
      if (database) database.textContent = 'E padisponueshme';
      if (status) status.textContent = 'Sesioni nuk u verifikua';
      document.body.dataset.session = 'error';
      throw new Error('session_unavailable');
    }
  }

  function initializeAnnouncements() {
    const root = document.querySelector('[data-announcements]');
    if (!root) return;
    const form = root.querySelector('[data-announcement-form]');
    const list = root.querySelector('[data-announcement-list]');
    const filter = root.querySelector('[data-status-filter]');
    const heading = root.querySelector('[data-editor-heading]');
    const message = document.querySelector('[data-announcement-message]');
    const newButton = root.querySelector('[data-new-announcement]');
    const saveButton = root.querySelector('[data-save-announcement]');
    const publishButton = root.querySelector('[data-publish-announcement]');
    const archiveButton = root.querySelector('[data-archive-announcement]');
    const editableFields = [...form.querySelectorAll('input:not([type=hidden]), textarea')];
    let items = [];
    let selected = null;

    const statusLabels = { draft: 'Draft', published: 'Publikuar', archived: 'Arkivuar' };
    const errorMessages = {
      required: 'Plotëso të gjitha fushat e detyrueshme.',
      too_long: 'Njëra nga fushat është tepër e gjatë.',
      invalid_timestamp: 'Kontrollo datën dhe orën.',
      invalid_window: 'Koha e përfundimit duhet të jetë pas kohës së fillimit.',
      not_draft: 'Vetëm draftet mund të redaktohen ose publikohen.',
      already_archived: 'Ky njoftim është arkivuar tashmë.',
      invalid_origin: 'Kërkesa u refuzua për arsye sigurie. Ringarko faqen.',
      database_error: 'Databaza nuk e përfundoi veprimin. Provo përsëri.',
    };

    function showMessage(text, kind = 'success') {
      message.textContent = text;
      message.dataset.kind = kind;
      message.hidden = false;
      message.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function clearMessage() {
      message.hidden = true;
      message.textContent = '';
      delete message.dataset.kind;
    }

    function localInputValue(value) {
      if (!value) return '';
      const date = new Date(value);
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    }

    function isoValue(value) {
      return value ? new Date(value).toISOString() : null;
    }

    function formatDate(value) {
      if (!value) return 'Pa datë';
      return new Intl.DateTimeFormat('sq-AL', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin',
      }).format(new Date(value));
    }

    function setBusy(busy) {
      for (const button of [saveButton, publishButton, archiveButton, newButton]) button.disabled = busy;
      form.setAttribute('aria-busy', String(busy));
    }

    function applyEditorState(item = null) {
      selected = item;
      form.reset();
      form.elements.id.value = item?.id ?? '';
      form.elements.title_sq.value = item?.title_sq ?? '';
      form.elements.title_de.value = item?.title_de ?? '';
      form.elements.body_sq.value = item?.body_sq ?? '';
      form.elements.body_de.value = item?.body_de ?? '';
      form.elements.starts_at.value = localInputValue(item?.starts_at);
      form.elements.ends_at.value = localInputValue(item?.ends_at);
      const editable = !item || item.status === 'draft';
      for (const field of editableFields) field.disabled = !editable;
      saveButton.hidden = !editable;
      publishButton.hidden = !item || item.status !== 'draft';
      archiveButton.hidden = !item || item.status === 'archived';
      newButton.hidden = !item;
      heading.textContent = !item
        ? 'Njoftim i ri'
        : item.status === 'draft'
          ? 'Redakto draftin'
          : item.status === 'published'
            ? 'Njoftim i publikuar'
            : 'Njoftim i arkivuar';
      renderList();
    }

    function renderList() {
      list.replaceChildren();
      if (items.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-state';
        empty.textContent = 'Nuk ka njoftime në këtë filtër.';
        list.append(empty);
        return;
      }
      for (const item of items) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'announcement-card';
        button.dataset.announcementId = item.id;
        if (selected?.id === item.id) button.setAttribute('aria-current', 'true');
        const top = document.createElement('span');
        top.className = 'announcement-card-top';
        const badge = document.createElement('span');
        badge.className = 'status-badge';
        badge.dataset.status = item.status;
        badge.textContent = statusLabels[item.status] ?? item.status;
        const time = document.createElement('time');
        time.dateTime = item.updated_at;
        time.textContent = formatDate(item.updated_at);
        const title = document.createElement('strong');
        title.textContent = item.title_sq;
        const excerpt = document.createElement('p');
        excerpt.textContent = item.body_sq;
        top.append(badge, time);
        button.append(top, title, excerpt);
        button.addEventListener('click', () => {
          clearMessage();
          applyEditorState(item);
          heading.scrollIntoView({ block: 'nearest' });
        });
        list.append(button);
      }
    }

    async function loadAnnouncements(preferredId) {
      list.setAttribute('aria-busy', 'true');
      try {
        const query = filter.value ? `?status=${encodeURIComponent(filter.value)}` : '';
        const payload = await api(`/admin/api/announcements${query}`);
        items = payload.items;
        const next = preferredId ? items.find(item => item.id === preferredId) : null;
        if (next) applyEditorState(next);
        else if (selected && !items.some(item => item.id === selected.id)) applyEditorState(null);
        else renderList();
      } finally {
        list.removeAttribute('aria-busy');
      }
    }

    function formPayload() {
      return {
        title_sq: form.elements.title_sq.value,
        title_de: form.elements.title_de.value,
        body_sq: form.elements.body_sq.value,
        body_de: form.elements.body_de.value,
        starts_at: isoValue(form.elements.starts_at.value),
        ends_at: isoValue(form.elements.ends_at.value),
      };
    }

    form.addEventListener('submit', async event => {
      event.preventDefault();
      clearMessage();
      if (!form.reportValidity()) return;
      setBusy(true);
      try {
        const id = form.elements.id.value;
        const payload = await api(id ? `/admin/api/announcements/${encodeURIComponent(id)}` : '/admin/api/announcements', {
          method: id ? 'PUT' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(formPayload()),
        });
        await loadAnnouncements(payload.item.id);
        showMessage(id ? 'Drafti u përditësua me sukses.' : 'Drafti u krijua me sukses.');
      } catch (error) {
        showMessage(errorMessages[error.code] ?? 'Drafti nuk u ruajt. Provo përsëri.', 'error');
        if (error.field && form.elements[error.field]) form.elements[error.field].focus();
      } finally {
        setBusy(false);
      }
    });

    publishButton.addEventListener('click', async () => {
      if (!selected || !window.confirm('Ta publikojmë këtë njoftim? Pas publikimit nuk mund të redaktohet.')) return;
      clearMessage();
      setBusy(true);
      try {
        const payload = await api(`/admin/api/announcements/${encodeURIComponent(selected.id)}/publish`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
        });
        await loadAnnouncements(payload.item.id);
        showMessage('Njoftimi u publikua me sukses.');
      } catch (error) {
        showMessage(errorMessages[error.code] ?? 'Njoftimi nuk u publikua. Provo përsëri.', 'error');
      } finally {
        setBusy(false);
      }
    });

    archiveButton.addEventListener('click', async () => {
      if (!selected || !window.confirm('Ta arkivojmë këtë njoftim?')) return;
      clearMessage();
      setBusy(true);
      try {
        const payload = await api(`/admin/api/announcements/${encodeURIComponent(selected.id)}/archive`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
        });
        await loadAnnouncements(payload.item.id);
        showMessage('Njoftimi u arkivua me sukses.');
      } catch (error) {
        showMessage(errorMessages[error.code] ?? 'Njoftimi nuk u arkivua. Provo përsëri.', 'error');
      } finally {
        setBusy(false);
      }
    });

    newButton.addEventListener('click', () => {
      clearMessage();
      applyEditorState(null);
      form.elements.title_sq.focus();
    });
    filter.addEventListener('change', () => loadAnnouncements().catch(() => {
      showMessage('Lista e njoftimeve nuk u ngarkua.', 'error');
    }));

    loadAnnouncements().catch(() => showMessage('Lista e njoftimeve nuk u ngarkua.', 'error'));
  }

  async function initializeJummah() {
    const form = document.querySelector('[data-jummah-form]');
    if (!form) return;
    const fieldset = form.querySelector('fieldset');
    const field = form.elements.time;
    const feedback = form.querySelector('[data-jummah-status]');
    const path = '/admin/api/jummah';
    try {
      const { time } = await api(path);
      field.value = time;
      feedback.textContent = `Orari i ruajtur: ${time}`;
    } catch {
      feedback.textContent = 'Orari nuk u ngarkua. Ringarko faqen.';
      return;
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (fieldset.disabled) return;
      const time = field.value;
      fieldset.disabled = true;
      try {
        await api(path, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ time }),
        });
        feedback.textContent = `Orari u ruajt: ${time}`;
      } catch {
        feedback.textContent = 'Ruajtja nuk u konfirmua. Provo përsëri.';
      } finally {
        fieldset.disabled = false;
      }
    });
    fieldset.disabled = false;
  }

  function initializeAuditLog() {
    const list = document.querySelector('[data-audit-entries]');
    if (!list) return;
    const refresh = document.querySelector('[data-audit-refresh]');
    const status = document.querySelector('[data-audit-status]');
    const date = new Intl.DateTimeFormat('sq-AL', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin',
    });
    const actions = { create: 'Krijim', update: 'Përditësim', publish: 'Publikim', archive: 'Arkivim' };
    const entities = { announcement: 'Njoftim', prayer_override: 'Orar', site_setting: 'Cilësim' };

    async function load() {
      refresh.disabled = true;
      status.textContent = 'Duke ngarkuar historikun…';
      try {
        const { items } = await api('/admin/api/audit-log');
        list.replaceChildren(...items.map(item => {
          const row = document.createElement('li');
          const title = document.createElement('strong');
          title.textContent = `${actions[item.action] ?? item.action} · ${entities[item.entity_type] ?? item.entity_type}`;
          const details = document.createElement('span');
          const reference = item.entity_id === 'jummah_time' ? 'Orari i xhumasë' : item.entity_id;
          details.textContent = `${date.format(new Date(item.created_at))} · ${item.actor} · ${reference}`;
          row.append(title, details);
          return row;
        }));
        list.hidden = !items.length;
        status.textContent = items.length ? `Veprime të shfaqura: ${items.length}` : 'Nuk ka ende veprime.';
      } catch {
        list.hidden = true;
        status.textContent = 'Historiku nuk u ngarkua. Provo ta rifreskosh.';
      } finally {
        refresh.disabled = false;
      }
    }

    refresh.addEventListener('click', load);
    load();
  }

  loadSession().then(() => {
    initializeAnnouncements();
    initializeAuditLog();
    return initializeJummah();
  }).catch(() => {
    const feedback = document.querySelector('[data-jummah-status]');
    if (feedback) feedback.textContent = 'Sesioni nuk u verifikua. Ringarko faqen.';
    const audit = document.querySelector('[data-audit-status]');
    if (audit) audit.textContent = 'Sesioni nuk u verifikua. Ringarko faqen.';
  });
})();
