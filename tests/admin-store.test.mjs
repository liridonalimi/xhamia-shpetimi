import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createAdminStore, DataValidationError } from '../src/data/admin-store.mjs';

const migrationPath = resolve(import.meta.dirname, '../migrations/0001_module_02_initial_schema.sql');

class SQLiteD1Statement {
  constructor(statement) {
    this.statement = statement;
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async first() {
    return this.statement.get(...this.params) ?? null;
  }

  async all() {
    return { success: true, results: this.statement.all(...this.params) };
  }

  execute() {
    if (this.statement.columns().length > 0) {
      return { success: true, results: this.statement.all(...this.params) };
    }
    const result = this.statement.run(...this.params);
    return {
      success: true,
      results: [],
      meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) },
    };
  }
}

class SQLiteD1Database {
  constructor(database) {
    this.database = database;
  }

  prepare(sql) {
    return new SQLiteD1Statement(this.database.prepare(sql));
  }

  async batch(statements) {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const results = statements.map(statement => statement.execute());
      this.database.exec('COMMIT');
      return results;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }
}

async function testDatabase() {
  const database = new DatabaseSync(':memory:');
  database.exec(await readFile(migrationPath, 'utf8'));
  return { database, store: createAdminStore(new SQLiteD1Database(database)) };
}

const admin = 'administrator@example.test';
const now = '2026-11-19T08:00:00.000Z';

test('the initial migration creates constrained, append-only administration tables', async t => {
  const { database } = await testDatabase();
  t.after(() => database.close());

  const tables = database.prepare(`
    SELECT name FROM sqlite_schema
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all().map(row => row.name);
  assert.deepEqual(tables, ['announcements', 'audit_log', 'prayer_overrides', 'site_settings']);

  assert.throws(() => database.prepare(`
    INSERT INTO announcements (
      id, status, title_sq, title_de, body_sq, body_de, published_at,
      created_at, updated_at, created_by, updated_by
    ) VALUES ('invalid', 'published', 'SQ', 'DE', 'SQ', 'DE', NULL, ?, ?, ?, ?)
  `).run(now, now, admin, admin), /CHECK constraint failed/);

  database.prepare(`
    INSERT INTO audit_log (actor, action, entity_type, entity_id, summary_json, created_at)
    VALUES (?, 'create', 'announcement', 'one', '{}', ?)
  `).run(admin, now);
  assert.throws(() => database.prepare('UPDATE audit_log SET actor = ? WHERE id = 1').run('changed@example.test'), /append-only/);
  assert.throws(() => database.prepare('DELETE FROM audit_log WHERE id = 1').run(), /append-only/);
});

test('announcement drafts stay private until publishing and write an audit trail', async t => {
  const { database, store } = await testDatabase();
  t.after(() => database.close());

  const draft = await store.createAnnouncementDraft({
    title_sq: 'Njoftim për bashkësinë',
    title_de: 'Mitteilung für die Gemeinde',
    body_sq: 'Përmbajtja në shqip.',
    body_de: 'Inhalt auf Deutsch.',
  }, admin, { id: 'announcement-1', now });

  assert.equal(draft.status, 'draft');
  assert.deepEqual(await store.listPublishedAnnouncements({ now }), []);

  const published = await store.publishAnnouncement('announcement-1', admin, { now: '2026-11-19T08:05:00.000Z' });
  assert.equal(published.status, 'published');
  assert.equal(published.published_at, '2026-11-19T08:05:00.000Z');

  const publicRows = await store.listPublishedAnnouncements({ now: '2026-11-19T08:06:00.000Z' });
  assert.equal(publicRows.length, 1);
  assert.equal(publicRows[0].id, 'announcement-1');
  assert.ok(!Object.hasOwn(publicRows[0], 'created_by'));

  const audit = await store.listAuditLog();
  assert.deepEqual(audit.map(row => row.action), ['publish', 'create']);
  assert.deepEqual(audit[0].summary, { fields: ['status', 'published_at'] });
});

test('announcement publication windows and validation are enforced', async t => {
  const { database, store } = await testDatabase();
  t.after(() => database.close());

  await assert.rejects(
    store.createAnnouncementDraft({ title_sq: '', title_de: 'DE', body_sq: 'SQ', body_de: 'DE' }, admin, { now }),
    error => error instanceof DataValidationError && error.field === 'title_sq',
  );
  await assert.rejects(
    store.createAnnouncementDraft({
      title_sq: 'SQ', title_de: 'DE', body_sq: 'SQ', body_de: 'DE',
      starts_at: '2026-11-20T10:00:00.000Z', ends_at: '2026-11-20T09:00:00.000Z',
    }, admin, { now }),
    error => error instanceof DataValidationError && error.code === 'invalid_window',
  );
  await assert.rejects(
    store.createAnnouncementDraft({
      title_sq: 'SQ', title_de: 'DE', body_sq: 'SQ', body_de: 'DE',
      starts_at: '2026-02-30T08:00:00.000Z',
    }, admin, { now }),
    error => error instanceof DataValidationError && error.code === 'invalid_timestamp',
  );

  await store.createAnnouncementDraft({
    title_sq: 'Nesër', title_de: 'Morgen', body_sq: 'SQ', body_de: 'DE',
    starts_at: '2026-11-20T08:00:00.000Z',
  }, admin, { id: 'future', now });
  await store.publishAnnouncement('future', admin, { now });
  assert.deepEqual(await store.listPublishedAnnouncements({ now }), []);
  assert.equal((await store.listPublishedAnnouncements({ now: '2026-11-20T08:00:00.000Z' })).length, 1);
});

test('prayer overrides require valid approved times and remain private as drafts', async t => {
  const { database, store } = await testDatabase();
  t.after(() => database.close());

  await assert.rejects(
    store.savePrayerOverrideDraft({ service_date: '2026-02-30', fajr: '05:30' }, admin, { now }),
    error => error instanceof DataValidationError && error.code === 'invalid_date',
  );
  await assert.rejects(
    store.savePrayerOverrideDraft({ service_date: '2026-11-20', fajr: '25:00' }, admin, { now }),
    error => error instanceof DataValidationError && error.field === 'fajr',
  );

  const draft = await store.savePrayerOverrideDraft({
    service_date: '2026-11-20',
    fajr: '06:15',
    jummah_1: '13:30',
    note_sq: 'Orar i miratuar.',
    note_de: 'Bestätigter Zeitplan.',
  }, admin, { now });
  assert.equal(draft.status, 'draft');
  assert.equal(await store.getPublishedPrayerOverride('2026-11-20'), null);

  const published = await store.publishPrayerOverride('2026-11-20', admin, { now: '2026-11-19T08:10:00.000Z' });
  assert.equal(published.fajr, '06:15');
  assert.equal(published.jummah_1, '13:30');
  assert.ok(!Object.hasOwn(published, 'created_by'));
});

test('site settings round-trip JSON and all mutations identify their actor', async t => {
  const { database, store } = await testDatabase();
  t.after(() => database.close());

  assert.equal(await store.getSiteSetting('homepage_notice'), null);
  const value = { enabled: true, text_sq: 'Mirë se vini', text_de: 'Willkommen' };
  assert.deepEqual(await store.setSiteSetting('homepage_notice', value, admin, { now }), value);
  assert.deepEqual(await store.getSiteSetting('homepage_notice'), value);

  const audit = await store.listAuditLog();
  assert.equal(audit.length, 1);
  assert.equal(audit[0].actor, admin);
  assert.equal(audit[0].entity_type, 'site_setting');
});
