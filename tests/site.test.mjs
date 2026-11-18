import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { paths, pagePath, mosque, prayerSchedule, approvedTimes, demoBankDetails, copy } from '../src/content.mjs';
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
    assert.equal((footer.match(/class="footer-values"[\s\S]*?<\/ul>/)?.[0].match(/<li>/g) ?? []).length, 3);
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
