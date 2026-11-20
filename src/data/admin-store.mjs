const announcementStatuses = new Set(['draft', 'published', 'archived']);
const timeFields = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jummah_1', 'jummah_2'];

export class DataValidationError extends Error {
  constructor(code, field) {
    super(code);
    this.name = 'DataValidationError';
    this.code = code;
    this.field = field;
  }
}

function requiredText(value, field, maxLength) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new DataValidationError('required', field);
  if (text.length > maxLength) throw new DataValidationError('too_long', field);
  return text;
}

function optionalText(value, field, maxLength) {
  if (value === undefined || value === null || value === '') return null;
  const text = requiredText(value, field, maxLength);
  return text;
}

function timestamp(value, field) {
  const text = typeof value === 'string' ? value : '';
  const parsed = new Date(text);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(text)
    || Number.isNaN(parsed.valueOf())
    || parsed.toISOString() !== text) {
    throw new DataValidationError('invalid_timestamp', field);
  }
  return text;
}

function currentTimestamp(value) {
  return timestamp(value ?? new Date().toISOString(), 'now');
}

function actorEmail(value) {
  const email = requiredText(value, 'actor', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DataValidationError('invalid_email', 'actor');
  return email;
}

function serviceDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) throw new DataValidationError('invalid_date', 'service_date');
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new DataValidationError('invalid_date', 'service_date');
  }
  return value;
}

function prayerTime(value, field) {
  if (value === undefined || value === null || value === '') return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new DataValidationError('invalid_time', field);
  return value;
}

function positiveInteger(value, field, maximum) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > maximum) {
    throw new DataValidationError('invalid_number', field);
  }
  return number;
}

function rows(result) {
  return result?.results ?? [];
}

function auditStatement(db, { actor, action, entityType, entityId, fields, now }) {
  return db.prepare(`
    INSERT INTO audit_log (actor, action, entity_type, entity_id, summary_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(actor, action, entityType, entityId, JSON.stringify({ fields }), now);
}

export function createAdminStore(db) {
  if (!db || typeof db.prepare !== 'function' || typeof db.batch !== 'function') {
    throw new TypeError('A D1-compatible database binding is required');
  }

  async function getAnnouncement(id) {
    return db.prepare('SELECT * FROM announcements WHERE id = ?').bind(requiredText(id, 'id', 100)).first();
  }

  async function listAnnouncements({ status, limit = 100 } = {}) {
    const take = positiveInteger(limit, 'limit', 100);
    if (status !== undefined && !announcementStatuses.has(status)) {
      throw new DataValidationError('invalid_status', 'status');
    }
    const statement = status
      ? db.prepare(`
          SELECT * FROM announcements
          WHERE status = ?
          ORDER BY updated_at DESC, id DESC
          LIMIT ?
        `).bind(status, take)
      : db.prepare(`
          SELECT * FROM announcements
          ORDER BY updated_at DESC, id DESC
          LIMIT ?
        `).bind(take);
    return rows(await statement.all());
  }

  async function listPublishedAnnouncements({ now, limit = 10, offset = 0 } = {}) {
    const at = currentTimestamp(now);
    const take = positiveInteger(limit, 'limit', 50);
    const result = await db.prepare(`
      SELECT id, title_sq, title_de, body_sq, body_de, starts_at, ends_at, published_at, updated_at
      FROM announcements
      WHERE status = 'published'
        AND published_at IS NOT NULL
        AND (starts_at IS NULL OR starts_at <= ?)
        AND (ends_at IS NULL OR ends_at > ?)
      ORDER BY published_at DESC, id DESC
      LIMIT ? OFFSET ?
    `).bind(at, at, take, offset).all();
    return rows(result);
  }

  async function createAnnouncementDraft(input, actor, options = {}) {
    const now = currentTimestamp(options.now);
    const user = actorEmail(actor);
    const id = requiredText(options.id ?? crypto.randomUUID(), 'id', 100);
    const draft = {
      title_sq: requiredText(input?.title_sq, 'title_sq', 160),
      title_de: requiredText(input?.title_de, 'title_de', 160),
      body_sq: requiredText(input?.body_sq, 'body_sq', 10000),
      body_de: requiredText(input?.body_de, 'body_de', 10000),
      starts_at: input?.starts_at ? timestamp(input.starts_at, 'starts_at') : null,
      ends_at: input?.ends_at ? timestamp(input.ends_at, 'ends_at') : null,
    };
    if (draft.starts_at && draft.ends_at && draft.ends_at <= draft.starts_at) {
      throw new DataValidationError('invalid_window', 'ends_at');
    }

    await db.batch([
      db.prepare(`
        INSERT INTO announcements (
          id, status, title_sq, title_de, body_sq, body_de, starts_at, ends_at,
          published_at, created_at, updated_at, created_by, updated_by
        ) VALUES (?, 'draft', ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
      `).bind(
        id, draft.title_sq, draft.title_de, draft.body_sq, draft.body_de,
        draft.starts_at, draft.ends_at, now, now, user, user,
      ),
      auditStatement(db, {
        actor: user,
        action: 'create',
        entityType: 'announcement',
        entityId: id,
        fields: Object.keys(draft),
        now,
      }),
    ]);
    return getAnnouncement(id);
  }

  async function updateAnnouncementDraft(id, input, actor, options = {}) {
    const announcementId = requiredText(id, 'id', 100);
    const existing = await getAnnouncement(announcementId);
    if (!existing) throw new DataValidationError('not_found', 'id');
    if (existing.status !== 'draft') throw new DataValidationError('not_draft', 'status');
    const draft = {
      title_sq: requiredText(input?.title_sq, 'title_sq', 160),
      title_de: requiredText(input?.title_de, 'title_de', 160),
      body_sq: requiredText(input?.body_sq, 'body_sq', 10000),
      body_de: requiredText(input?.body_de, 'body_de', 10000),
      starts_at: input?.starts_at ? timestamp(input.starts_at, 'starts_at') : null,
      ends_at: input?.ends_at ? timestamp(input.ends_at, 'ends_at') : null,
    };
    if (draft.starts_at && draft.ends_at && draft.ends_at <= draft.starts_at) {
      throw new DataValidationError('invalid_window', 'ends_at');
    }
    const now = currentTimestamp(options.now);
    const user = actorEmail(actor);
    await db.batch([
      db.prepare(`
        UPDATE announcements
        SET title_sq = ?, title_de = ?, body_sq = ?, body_de = ?, starts_at = ?, ends_at = ?,
          updated_at = ?, updated_by = ?
        WHERE id = ? AND status = 'draft'
      `).bind(
        draft.title_sq, draft.title_de, draft.body_sq, draft.body_de,
        draft.starts_at, draft.ends_at, now, user, announcementId,
      ),
      auditStatement(db, {
        actor: user,
        action: 'update',
        entityType: 'announcement',
        entityId: announcementId,
        fields: Object.keys(draft),
        now,
      }),
    ]);
    return getAnnouncement(announcementId);
  }

  async function publishAnnouncement(id, actor, options = {}) {
    const announcementId = requiredText(id, 'id', 100);
    const existing = await getAnnouncement(announcementId);
    if (!existing) throw new DataValidationError('not_found', 'id');
    if (!announcementStatuses.has(existing.status) || existing.status !== 'draft') {
      throw new DataValidationError('not_draft', 'status');
    }
    const now = currentTimestamp(options.now);
    const user = actorEmail(actor);
    await db.batch([
      db.prepare(`
        UPDATE announcements
        SET status = 'published', published_at = ?, updated_at = ?, updated_by = ?
        WHERE id = ? AND status = 'draft'
      `).bind(now, now, user, announcementId),
      auditStatement(db, {
        actor: user,
        action: 'publish',
        entityType: 'announcement',
        entityId: announcementId,
        fields: ['status', 'published_at'],
        now,
      }),
    ]);
    return getAnnouncement(announcementId);
  }

  async function archiveAnnouncement(id, actor, options = {}) {
    const announcementId = requiredText(id, 'id', 100);
    const existing = await getAnnouncement(announcementId);
    if (!existing) throw new DataValidationError('not_found', 'id');
    if (existing.status === 'archived') throw new DataValidationError('already_archived', 'status');
    if (!announcementStatuses.has(existing.status)) throw new DataValidationError('invalid_status', 'status');
    const now = currentTimestamp(options.now);
    const user = actorEmail(actor);
    await db.batch([
      db.prepare(`
        UPDATE announcements
        SET status = 'archived', updated_at = ?, updated_by = ?
        WHERE id = ? AND status != 'archived'
      `).bind(now, user, announcementId),
      auditStatement(db, {
        actor: user,
        action: 'archive',
        entityType: 'announcement',
        entityId: announcementId,
        fields: ['status'],
        now,
      }),
    ]);
    return getAnnouncement(announcementId);
  }

  async function getPublishedPrayerOverride(date) {
    return db.prepare(`
      SELECT service_date, fajr, dhuhr, asr, maghrib, isha, jummah_1, jummah_2,
        note_sq, note_de, published_at, updated_at
      FROM prayer_overrides
      WHERE service_date = ? AND status = 'published'
    `).bind(serviceDate(date)).first();
  }

  async function savePrayerOverrideDraft(input, actor, options = {}) {
    const date = serviceDate(input?.service_date);
    const values = Object.fromEntries(timeFields.map(field => [field, prayerTime(input?.[field], field)]));
    if (Object.values(values).every(value => value === null)) {
      throw new DataValidationError('time_required', 'prayer_times');
    }
    const noteSq = optionalText(input?.note_sq, 'note_sq', 1000);
    const noteDe = optionalText(input?.note_de, 'note_de', 1000);
    const now = currentTimestamp(options.now);
    const user = actorEmail(actor);

    const existing = await db.prepare('SELECT service_date FROM prayer_overrides WHERE service_date = ?').bind(date).first();
    const action = existing ? 'update' : 'create';
    await db.batch([
      db.prepare(`
        INSERT INTO prayer_overrides (
          service_date, status, fajr, dhuhr, asr, maghrib, isha, jummah_1, jummah_2,
          note_sq, note_de, published_at, created_at, updated_at, created_by, updated_by
        ) VALUES (?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
        ON CONFLICT(service_date) DO UPDATE SET
          status = 'draft', fajr = excluded.fajr, dhuhr = excluded.dhuhr,
          asr = excluded.asr, maghrib = excluded.maghrib, isha = excluded.isha,
          jummah_1 = excluded.jummah_1, jummah_2 = excluded.jummah_2,
          note_sq = excluded.note_sq, note_de = excluded.note_de,
          published_at = NULL, updated_at = excluded.updated_at, updated_by = excluded.updated_by
      `).bind(
        date, values.fajr, values.dhuhr, values.asr, values.maghrib, values.isha,
        values.jummah_1, values.jummah_2, noteSq, noteDe, now, now, user, user,
      ),
      auditStatement(db, {
        actor: user,
        action,
        entityType: 'prayer_override',
        entityId: date,
        fields: [...timeFields, 'note_sq', 'note_de'],
        now,
      }),
    ]);
    return db.prepare('SELECT * FROM prayer_overrides WHERE service_date = ?').bind(date).first();
  }

  async function publishPrayerOverride(date, actor, options = {}) {
    const day = serviceDate(date);
    const existing = await db.prepare('SELECT status FROM prayer_overrides WHERE service_date = ?').bind(day).first();
    if (!existing) throw new DataValidationError('not_found', 'service_date');
    if (existing.status !== 'draft') throw new DataValidationError('not_draft', 'status');
    const now = currentTimestamp(options.now);
    const user = actorEmail(actor);
    await db.batch([
      db.prepare(`
        UPDATE prayer_overrides
        SET status = 'published', published_at = ?, updated_at = ?, updated_by = ?
        WHERE service_date = ? AND status = 'draft'
      `).bind(now, now, user, day),
      auditStatement(db, {
        actor: user,
        action: 'publish',
        entityType: 'prayer_override',
        entityId: day,
        fields: ['status', 'published_at'],
        now,
      }),
    ]);
    return getPublishedPrayerOverride(day);
  }

  async function getSiteSetting(key) {
    const result = await db.prepare('SELECT value_json FROM site_settings WHERE setting_key = ?')
      .bind(requiredText(key, 'setting_key', 100)).first();
    return result ? JSON.parse(result.value_json) : null;
  }

  async function setSiteSetting(key, value, actor, options = {}) {
    const settingKey = requiredText(key, 'setting_key', 100);
    const valueJson = JSON.stringify(value);
    if (valueJson === undefined) throw new DataValidationError('invalid_json', 'value');
    const now = currentTimestamp(options.now);
    const user = actorEmail(actor);
    const exists = await db.prepare('SELECT setting_key FROM site_settings WHERE setting_key = ?').bind(settingKey).first();
    await db.batch([
      db.prepare(`
        INSERT INTO site_settings (setting_key, value_json, updated_at, updated_by)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(setting_key) DO UPDATE SET
          value_json = excluded.value_json,
          updated_at = excluded.updated_at,
          updated_by = excluded.updated_by
      `).bind(settingKey, valueJson, now, user),
      auditStatement(db, {
        actor: user,
        action: exists ? 'update' : 'create',
        entityType: 'site_setting',
        entityId: settingKey,
        fields: ['value'],
        now,
      }),
    ]);
    return getSiteSetting(settingKey);
  }

  async function listAuditLog({ limit = 50 } = {}) {
    const take = positiveInteger(limit, 'limit', 100);
    const result = await db.prepare(`
      SELECT id, actor, action, entity_type, entity_id, summary_json, created_at
      FROM audit_log
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `).bind(take).all();
    return rows(result).map(row => ({ ...row, summary: JSON.parse(row.summary_json) }));
  }

  return Object.freeze({
    getAnnouncement,
    listAnnouncements,
    listPublishedAnnouncements,
    createAnnouncementDraft,
    updateAnnouncementDraft,
    publishAnnouncement,
    archiveAnnouncement,
    getPublishedPrayerOverride,
    savePrayerOverrideDraft,
    publishPrayerOverride,
    getSiteSetting,
    setSiteSetting,
    listAuditLog,
  });
}
