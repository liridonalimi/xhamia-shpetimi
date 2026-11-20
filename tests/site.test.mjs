import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { paths, pagePath, mosque, prayerSchedule, approvedTimes, demoBankDetails, legalProfile, legalCopy, copy } from '../src/content.mjs';
import worker, { PRAYER_CONFIG, SECURITY_HEADERS } from '../src/worker.mjs';

const output = resolve(import.meta.dirname, '../dist');
const productionOrigin = 'https://xhamia-shpetimi.liridon-halimi.workers.dev';
test('the admin shell is generated as a private, noindex responsive application', async () => {
  const html = await readFile(resolve(output, 'admin/index.html'), 'utf8');
  const announcements = await readFile(resolve(output, 'admin/njoftime/index.html'), 'utf8');
  const css = await readFile(resolve(output, 'admin/assets/admin.css'), 'utf8');
  const script = await readFile(resolve(output, 'admin/assets/admin.js'), 'utf8');
  assert.ok(html.includes('<html lang="sq">'));
  assert.ok(html.includes('name="robots" content="noindex,nofollow,noarchive"'));
  assert.ok(html.includes('<main class="admin-main" id="admin-main">'));
  assert.ok(html.includes('href="/admin/assets/admin.css"'));
  assert.ok(html.includes('src="/admin/assets/admin.js"'));
  assert.ok(html.includes('data-session-email'));
  assert.ok(html.includes('data-database-status'));
  assert.match(css, /@media\(max-width:680px\)/);
  assert.ok(script.includes("api('/admin/api/session'"));
  assert.ok(html.includes('href="/admin/njoftime/"'));
  assert.ok(announcements.includes('data-announcement-form'));
  assert.ok(announcements.includes('data-status-filter'));
  assert.ok(announcements.includes('name="title_sq"'));
  assert.ok(announcements.includes('name="title_de"'));
  assert.ok(announcements.includes('data-publish-announcement'));
  assert.ok(script.includes("'/admin/api/announcements'"));
  assert.ok(script.includes('window.confirm'));
  assert.ok(!html.includes('Lorem'));
});

test('admin routes fail closed and authenticated sessions expose only safe identity state', async () => {
  let assetRequests = 0;
  const env = {
    APP_ENV: 'preview',
    DB: { prepare: () => ({ first: async () => ({ ready: 1 }) }) },
    ASSETS: { fetch: async () => { assetRequests += 1; return new Response('<h1>Admin</h1>', { headers: { etag: 'admin' } }); } },
  };
  const denied = await worker.fetch(new Request('https://example.test/admin/'), env, {});
  assert.equal(denied.status, 403);
  assert.equal(assetRequests, 0);
  assert.equal(denied.headers.get('cache-control'), 'no-store');

  const ctx = { access: { getIdentity: async () => ({ email: 'Admin@Example.test', sub: 'user-1' }) } };
  const session = await worker.fetch(new Request('https://example.test/admin/api/session'), env, ctx);
  assert.equal(session.status, 200);
  assert.equal(session.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await session.json(), {
    user: { email: 'admin@example.test', subject: 'user-1' },
    environment: 'preview',
    database: 'ready',
  });

  const asset = await worker.fetch(new Request('https://example.test/admin/'), env, ctx);
  assert.equal(asset.status, 200);
  assert.equal(assetRequests, 1);
  assert.equal(asset.headers.get('etag'), 'admin');
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) assert.equal(asset.headers.get(name), value);
});

test('every public route has its language, metadata, main landmark and matching language switch', async () => {
  for (const lang of ['sq', 'de']) for (const page of Object.keys(paths[lang])) {
    const html = await readFile(resolve(output, `.${pagePath(lang, page)}`, 'index.html'), 'utf8');
    assert.ok(html.includes(`<html lang="${lang}">`));
    assert.ok(html.includes('<main id="main">'));
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.ok(html.includes('name="description"'));
    assert.ok(html.includes('name="robots" content="noindex,nofollow"'));
    assert.ok(html.includes(`href="${pagePath(lang === 'sq' ? 'de' : 'sq', page)}" lang=`));
    assert.ok(html.includes(`href="tel:${mosque.phoneHref}"`));
    assert.ok(html.includes(mosque.email));
  }
});

test('all internal page and asset links resolve to built files', async () => {
  for (const lang of ['sq', 'de']) for (const page of Object.keys(paths[lang])) {
    const html = await readFile(resolve(output, `.${pagePath(lang, page)}`, 'index.html'), 'utf8');
    for (const match of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      const url = new URL(match[1], productionOrigin);
      const path = resolve(output, `.${url.pathname}`, url.pathname.endsWith('/') ? 'index.html' : '');
      assert.ok((await stat(path)).isFile(), `missing link ${match[1]} on ${lang}/${page}`);
      if (url.hash) assert.ok((await readFile(path, 'utf8')).includes(`id="${url.hash.slice(1)}"`));
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

test('generated markup has unique ids, valid ARIA references and safe interactive elements', async () => {
  for (const lang of ['sq', 'de']) for (const page of Object.keys(paths[lang])) {
    const html = await readFile(resolve(output, `.${pagePath(lang, page)}`, 'index.html'), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `duplicate id on ${lang}/${page}`);
    const idSet = new Set(ids);
    for (const match of html.matchAll(/\baria-(?:controls|describedby|labelledby)="([^"]+)"/g)) {
      for (const reference of match[1].split(/\s+/)) assert.ok(idSet.has(reference), `missing ARIA target ${reference} on ${lang}/${page}`);
    }
    for (const match of html.matchAll(/<img\b[^>]*>/g)) assert.match(match[0], /\balt="[^"]*"/, `image without alt on ${lang}/${page}`);
    for (const match of html.matchAll(/<button\b[^>]*>/g)) assert.match(match[0], /\btype="button"/, `button without an explicit type on ${lang}/${page}`);
    for (const match of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
      assert.match(match[0], /\brel="[^"]*noopener[^"]*"/, `external link without noopener on ${lang}/${page}`);
      assert.match(match[0], /\brel="[^"]*noreferrer[^"]*"/, `external link without noreferrer on ${lang}/${page}`);
    }
  }
});

test('primary navigation scrolls to real homepage sections in both languages', async () => {
  for (const lang of ['sq', 'de']) {
    const home = await readFile(resolve(output, `.${pagePath(lang, 'home')}`, 'index.html'), 'utf8');
    const support = await readFile(resolve(output, `.${pagePath(lang, 'support')}`, 'index.html'), 'utf8');
    const nav = home.match(/<nav id="main-navigation"[\s\S]*?<\/nav>/)?.[0] ?? '';
    const targets = [...nav.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(targets, ['ballina', 'namazi', 'rreth-nesh', 'bashkesia', 'kontakt', 'mbeshtet']);
    for (const target of targets) {
      assert.ok(home.includes(`id="${target}" tabindex="-1"`));
      assert.ok(support.includes(`href="${pagePath(lang)}#${target}"`));
    }
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

test('the about identity section exposes the association and values in both languages', async () => {
  for (const lang of ['sq', 'de']) {
    const home = await readFile(resolve(output, `.${pagePath(lang, 'home')}`, 'index.html'), 'utf8');
    const about = await readFile(resolve(output, `.${pagePath(lang, 'about')}`, 'index.html'), 'utf8');
    assert.ok(home.includes(`aria-labelledby="about-heading-${lang}"`));
    assert.ok(home.includes(`id="about-heading-${lang}"`));
    assert.ok(home.includes(mosque.association));
    assert.ok(home.includes(`class="text-link about-link" href="${pagePath(lang, 'about')}"`));
    assert.equal((home.match(/<li><span aria-hidden="true">0[1-3]<\/span><strong>/g) ?? []).length, 3);
    assert.ok(about.includes(`aria-labelledby="about-page-heading-${lang}"`));
    assert.ok(about.includes(`aria-label="${lang === 'sq' ? 'Vlerat tona' : 'Unsere Werte'}"`));
    for (const value of copy[lang].values) assert.ok(about.includes(`<strong>${value}</strong>`));
  }
});

test('the latest news section links to the official Facebook page without an embed', async () => {
  for (const lang of ['sq', 'de']) {
    const home = await readFile(resolve(output, `.${pagePath(lang, 'home')}`, 'index.html'), 'utf8');
    assert.ok(home.includes(`aria-labelledby="news-heading-${lang}"`));
    assert.ok(home.includes(`id="news-heading-${lang}"`));
    assert.ok(home.includes(`class="facebook-panel" href="${mosque.facebook}" target="_blank" rel="noopener noreferrer"`));
    assert.ok(home.includes(copy[lang].facebookOfficial));
    assert.ok(home.includes(copy[lang].facebookPrivacy));
    assert.equal((home.match(/class="news-topics"[\s\S]*?<\/ul>/)?.[0].match(/<li>/g) ?? []).length, 3);
    for (const topic of copy[lang].newsTopics) assert.ok(home.includes(topic));
    assert.ok(!home.includes('<iframe'));
    assert.ok(!home.includes('connect.facebook.net'));
    assert.ok(!home.includes('facebook.com/plugins'));
  }
});

test('the support banner presents clear contribution paths before the internal support page', async () => {
  for (const lang of ['sq', 'de']) {
    for (const page of ['home', 'about']) {
      const html = await readFile(resolve(output, `.${pagePath(lang, page)}`, 'index.html'), 'utf8');
      const banner = html.match(/<section class="support-banner"[\s\S]*?<\/section>/)?.[0] ?? '';
      assert.ok(banner.includes(`aria-labelledby="support-banner-heading-${lang}"`));
      assert.ok(banner.includes(`id="support-banner-heading-${lang}"`));
      assert.ok(banner.includes(`href="${pagePath(lang, 'support')}"`));
      assert.ok(banner.includes(`aria-label="${copy[lang].supportWaysLabel}"`));
      assert.equal((banner.match(/<li>/g) ?? []).length, 3);
      for (const [title] of copy[lang].supportSections) assert.ok(banner.includes(title));
      assert.ok(!banner.includes('mailto:'));
      assert.ok(!/IBAN|BIC|Kontonummer/i.test(banner));
    }
    const support = await readFile(resolve(output, `.${pagePath(lang, 'support')}`, 'index.html'), 'utf8');
    assert.ok(support.includes(`aria-labelledby="support-info-heading-${lang}"`));
  }
});

test('the support page marks deliberately invalid bank details as demonstration data', async () => {
  assert.deepEqual(demoBankDetails, {
    valid: false,
    iban: 'DE00 0000 0000 0000 0000 00',
    bic: 'BEISPIELXXX',
  });
  for (const lang of ['sq', 'de']) {
    const support = await readFile(resolve(output, `.${pagePath(lang, 'support')}`, 'index.html'), 'utf8');
    assert.ok(support.includes('data-demo-bank-details'));
    assert.ok(support.includes(copy[lang].bankDemoBadge));
    assert.ok(support.includes(copy[lang].bankDemoNotice));
    assert.ok(support.includes(`<code>${demoBankDetails.iban}</code>`));
    assert.ok(support.includes(`<code>${demoBankDetails.bic}</code>`));
    assert.ok(!/<form\b|payment|checkout|stripe/i.test(support));
    const home = await readFile(resolve(output, `.${pagePath(lang, 'home')}`, 'index.html'), 'utf8');
    assert.ok(!home.includes(demoBankDetails.iban));
    assert.ok(!home.includes(demoBankDetails.bic));
  }
});

test('the visit section presents accessible contact actions without embedding Google Maps', async () => {
  for (const lang of ['sq', 'de']) {
    const home = await readFile(resolve(output, `.${pagePath(lang, 'home')}`, 'index.html'), 'utf8');
    const contact = await readFile(resolve(output, `.${pagePath(lang, 'contact')}`, 'index.html'), 'utf8');
    assert.ok(home.includes(`aria-labelledby="visit-heading-${lang}"`));
    assert.ok(home.includes(`id="visit-heading-${lang}"`));
    assert.ok(contact.includes(`id="page-title-contact-${lang}"`));
    assert.ok(contact.includes(`aria-labelledby="page-title-contact-${lang}"`));
    for (const html of [home, contact]) {
      assert.ok(html.includes(`aria-label="${copy[lang].contactMethodsLabel}"`));
      assert.ok(html.includes(copy[lang].visitConfirm));
      assert.ok(html.includes(copy[lang].mapsPrivacy));
      assert.ok(html.includes(`class="address-card" href="${mosque.directions}" target="_blank" rel="noopener noreferrer"`));
      assert.ok(html.includes(`href="tel:${mosque.phoneHref}"`));
      assert.ok(html.includes(`href="mailto:${mosque.email}"`));
      assert.ok(!html.includes('<iframe'));
      assert.ok(!html.includes('maps.googleapis.com'));
    }
  }
});

test('the global footer exposes complete navigation, contact and legal actions', async () => {
  const footerPages = Object.keys(paths.sq);
  for (const lang of ['sq', 'de']) for (const page of footerPages) {
    const html = await readFile(resolve(output, `.${pagePath(lang, page)}`, 'index.html'), 'utf8');
    const footer = html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)?.[0] ?? '';
    assert.ok(footer.includes(`aria-labelledby="footer-heading-${lang}"`));
    assert.ok(footer.includes(`id="footer-heading-${lang}"`));
    assert.ok(footer.includes(`aria-labelledby="footer-navigation-label-${lang}"`));
    assert.ok(footer.includes(`aria-labelledby="footer-contact-label-${lang}"`));
    for (const key of ['home', 'prayer', 'about', 'community', 'contact', 'support']) {
      assert.ok(footer.includes(`class="footer-nav-link" href="${pagePath(lang, key)}"`));
    }
    assert.ok(footer.includes(`class="footer-contact-link" href="${mosque.directions}" target="_blank" rel="noopener noreferrer"`));
    assert.ok(footer.includes(`href="tel:${mosque.phoneHref}"`));
    assert.ok(footer.includes(`href="mailto:${mosque.email}"`));
    assert.ok(footer.includes(`class="footer-social-link" href="${mosque.facebook}" target="_blank" rel="noopener noreferrer"`));
    assert.ok(footer.includes(`aria-label="${copy[lang].footerLegal}"`));
    assert.ok(footer.includes(`href="${pagePath(lang, 'imprint')}"`));
    assert.ok(footer.includes(`href="${pagePath(lang, 'privacy')}"`));
    assert.ok(footer.includes(`href="${pagePath(lang === 'sq' ? 'de' : 'sq', page)}" lang=`));
    assert.ok(!footer.includes('footer-values'));
    assert.ok(!footer.includes('footer-contact-arrow'));
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
    assert.ok(!html.includes(copy[lang].prayerContact));
    assert.ok(html.includes(`class="visually-hidden" id="prayer-status-${lang}-`));
    assert.ok(html.includes('role="status"'));
    assert.ok(html.includes(`aria-describedby="prayer-status-${lang}-${page === 'home' ? 'home' : 'full'}"`));
    assert.equal((html.match(/class="prayer-time"/g) ?? []).length, 5);
    assert.equal((html.match(/data-prayer-key=/g) ?? []).length, 5);
    assert.ok(!/\b(?:06:05|13:15|16:10|18:45|20:05|13:30)\b/.test(html));
    assert.ok(!html.includes('Hermannstraße'));
    if (page === 'prayer') assert.ok(html.includes('data-date-step'));
  }
});

test('Jummah appears exactly once inside the prayer section on both homepages and detail pages', async () => {
  const files = ['index.html', 'sq/index.html', 'de/index.html', 'sq/namazi/index.html', 'de/gebetszeiten/index.html'];
  for (const file of files) {
    const html = await readFile(resolve(output, file), 'utf8');
    const section = html.match(/<section class="prayer-section[\s\S]*?<\/section>/)?.[0] ?? '';
    assert.equal((html.match(/data-public-jummah/g) ?? []).length, 1, file);
    assert.match(section, /data-prayer-key="Isha"[\s\S]*data-public-jummah[\s\S]*data-prayer-status/);
    assert.match(section, file.startsWith('de/') ? /Freitagsgebet/ : /Namazi i xhumasë/);
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
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) assert.equal(response.headers.get(name), value);
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

test('the Worker adds security headers to static assets without replacing their headers', async () => {
  const response = await worker.fetch(new Request('https://example.test/sq/'), {
    ASSETS: {
      fetch: async () => new Response('<!doctype html>', {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' },
      }),
    },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
  assert.equal(response.headers.get('cache-control'), 'public, max-age=60');
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) assert.equal(response.headers.get(name), value);
});

test('legal pages separate confirmed association data from launch blockers', async () => {
  assert.equal(legalProfile.approvedForPublicLaunch, false);
  assert.equal(legalProfile.representative, null);
  assert.equal(legalProfile.registerCourt, null);
  assert.equal(legalProfile.registerNumber, null);
  for (const lang of ['sq', 'de']) {
    const imprint = await readFile(resolve(output, `.${pagePath(lang, 'imprint')}`, 'index.html'), 'utf8');
    const privacy = await readFile(resolve(output, `.${pagePath(lang, 'privacy')}`, 'index.html'), 'utf8');
    assert.ok(imprint.includes(legalCopy[lang].status));
    assert.ok(imprint.includes(mosque.association));
    assert.ok(imprint.includes(legalCopy[lang].representedBy));
    assert.ok(imprint.includes(legalCopy[lang].registerNumber));
    assert.ok(imprint.includes(legalCopy[lang].missing));
    assert.ok(imprint.includes('https://www.gesetze-im-internet.de/ddg/__5.html'));
    assert.ok(privacy.includes(legalCopy[lang].hostingTitle));
    assert.ok(privacy.includes(legalCopy[lang].rightsTitle));
    assert.ok(privacy.includes('LfDI Baden-Württemberg'));
    assert.ok(privacy.includes('https://www.cloudflare.com/cloudflare-customer-dpa/'));
    assert.ok(!/VR\s*\d+/.test(imprint));
  }
});

test('production metadata uses the deployed origin while indexing remains blocked', async () => {
  const robots = await readFile(resolve(output, 'robots.txt'), 'utf8');
  const sitemap = await readFile(resolve(output, 'sitemap.xml'), 'utf8');
  const staticHeaders = await readFile(resolve(output, '_headers'), 'utf8');
  assert.match(robots, /Disallow: \/$/m);
  assert.ok(!robots.includes('Allow: /'));
  assert.ok(sitemap.includes(`${productionOrigin}/sq/`));
  assert.ok(sitemap.includes(`${productionOrigin}/de/datenschutz/`));
  assert.ok(!sitemap.includes('chatgpt.site'));
  assert.ok(staticHeaders.includes('X-Robots-Tag: noindex, nofollow'));
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) assert.ok(staticHeaders.includes(`${name}: ${value}`));
  for (const lang of ['sq', 'de']) for (const page of Object.keys(paths[lang])) {
    const html = await readFile(resolve(output, `.${pagePath(lang, page)}`, 'index.html'), 'utf8');
    assert.ok(html.includes(`<link rel="canonical" href="${productionOrigin}${pagePath(lang, page)}"`));
    assert.ok(html.includes(`<meta property="og:url" content="${productionOrigin}${pagePath(lang, page)}"`));
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
