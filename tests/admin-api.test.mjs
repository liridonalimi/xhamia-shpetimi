import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import worker from '../src/worker.mjs';

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
    if (this.statement.columns().length > 0) return { success: true, results: this.statement.all(...this.params) };
    const result = this.statement.run(...this.params);
    return { success: true, results: [], meta: { changes: Number(result.changes) } };
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

async function fixture() {
  const database = new DatabaseSync(':memory:');
  database.exec(await readFile(migrationPath, 'utf8'));
  const env = { DB: new SQLiteD1Database(database) };
  const ctx = { access: { getIdentity: async () => ({ email: 'Admin@Example.test', sub: 'administrator' }) } };
  return { database, env, ctx };
}

function request(path, options = {}) {
  return new Request(`https://example.test${path}`, options);
}

const draft = {
  title_sq: 'Njoftim për komunitetin',
  title_de: 'Mitteilung für die Gemeinde',
  body_sq: 'Përmbajtja në shqip.',
  body_de: 'Inhalt auf Deutsch.',
  starts_at: null,
  ends_at: null,
};

test('public updates expose only active published content in the selected language', async t => {
  const { database, env } = await fixture();
  t.after(() => database.close());
  const { createAdminStore } = await import('../src/data/admin-store.mjs');
  const store = createAdminStore(env.DB);
  const actor = 'admin@example.test';
  const active = await store.createAnnouncementDraft(draft, actor);
  await store.publishAnnouncement(active.id, actor);
  await store.createAnnouncementDraft({ ...draft, title_sq: 'Private draft' }, actor);
  const expired = await store.createAnnouncementDraft({ ...draft, ends_at: '2000-01-01T00:00:00.000Z' }, actor);
  await store.publishAnnouncement(expired.id, actor);
  await store.setSiteSetting('jummah_time', '12:30', actor);
  for (const lang of ['sq', 'de']) {
    const response = await worker.fetch(request(`/api/public-updates?lang=${lang}`), env, {});
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), {
      jummah: '12:30',
      announcements: [{ title: draft[`title_${lang}`], body: draft[`body_${lang}`] }],
    });
  }
  const unavailable = await worker.fetch(request('/api/public-updates?lang=sq'), {}, {});
  assert.equal(unavailable.status, 503);
});

test('jummah uses the weekly default and persists only valid authorized edits', async t => {
  const { database, env, ctx } = await fixture();
  t.after(() => database.close());
  const path = '/admin/api/jummah';
  const get = () => worker.fetch(request(path), env, ctx);
  const put = (time, origin = 'https://example.test') => worker.fetch(request(path, {
    method: 'PUT',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ time }),
  }), env, ctx);
  assert.equal((await worker.fetch(request(path), env, {})).status, 403);
  assert.deepEqual(await (await get()).json(), { time: '12:00' });
  assert.equal((await put('13:00', 'https://other.example')).status, 403);
  assert.equal((await put('24:00')).status, 400);
  assert.equal((await put('12:30')).status, 200);
  assert.deepEqual(await (await get()).json(), { time: '12:30' });
  assert.deepEqual(database.prepare('SELECT actor, entity_id FROM audit_log').all().map(row => ({ ...row })), [
    { actor: 'admin@example.test', entity_id: 'jummah_time' },
  ]);
});

test('announcement API requires a verified Access identity', async t => {
  const { database, env } = await fixture();
  t.after(() => database.close());
  const response = await worker.fetch(request('/admin/api/announcements'), env, {});
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'access_required' });
});

test('announcement API rejects cross-origin mutations before writing', async t => {
  const { database, env, ctx } = await fixture();
  t.after(() => database.close());
  const response = await worker.fetch(request('/admin/api/announcements', {
    method: 'POST',
    headers: { origin: 'https://attacker.test', 'content-type': 'application/json' },
    body: JSON.stringify(draft),
  }), env, ctx);
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { error: 'invalid_origin' });
  assert.equal(database.prepare('SELECT COUNT(*) AS total FROM announcements').get().total, 0);
});

test('announcement API supports create, update, publish, list and archive', async t => {
  const { database, env, ctx } = await fixture();
  t.after(() => database.close());
  const headers = { origin: 'https://example.test', 'content-type': 'application/json' };

  const createdResponse = await worker.fetch(request('/admin/api/announcements', {
    method: 'POST', headers, body: JSON.stringify(draft),
  }), env, ctx);
  assert.equal(createdResponse.status, 201);
  const created = (await createdResponse.json()).item;
  assert.equal(created.status, 'draft');
  assert.equal(created.created_by, 'admin@example.test');

  const updatedResponse = await worker.fetch(request(`/admin/api/announcements/${created.id}`, {
    method: 'PUT', headers, body: JSON.stringify({ ...draft, title_sq: 'Titulli i përditësuar' }),
  }), env, ctx);
  assert.equal(updatedResponse.status, 200);
  assert.equal((await updatedResponse.json()).item.title_sq, 'Titulli i përditësuar');

  const publishResponse = await worker.fetch(request(`/admin/api/announcements/${created.id}/publish`, {
    method: 'POST', headers, body: '{}',
  }), env, ctx);
  assert.equal(publishResponse.status, 200);
  assert.equal((await publishResponse.json()).item.status, 'published');

  const listResponse = await worker.fetch(request('/admin/api/announcements?status=published'), env, ctx);
  assert.equal(listResponse.status, 200);
  assert.equal((await listResponse.json()).items.length, 1);

  const archiveResponse = await worker.fetch(request(`/admin/api/announcements/${created.id}/archive`, {
    method: 'POST', headers, body: '{}',
  }), env, ctx);
  assert.equal(archiveResponse.status, 200);
  assert.equal((await archiveResponse.json()).item.status, 'archived');
  assert.deepEqual(
    database.prepare('SELECT action FROM audit_log ORDER BY id').all().map(row => row.action),
    ['create', 'update', 'publish', 'archive'],
  );
});

test('announcement API returns stable validation and method errors', async t => {
  const { database, env, ctx } = await fixture();
  t.after(() => database.close());
  const headers = { origin: 'https://example.test', 'content-type': 'application/json' };
  const invalid = await worker.fetch(request('/admin/api/announcements', {
    method: 'POST', headers, body: JSON.stringify({ ...draft, title_sq: '' }),
  }), env, ctx);
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: 'required', field: 'title_sq' });

  const method = await worker.fetch(request('/admin/api/announcements', { method: 'DELETE' }), env, ctx);
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'GET, POST');
});
