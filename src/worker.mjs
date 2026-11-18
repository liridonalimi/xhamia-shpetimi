import { SECURITY_HEADERS } from './security.mjs';
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/prayer-times') {
      if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, { allow: 'GET', 'cache-control': 'no-store' });
      return prayerTimesResponse(request);
    }
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
