import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { paths, pagePath, mosque, prayerSchedule, approvedTimes, copy } from '../src/content.mjs';
import worker, { PRAYER_CONFIG } from '../src/worker.mjs';

const output = resolve(import.meta.dirname, '../dist');
test('every public route has its language, metadata, main landmark and matching language switch', async () => {
  for (const lang of ['sq', 'de']) for (const page of Object.keys(paths[lang])) {
    const html = await readFile(resolve(output, `.${pagePath(lang, page)}`, 'index.html'), 'utf8');
    assert.ok(html.includes(`<html lang="${lang}">`));
    assert.ok(html.includes('<main id="main">'));
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.ok(html.includes('name="description"'));
    assert.ok(html.includes(`href="${pagePath(lang === 'sq' ? 'de' : 'sq', page)}" lang=`));
    assert.ok(html.includes(`href="tel:${mosque.phoneHref}"`));
    assert.ok(html.includes(mosque.email));
  }
});

test('all internal page and asset links resolve to built files', async () => {
  for (const lang of ['sq', 'de']) for (const page of Object.keys(paths[lang])) {
    const html = await readFile(resolve(output, `.${pagePath(lang, page)}`, 'index.html'), 'utf8');
    for (const match of html.matchAll(/(?:href|src)="(\/[^"?]*)"/g)) {
      const path = resolve(output, `.${match[1]}`, match[1].endsWith('/') ? 'index.html' : '');
      assert.ok((await stat(path)).isFile(), `missing link ${match[1]} on ${lang}/${page}`);
    }
    for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const candidate of match[1].split(',')) {
        const [asset] = candidate.trim().split(/\s+/);
        assert.ok((await stat(resolve(output, `.${asset}`))).isFile(), `missing srcset asset ${asset} on ${lang}/${page}`);
      }
    }
    assert.ok(!/href="#"/.test(html), 'no placeholder links');
  }
});

test('the primary navigation exposes support in both languages', async () => {
  for (const lang of ['sq', 'de']) {
    const home = await readFile(resolve(output, `.${pagePath(lang, 'home')}`, 'index.html'), 'utf8');
    const support = await readFile(resolve(output, `.${pagePath(lang, 'support')}`, 'index.html'), 'utf8');
    assert.ok(home.includes(`class="navigation-cta">${copy[lang].nav.support}</a>`));
    assert.ok(support.includes(`class="navigation-cta" aria-current="page">${copy[lang].nav.support}</a>`));
  }
});

test('the homepage hero uses responsive imagery and a verified directions link', async () => {
  for (const lang of ['sq', 'de']) {
    const html = await readFile(resolve(output, `.${pagePath(lang, 'home')}`, 'index.html'), 'utf8');
    assert.ok(html.includes('srcset="/assets/hero-640.jpg 640w, /assets/hero.jpg 1024w"'));
    assert.ok(html.includes('sizes="(max-width: 600px) 100vw, 50vw"'));
    assert.ok(html.includes('fetchpriority="high" decoding="async"'));
    assert.ok(html.includes(`class="hero-location" href="${mosque.directions}"`));
    assert.ok(html.includes(`${mosque.street} · ${mosque.city}`));
  }
});

test('community cards use clear internal destinations and a safe external Facebook action', async () => {
  for (const lang of ['sq', 'de']) {
    const home = await readFile(resolve(output, `.${pagePath(lang, 'home')}`, 'index.html'), 'utf8');
    const community = await readFile(resolve(output, `.${pagePath(lang, 'community')}`, 'index.html'), 'utf8');
    assert.equal((home.match(/class="community-card"/g) ?? []).length, 3);
    assert.ok(home.includes(`class="text-link card-link" href="${pagePath(lang, 'contact')}"`));
    assert.ok(home.includes(`class="text-link card-link" href="${pagePath(lang, 'community')}"`));
    assert.ok(home.includes(`class="text-link card-link" href="${pagePath(lang, 'support')}"`));
    assert.ok(home.includes(`id="community-heading-${lang}"`));
    assert.ok(home.includes(`aria-labelledby="community-card-${lang}-home-1"`));
    assert.ok(community.includes(`class="text-link card-link" href="${mosque.facebook}" target="_blank" rel="noopener noreferrer">${copy[lang].facebookCta}`));
    assert.ok(community.includes(`aria-labelledby="community-card-${lang}-community-2"`));
  }
});

test('the calculated prayer schedule is configured and never hard-codes demonstration times', async () => {
  assert.equal(prayerSchedule.approved, true);
  assert.equal(prayerSchedule.method, 3);
  assert.equal(prayerSchedule.school, 1);
  assert.equal(approvedTimes('2026-10-09'), null);
  for (const lang of ['sq', 'de']) for (const page of ['home', 'prayer']) {
    const html = await readFile(resolve(output, `.${pagePath(lang, page)}`, 'index.html'), 'utf8');
    assert.ok(html.includes(copy[lang].prayerLoading));
    assert.ok(html.includes(copy[lang].prayerStatus));
    assert.ok(html.includes(copy[lang].prayerContact));
    assert.ok(html.includes('class="prayer-status"'));
    assert.ok(html.includes('role="status"'));
    assert.ok(html.includes(`aria-describedby="prayer-status-${lang}-${page === 'home' ? 'home' : 'full'}"`));
    assert.equal((html.match(/class="prayer-time"/g) ?? []).length, 5);
    assert.equal((html.match(/data-prayer-key=/g) ?? []).length, 5);
    assert.ok(!/\b(?:06:05|13:15|16:10|18:45|20:05|13:30)\b/.test(html));
    assert.ok(!html.includes('Hermannstraße'));
    if (page === 'prayer') assert.ok(html.includes('data-date-step'));
  }
});

test('the Worker proxies a sanitized MWL Hanafi schedule for the mosque coordinates', async () => {
  assert.deepEqual(PRAYER_CONFIG, {
    latitude: 47.9801632,
    longitude: 8.8161992,
    method: 3,
    methodName: 'Muslim World League',
    school: 1,
    schoolName: 'Hanafi',
    timezone: 'Europe/Berlin',
  });
  const originalFetch = globalThis.fetch;
  let upstreamUrl;
  globalThis.fetch = async url => {
    upstreamUrl = String(url);
    return Response.json({ data: { timings: { Fajr: '05:45 (CET)', Dhuhr: '12:10', Asr: '15:01', Maghrib: '16:45', Isha: '18:28' } } });
  };
  try {
    const response = await worker.fetch(new Request('https://example.test/api/prayer-times?date=2026-11-17'), {});
    assert.equal(response.status, 200);
    assert.match(upstreamUrl, /latitude=47\.9801632/);
    assert.match(upstreamUrl, /longitude=8\.8161992/);
    assert.match(upstreamUrl, /method=3/);
    assert.match(upstreamUrl, /school=1/);
    const payload = await response.json();
    assert.deepEqual(payload.timings, { Fajr: '05:45', Dhuhr: '12:10', Asr: '15:01', Maghrib: '16:45', Isha: '18:28' });
    assert.equal(payload.method, 'Muslim World League');
    assert.equal(payload.school, 'Hanafi');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('legal pages identify the missing association information', async () => {
  for (const lang of ['sq', 'de']) {
    const html = await readFile(resolve(output, `.${pagePath(lang, 'imprint')}`, 'index.html'), 'utf8');
    assert.ok(html.includes(copy[lang].legalDraft));
    assert.ok(html.includes(copy[lang].missingLegal));
  }
});

test('no third-party embeds or trackers load automatically', async () => {
  const html = await readFile(resolve(output, 'index.html'), 'utf8');
  assert.ok(!html.includes('<iframe'));
  assert.ok(!/<(?:img|script)\b[^>]+src="https?:/.test(html));
  const js = await readFile(resolve(output, 'assets/site.js'), 'utf8');
  assert.ok(js.includes('fetch(`/api/prayer-times?date='));
  assert.ok(!js.includes('api.aladhan.com'));
  assert.ok(!/localStorage|document\.cookie|XMLHttpRequest/.test(js));
  for (const lang of ['sq', 'de']) {
    const privacy = await readFile(resolve(output, `.${pagePath(lang, 'privacy')}`, 'index.html'), 'utf8');
    assert.ok(privacy.includes('AlAdhan'));
    assert.ok(privacy.includes('Cloudflare'));
  }
});
