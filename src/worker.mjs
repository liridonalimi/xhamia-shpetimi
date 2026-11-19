import { SECURITY_HEADERS } from './security.mjs';
import { AccessAuthError, requireAccessIdentity } from './access-auth.mjs';
import { createAdminStore, DataValidationError } from './data/admin-store.mjs';
export { SECURITY_HEADERS } from './security.mjs';

export const PRAYER_CONFIG = Object.freeze({
  latitude: 47.9801632,
  longitude: 8.8161992,
  method: 3,
  methodName: 'Muslim World League',
  school: 1,
  schoolName: 'Hanafi',
  timezone: 'Europe/Berlin',
});

const prayerKeys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const jsonHeaders = { 'content-type': 'application/json; charset=utf-8' };
const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { ...SECURITY_HEADERS, ...jsonHeaders, ...extraHeaders },
});

function withSecurityHeaders(response) {
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) secured.headers.set(name, value);
  return secured;
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function apiDate(value) {
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

function cleanTime(value) {
  const match = String(value ?? '').match(/^([01]\d|2[0-3]):[0-5]\d/);
  return match?.[0] ?? null;
}

export async function prayerTimesResponse(request) {
  const requestUrl = new URL(request.url);
  const date = requestUrl.searchParams.get('date');
  if (!validDate(date)) return json({ error: 'invalid_date' }, 400, { 'cache-control': 'no-store' });

  const upstreamUrl = new URL(`https://api.aladhan.com/v1/timings/${apiDate(date)}`);
  upstreamUrl.searchParams.set('latitude', String(PRAYER_CONFIG.latitude));
  upstreamUrl.searchParams.set('longitude', String(PRAYER_CONFIG.longitude));
  upstreamUrl.searchParams.set('method', String(PRAYER_CONFIG.method));
  upstreamUrl.searchParams.set('school', String(PRAYER_CONFIG.school));
  upstreamUrl.searchParams.set('timezonestring', PRAYER_CONFIG.timezone);

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { accept: 'application/json' },
      cf: { cacheEverything: true, cacheTtl: 86400 },
    });
    if (!upstream.ok) throw new Error(`AlAdhan returned ${upstream.status}`);
    const payload = await upstream.json();
    const timings = Object.fromEntries(prayerKeys.map(key => [key, cleanTime(payload?.data?.timings?.[key])]));
    if (Object.values(timings).some(value => value === null)) throw new Error('AlAdhan returned incomplete timings');

    return json({
      date,
      timezone: PRAYER_CONFIG.timezone,
      method: PRAYER_CONFIG.methodName,
      school: PRAYER_CONFIG.schoolName,
      source: 'AlAdhan',
      timings,
    }, 200, { 'cache-control': 'public, max-age=300, s-maxage=86400' });
  } catch {
    return json({ error: 'schedule_unavailable' }, 502, { 'cache-control': 'no-store' });
  }
}

async function adminIdentity(request, env, ctx) {
  try {
    return { identity: await requireAccessIdentity(request, env, ctx) };
  } catch (error) {
    if (!(error instanceof AccessAuthError)) throw error;
    return {
      response: json({ error: 'access_required' }, 403, { 'cache-control': 'no-store' }),
    };
  }
}

async function adminSessionResponse(request, env, ctx) {
  if (request.method !== 'GET') {
    return json({ error: 'method_not_allowed' }, 405, { allow: 'GET', 'cache-control': 'no-store' });
  }
  const auth = await adminIdentity(request, env, ctx);
  if (auth.response) return auth.response;

  let database = 'unavailable';
  try {
    const result = await env.DB.prepare('SELECT 1 AS ready').first();
    if (result?.ready === 1) database = 'ready';
  } catch {
    database = 'unavailable';
  }
  return json({
    user: auth.identity,
    environment: env.APP_ENV === 'production' ? 'production' : 'preview',
    database,
  }, 200, { 'cache-control': 'no-store' });
}

function dataErrorResponse(error) {
  if (!(error instanceof DataValidationError)) return null;
  const status = error.code === 'not_found'
    ? 404
    : ['not_draft', 'already_archived'].includes(error.code)
      ? 409
      : 400;
  return json({ error: error.code, field: error.field }, status, { 'cache-control': 'no-store' });
}

function mutationOriginAllowed(request) {
  const origin = request.headers.get('origin');
  return origin === new URL(request.url).origin;
}

async function jsonBody(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new DataValidationError('json_required', 'content_type');
  }
  const declaredSize = Number(request.headers.get('content-length') ?? 0);
  if (declaredSize > 30000) throw new DataValidationError('payload_too_large', 'body');
  const text = await request.text();
  if (text.length > 30000) throw new DataValidationError('payload_too_large', 'body');
  try {
    return JSON.parse(text);
  } catch {
    throw new DataValidationError('invalid_json', 'body');
  }
}

async function adminAnnouncementsResponse(request, env, ctx) {
  const auth = await adminIdentity(request, env, ctx);
  if (auth.response) return auth.response;
  if (!env.DB) return json({ error: 'database_unavailable' }, 503, { 'cache-control': 'no-store' });

  const url = new URL(request.url);
  const basePath = '/admin/api/announcements';
  const suffix = url.pathname.slice(basePath.length);
  const store = createAdminStore(env.DB);

  try {
    const parts = suffix.split('/').filter(Boolean).map(part => decodeURIComponent(part));
    if (parts.length === 0 && request.method === 'GET') {
      const status = url.searchParams.get('status') || undefined;
      const items = await store.listAnnouncements({ status, limit: 100 });
      return json({ items }, 200, { 'cache-control': 'no-store' });
    }

    if (parts.length === 1 && request.method === 'GET') {
      const item = await store.getAnnouncement(parts[0]);
      return item
        ? json({ item }, 200, { 'cache-control': 'no-store' })
        : json({ error: 'not_found', field: 'id' }, 404, { 'cache-control': 'no-store' });
    }

    if (!['POST', 'PUT'].includes(request.method)) {
      return json({ error: 'method_not_allowed' }, 405, {
        allow: parts.length === 0 ? 'GET, POST' : parts.length === 1 ? 'GET, PUT' : 'POST',
        'cache-control': 'no-store',
      });
    }
    if (!mutationOriginAllowed(request)) {
      return json({ error: 'invalid_origin' }, 403, { 'cache-control': 'no-store' });
    }

    if (parts.length === 0 && request.method === 'POST') {
      const item = await store.createAnnouncementDraft(await jsonBody(request), auth.identity.email);
      return json({ item }, 201, { 'cache-control': 'no-store' });
    }
    if (parts.length === 1 && request.method === 'PUT') {
      const item = await store.updateAnnouncementDraft(parts[0], await jsonBody(request), auth.identity.email);
      return json({ item }, 200, { 'cache-control': 'no-store' });
    }
    if (parts.length === 2 && request.method === 'POST' && parts[1] === 'publish') {
      const item = await store.publishAnnouncement(parts[0], auth.identity.email);
      return json({ item }, 200, { 'cache-control': 'no-store' });
    }
    if (parts.length === 2 && request.method === 'POST' && parts[1] === 'archive') {
      const item = await store.archiveAnnouncement(parts[0], auth.identity.email);
      return json({ item }, 200, { 'cache-control': 'no-store' });
    }
    return json({ error: 'not_found' }, 404, { 'cache-control': 'no-store' });
  } catch (error) {
    const validationResponse = dataErrorResponse(error);
    if (validationResponse) return validationResponse;
    return json({ error: 'database_error' }, 500, { 'cache-control': 'no-store' });
  }
}

async function adminAssetResponse(request, env, ctx) {
  const auth = await adminIdentity(request, env, ctx);
  if (auth.response) {
    return withSecurityHeaders(new Response('Access required', {
      status: 403,
      headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    }));
  }
  const url = new URL(request.url);
  if (url.pathname === '/admin') return withSecurityHeaders(Response.redirect(new URL('/admin/', url), 308));
  return withSecurityHeaders(await env.ASSETS.fetch(request));
}

async function jummahResponse(request, env, ctx) {
  const auth = await adminIdentity(request, env, ctx);
  if (auth.response) return auth.response;
  const reply = (payload, status = 200, headers = {}) =>
    json(payload, status, { 'cache-control': 'no-store', ...headers });
  if (!['GET', 'PUT'].includes(request.method)) {
    return reply({ error: 'method_not_allowed' }, 405, { allow: 'GET, PUT' });
  }
  if (request.method === 'PUT' && !mutationOriginAllowed(request)) {
    return reply({ error: 'invalid_origin' }, 403);
  }
  try {
    const store = createAdminStore(env.DB);
    if (request.method === 'GET') {
      return reply({ time: await store.getSiteSetting('jummah_time') ?? '12:00' });
    }
    const { time } = (await jsonBody(request)) ?? {};
    if (typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return reply({ error: 'invalid_time' }, 400);
    }
    await store.setSiteSetting('jummah_time', time, auth.identity.email);
    return reply({ time });
  } catch (error) {
    return dataErrorResponse(error) ?? reply({ error: 'database_error' }, 500);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/public-updates') return publicUpdates(request, env, url);
    if (url.pathname === '/admin/api/session') return adminSessionResponse(request, env, ctx);
    if (url.pathname === '/admin/api/jummah') return jummahResponse(request, env, ctx);
    if (url.pathname === '/admin/api/announcements' || url.pathname.startsWith('/admin/api/announcements/')) {
      return adminAnnouncementsResponse(request, env, ctx);
    }
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      if (url.pathname.startsWith('/admin/api/')) {
        const auth = await adminIdentity(request, env, ctx);
        if (auth.response) return auth.response;
        return json({ error: 'not_found' }, 404, { 'cache-control': 'no-store' });
      }
      return adminAssetResponse(request, env, ctx);
    }
    if (url.pathname === '/api/prayer-times') {
      if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, { allow: 'GET', 'cache-control': 'no-store' });
      return prayerTimesResponse(request);
    }
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};

async function publicUpdates(request, env, url) {
  const headers = { 'cache-control': 'no-store' };
  if (request.method !== 'GET') {
    return json({ error: 'method_not_allowed' }, 405, { ...headers, allow: 'GET' });
  }
  const lang = url.searchParams.get('lang');
  if (lang !== 'sq' && lang !== 'de') return json({ error: 'invalid_language' }, 400, headers);
  try {
    const store = createAdminStore(env.DB);
    const [jummah, announcements] = await Promise.allSettled([
      store.getSiteSetting('jummah_time'),
      store.listPublishedAnnouncements(),
    ]);
    const time = jummah.status === 'fulfilled' ? jummah.value ?? '12:00' : null;
    return json({
      jummah: typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : null,
      announcements: announcements.status === 'fulfilled'
        ? announcements.value.map(row => ({ title: row[`title_${lang}`], body: row[`body_${lang}`] }))
        : [],
    }, 200, headers);
  } catch {
    return json({ error: 'updates_unavailable' }, 503, headers);
  }
}
