import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { paths, pagePath, mosque, approvedTimes, copy } from '../src/content.mjs';

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

test('unconfirmed prayer times are never presented as real times', async () => {
  assert.equal(approvedTimes('2026-10-09'), null);
  for (const lang of ['sq', 'de']) for (const page of ['home', 'prayer']) {
    const html = await readFile(resolve(output, `.${pagePath(lang, page)}`, 'index.html'), 'utf8');
    assert.ok(html.includes(copy[lang].prayerPending));
    assert.equal((html.match(/class="prayer-time"/g) ?? []).length, 5);
    assert.ok(!/\b(?:06:05|13:15|16:10|18:45|20:05|13:30)\b/.test(html));
    assert.ok(!html.includes('Hermannstraße'));
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
  assert.ok(!/fetch\(|localStorage|document\.cookie|XMLHttpRequest/.test(js));
});
