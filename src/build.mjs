import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { mosque, prayerSchedule, copy, paths, pagePath } from './content.mjs';

const project = resolve(import.meta.dirname, '..');
const output = resolve(project, 'dist');
const origin = 'https://xhamia-shpetimi-tuttlingen.liridonalimi.chatgpt.site';
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icons = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  external: '<path d="M7 17 17 7M7 7h10v10"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M12 6v14M12 6c-3-2-7-2-10-1v14c3-1 7-1 10 1 3-2 7-2 10-1V5c-3-1-7-1-10 1Z"/>',
  users: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 4a3 3 0 0 1 0 6m1 5a5 5 0 0 1 3 5v1"/>',
  heart: '<path d="M20.5 5.5a5 5 0 0 0-7 0L12 7l-1.5-1.5a5 5 0 0 0-7 7L12 21l8.5-8.5a5 5 0 0 0 0-7Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  phone: '<path d="m6 3 3 5-2 2c2 4 3 5 7 7l2-2 5 3-1 3c-10 2-19-7-17-17Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  facebook: '<path d="M14 21v-8h3l.5-4H14V7c0-1 .5-2 2-2h2V2h-3c-3 0-5 2-5 5v2H7v4h3v8"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
const icon = (key, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key] ?? icons.arrow}</svg>`;
const button = (href, label, secondary = false, iconName = 'arrow', external = false) => `<a class="button ${secondary ? 'button-outline' : ''}" href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(label)}${icon(iconName)}</a>`;
const mailLink = subject => `mailto:${mosque.email}?subject=${encodeURIComponent(subject)}`;

const flagSource = await readFile(resolve(project, 'src/albanian-flag-source.svg'), 'utf8');
const eagle = flagSource.replace(/<\?xml[^>]*>/, '').replace(/<svg[^>]*>/, '').replace(/<rect[^>]*\/>/, '').replace(/<\/svg>\s*$/, '');
await mkdir(resolve(output, 'assets'), { recursive: true });
await writeFile(resolve(output, 'assets/brand-mark.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120" role="img" aria-label="Shpëtimi"><path d="M9 116V49C9 30 29 18 50 5c21 13 41 25 41 44v67" fill="none" stroke="#193e31" stroke-width="6"/><path d="M56 25a13 13 0 1 0 10 19 12 12 0 0 1-10-19Z" fill="#b79654"/><g transform="translate(-13 36) scale(.18)">${eagle}</g></svg>`);
await writeFile(resolve(output, 'assets/favicon.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#193e31"/><path d="M13 53V29c0-9 10-16 19-21 9 5 19 12 19 21v24" fill="none" stroke="#d8c49a" stroke-width="3"/><path d="M36 22a11 11 0 1 0 7 15 10 10 0 0 1-7-15Z" fill="#d8c49a"/></svg>`);
await writeFile(resolve(output, 'assets/ornament.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="20" viewBox="0 0 64 20"><rect width="64" height="20" fill="#f7f4ed"/><path d="m2 10 10-9 10 9-10 9Zm32 0L44 1l10 9-10 9Z" fill="none" stroke="#b79654" stroke-width="1.5"/><path d="m6 10 6-5 6 5-6 5Zm32 0 6-5 6 5-6 5Z" fill="#193e31"/><path d="m23 1 8 9-8 9m8-18-8 9 8 9m24-18 8 9-8 9m8-18-8 9 8 9" fill="none" stroke="#193e31" stroke-width="1.8"/></svg>`);

function brand(lang) {
  return `<a class="brand" href="${pagePath(lang)}" aria-label="Shpëtimi · ${lang === 'sq' ? 'Ballina' : 'Startseite'}"><img src="/assets/brand-mark.svg" width="52" height="63" alt=""/><span class="brand-copy"><span class="wordmark">Shpëtimi</span><span class="brand-subtitle">${lang === 'sq' ? 'Xhamia Shqiptare e Tuttlingenit' : 'Albanische Moschee Tuttlingen'}</span></span></a>`;
}
function header(lang, page) {
  const t = copy[lang];
  return `<a class="skip-link" href="#main">${t.skip}</a><div class="topline"><div class="container"><span>${t.welcome}</span><span>${t.country}</span></div></div>
  <header class="site-header"><div class="header-inner container">${brand(lang)}<div class="header-controls"><nav id="main-navigation" class="navigation" aria-label="${lang === 'sq' ? 'Navigimi kryesor' : 'Hauptnavigation'}">${['home', 'prayer', 'about', 'community', 'contact', 'support'].map(key => `<a href="${pagePath(lang, key)}"${key === 'support' ? ' class="navigation-cta"' : ''}${key === page ? ' aria-current="page"' : ''}>${t.nav[key]}</a>`).join('')}</nav><div class="language-switch" role="group" aria-label="${lang === 'sq' ? 'Gjuha' : 'Sprache'}"><a href="${pagePath('sq', page)}" lang="sq" aria-label="Shqip"${lang === 'sq' ? ' aria-current="true"' : ''}>SQ</a><span aria-hidden="true">/</span><a href="${pagePath('de', page)}" lang="de" aria-label="Deutsch"${lang === 'de' ? ' aria-current="true"' : ''}>DE</a></div><button class="menu-button" type="button" data-menu-button data-open="${t.menu}" data-close="${t.closeMenu}" aria-controls="main-navigation" aria-expanded="false" aria-label="${t.menu}">${icon('menu')}</button></div></div></header><div class="ornament" aria-hidden="true"></div>`;
}
function prayers(lang, full = false) {
  const t = copy[lang];
  const statusId = `prayer-status-${lang}-${full ? 'full' : 'home'}`;
  const dateAction = full
    ? prayerSchedule.approved
      ? `<div class="date-controls"><button type="button" data-date-step="-1" aria-label="${t.previous}">${icon('chevron', 'rotate')}</button><button type="button" data-date-step="1" aria-label="${t.next}">${icon('chevron')}</button><button type="button" class="today-button" data-date-reset hidden>${t.backToday}</button></div>`
      : ''
    : `<a href="${pagePath(lang, 'prayer')}">${t.timetable}${icon('arrow')}</a>`;
  return `<section class="prayer-section ${full ? 'prayer-full' : ''}" aria-labelledby="prayer-heading"><div class="container"><div class="prayer-top"><div><span class="eyebrow light">${t.prayerTitle}</span><h2 id="prayer-heading">${lang === 'sq' ? 'Një çast për namaz.' : 'Ein Moment für das Gebet.'}</h2></div><div class="prayer-date"><time data-prayer-date aria-live="polite"></time>${dateAction}</div></div><div class="prayer-grid" aria-describedby="${statusId}">${['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name, index) => `<div class="prayer-item"><span class="prayer-name">${name}</span><span class="prayer-time" data-prayer-key="${name}" data-prayer-label="${esc(t.prayers[index])}" aria-label="${esc(t.prayerLoading)}">—</span><span class="prayer-local">${t.prayers[index]}</span></div>`).join('')}</div><div class="prayer-status" id="${statusId}" role="status" data-prayer-status data-loading="${esc(t.prayerLoading)}" data-ready="${esc(t.prayerStatus)}" data-error="${esc(t.prayerPending)}" data-method="${esc(t.prayerMethod)}" data-disclaimer="${esc(t.prayerDisclaimer)}"><span class="status-dot" aria-hidden="true"></span><div class="prayer-status-copy"><strong data-prayer-status-title>${t.prayerLoading}</strong><span data-prayer-status-detail>${t.prayerMethod}</span></div><a class="text-link" href="${pagePath(lang, 'contact')}">${t.prayerContact}${icon('arrow')}</a></div></div></section>`;
}
function communityCards(lang, context = 'home') {
  const t = copy[lang];
  const targets = [
    { href: pagePath(lang, 'contact') },
    context === 'community'
      ? { href: mosque.facebook, external: true, label: t.facebookCta }
      : { href: pagePath(lang, 'community') },
    { href: pagePath(lang, 'support') },
  ];
  return `<div class="community-grid">${t.cards.map((card, index) => {
    const target = targets[index];
    const cardId = `community-card-${lang}-${context}-${index + 1}`;
    return `<article class="community-card" aria-labelledby="${cardId}"><div class="card-top"><div class="card-icon">${icon(card.icon)}</div><span class="card-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span></div><h3 id="${cardId}">${card.title}</h3><p>${card.text}</p><a class="text-link card-link" href="${target.href}"${target.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${target.label ?? card.cta}${icon(target.external ? 'external' : 'arrow')}</a></article>`;
  }).join('')}</div>`;
}
function aboutValues(lang) {
  const t = copy[lang];
  const label = lang === 'sq' ? 'Vlerat tona' : 'Unsere Werte';
  return `<ul class="about-values-list" aria-label="${label}">${t.values.map((value, index) => `<li><span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><strong>${esc(value)}</strong></li>`).join('')}</ul>`;
}
function supportBanner(lang) {
  const t = copy[lang];
  return `<section class="support-banner"><div class="container support-inner"><div><span class="eyebrow">${lang === 'sq' ? 'Një kontribut për bashkësinë' : 'Ein Beitrag für die Gemeinde'}</span><h2>${t.supportTitle}</h2><p>${t.supportText}</p></div>${button(pagePath(lang, 'support'), t.supportCta, false, 'heart')}</div></section>`;
}
function visit(lang, heading = true) {
  const t = copy[lang];
  return `<section class="visit-section container"><div class="visit-copy">${heading ? `<span class="eyebrow">${t.visitEyebrow}</span><h2>${t.visitTitle.replace('\n', '<br>')}</h2><p>${t.visitText}</p>` : ''}<div class="contact-rows"><div>${icon('pin')}<div><span>${t.address}</span><p>${mosque.street}<br>${mosque.postalCode} ${mosque.city}</p></div></div><div>${icon('phone')}<div><span>${t.call}</span><a href="tel:${mosque.phoneHref}">${mosque.phone}</a></div></div><div>${icon('mail')}<div><span>${t.email}</span><a href="mailto:${mosque.email}">${mosque.email}</a></div></div></div><div class="visit-actions">${button(mosque.directions, t.directions, false, 'external', true)}<a class="text-link" href="tel:${mosque.phoneHref}">${t.call}${icon('phone')}</a></div></div><div class="address-card"><div class="address-arch" aria-hidden="true">${icon('pin')}</div><span class="eyebrow">Tuttlingen · 78532</span><h3>Bergstraße <span>27</span></h3><p>${t.contactNote}</p><a class="text-link" href="${mosque.directions}" target="_blank" rel="noopener noreferrer">Google Maps${icon('external')}</a></div></section>`;
}
function footer(lang) {
  const t = copy[lang];
  return `<div class="ornament" aria-hidden="true"></div><footer class="site-footer"><div class="container footer-grid"><div>${brand(lang)}<p>${t.footerText}</p><p class="association">${esc(mosque.association)}</p></div><div><span class="footer-label">${t.footerLinks}</span><nav aria-label="${lang === 'sq' ? 'Navigimi në fund' : 'Footernavigation'}">${['about', 'prayer', 'community', 'support'].map(key => `<a href="${pagePath(lang, key)}">${t.nav[key]}</a>`).join('')}</nav></div><div><span class="footer-label">${t.footerContact}</span><address>${mosque.street}<br>${mosque.postalCode} ${mosque.city}<a href="tel:${mosque.phoneHref}">${mosque.phone}</a><a href="mailto:${mosque.email}">${mosque.email}</a></address><a class="social-link" href="${mosque.facebook}" target="_blank" rel="noopener noreferrer" aria-label="Facebook · Xhamia e Tuttlingenit">${icon('facebook')}Facebook${icon('external')}</a></div></div><div class="container footer-bottom"><span>© ${new Date().getUTCFullYear()} Shpëtimi · Tuttlingen</span><div><a href="${pagePath(lang, 'imprint')}">${t.nav.imprint}</a><a href="${pagePath(lang, 'privacy')}">${t.nav.privacy}</a></div></div></footer>`;
}
function home(lang) {
  const t = copy[lang];
  return `<section class="hero"><div class="hero-copy"><span class="eyebrow">${t.eyebrow}</span><h1>${t.headline}<br><em>${t.headlineEm}</em></h1><p>${t.intro}</p><div class="hero-actions">${button(pagePath(lang, 'prayer'), t.prayerCta)}${button(pagePath(lang, 'contact'), t.visitCta, true)}</div><a class="hero-location" href="${mosque.directions}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t.directions)}: ${esc(mosque.street)}, ${esc(mosque.postalCode)} ${esc(mosque.city)}">${icon('pin')}<span>${esc(mosque.street)} · ${esc(mosque.city)}</span></a></div><figure class="hero-art"><img src="/assets/hero.jpg" srcset="/assets/hero-640.jpg 640w, /assets/hero.jpg 1024w" sizes="(max-width: 600px) 100vw, 50vw" alt="${t.artAlt}" width="1024" height="1536" fetchpriority="high" decoding="async"/><figcaption>${t.artCaption}</figcaption></figure></section>
  ${prayers(lang)}
  <section class="community-section container" aria-labelledby="community-heading-${lang}"><div class="section-heading"><span class="eyebrow">${t.communityEyebrow}</span><h2 id="community-heading-${lang}">${t.communityTitle}</h2><p>${t.communityIntro}</p></div>${communityCards(lang)}</section>
  <section class="about-section container" aria-labelledby="about-heading-${lang}"><div class="about-art" aria-hidden="true"><div class="about-symbol"><img src="/assets/brand-mark.svg" alt="" width="130" height="156"/><span>Shpëtimi</span></div><span class="about-art-caption">${t.values.join(' · ')}</span></div><div class="about-copy"><span class="eyebrow">${t.aboutEyebrow}</span><h2 id="about-heading-${lang}">${t.aboutTitle.replace('\n', '<br>')}</h2><p>${t.aboutText}</p><div class="about-association"><span>${lang === 'sq' ? 'Shoqata' : 'Verein'}</span><strong>${esc(mosque.association)}</strong></div>${aboutValues(lang)}<a class="text-link about-link" href="${pagePath(lang, 'about')}">${t.aboutMore}${icon('arrow')}</a></div></section>
  <section class="news-section container"><div><span class="eyebrow">${t.newsEyebrow}</span><h2>${t.newsTitle}</h2><p>${t.newsText}</p>${button(mosque.facebook, t.facebookCta, true, 'external', true)}</div><div class="facebook-panel"><div class="facebook-icon">${icon('facebook')}</div><span class="eyebrow">Facebook</span><h3>Xhamia e Tuttlingenit</h3><p>${t.facebookNote}</p><a href="${mosque.facebook}" class="text-link" target="_blank" rel="noopener noreferrer">@XhamiaeTuttlingenit${icon('external')}</a></div></section>
  ${supportBanner(lang)}${visit(lang)}`;
}
function pageIntro(lang, page) {
  const t = copy[lang];
  return `<section class="page-intro container"><a class="breadcrumb" href="${pagePath(lang)}">${t.nav.home} ${icon('chevron')} ${t.nav[page]}</a><span class="eyebrow">${t.eyebrow}</span><h1>${t.pageTitles[page]}</h1><p>${t.pageDescriptions[page]}</p></section>`;
}
function editorial(sections, lang, contact = false) {
  return `<section class="editorial container">${sections.map(([title, text], index) => `<article class="editorial-row"><span class="editorial-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><h2>${title}</h2><div><p>${text}</p>${contact ? `<a class="text-link" href="${mailLink(title)}">${copy[lang].email}${icon('arrow')}</a>` : ''}</div></article>`).join('')}</section>`;
}
function innerPage(lang, page) {
  const t = copy[lang];
  const intro = pageIntro(lang, page);
  if (page === 'prayer') return `${intro}${prayers(lang, true)}${editorial(t.prayerSections, lang)}<div class="container inline-cta">${button(`tel:${mosque.phoneHref}`, t.call, false, 'phone')}${button(mosque.facebook, t.facebookCta, true, 'external', true)}</div>`;
  if (page === 'about') return `${intro}<section class="about-page-art container" aria-labelledby="about-page-heading-${lang}"><img src="/assets/hero.jpg" width="1024" height="1536" alt="${t.artAlt}"/><div><span class="eyebrow">Shpëtimi</span><h2 id="about-page-heading-${lang}">${t.aboutTitle.replace('\n', '<br>')}</h2><p>${t.aboutText}</p><div class="about-association"><span>${lang === 'sq' ? 'Shoqata' : 'Verein'}</span><strong>${esc(mosque.association)}</strong></div>${aboutValues(lang)}</div></section>${editorial(t.aboutSections, lang)}${supportBanner(lang)}`;
  if (page === 'community') return `${intro}<section class="container inner-cards" aria-label="${esc(t.communityTitle)}">${communityCards(lang, 'community')}</section>${editorial(t.communitySections, lang, true)}<section class="container facebook-callout"><div>${icon('facebook')}<h2>Xhamia e Tuttlingenit</h2><p>${t.newsText}</p></div>${button(mosque.facebook, t.facebookCta, false, 'external', true)}</section>`;
  if (page === 'support') return `${intro}${editorial(t.supportSections, lang, true)}<section class="container support-info"><div>${icon('heart')}<h2>${t.supportTitle}</h2><p>${t.supportText}</p></div>${button(mailLink(t.supportCta), t.supportCta)}</section>`;
  if (page === 'contact') return `${intro}${visit(lang, false)}<div class="container contact-footnote"><p>${t.contactNote}</p><a class="text-link" href="${mosque.facebook}" target="_blank" rel="noopener noreferrer">${t.facebookCta}${icon('external')}</a></div>`;
  if (page === 'imprint' || page === 'privacy') return `${intro}<section class="legal-section container"><span class="legal-status">${t.legalDraft}</span><h2>${t.legalHeading}</h2><p>${page === 'imprint' ? t.imprintText : t.privacyText}</p>${page === 'imprint' ? `<address><strong>${esc(mosque.association)}</strong><br>${mosque.street}<br>${mosque.postalCode} ${mosque.city}<br><a href="tel:${mosque.phoneHref}">${mosque.phone}</a><br><a href="mailto:${mosque.email}">${mosque.email}</a></address><p class="legal-missing">${t.missingLegal}</p>` : ''}</section>`;
  throw new Error(`Unknown page: ${page}`);
}
function document(lang, page) {
  const t = copy[lang];
  const title = page === 'home' ? `${mosque.publicName} · Shpëtimi` : `${t.nav[page]} · Shpëtimi Tuttlingen`;
  const description = page === 'home' ? t.intro : t.pageDescriptions[page];
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${esc(title)}</title><meta name="description" content="${esc(description)}"/><meta name="theme-color" content="#193e31"/><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"/><link rel="canonical" href="${origin}${pagePath(lang, page)}"/>${['sq','de'].map(language => `<link rel="alternate" hreflang="${language}" href="${origin}${pagePath(language, page)}"/>`).join('')}<meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(description)}"/><meta property="og:type" content="website"/><meta property="og:url" content="${origin}${pagePath(lang, page)}"/><meta property="og:image" content="${origin}/assets/hero.jpg"/><link rel="stylesheet" href="/assets/site.css"/><script defer src="/assets/site.js"></script></head><body data-page="${page}">${header(lang, page)}<main id="main">${page === 'home' ? home(lang) : innerPage(lang, page)}</main>${footer(lang)}</body></html>`;
}
const sitemap = [];
for (const lang of ['sq', 'de']) {
  for (const page of Object.keys(paths[lang])) {
    const file = resolve(output, `.${pagePath(lang, page)}`, 'index.html');
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, document(lang, page));
    sitemap.push(`${origin}${pagePath(lang, page)}`);
  }
}
await writeFile(resolve(output, 'index.html'), document('sq', 'home'));
await writeFile(resolve(output, '404.html'), `<!doctype html><html lang="sq"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 · Shpëtimi</title><link rel="stylesheet" href="/assets/site.css"></head><body><main class="page-intro container"><span class="eyebrow">404</span><h1>Faqja nuk u gjet.</h1><p>Seite nicht gefunden.</p><a class="button" href="/sq/">Kthehu në ballinë →</a></main></body></html>`);
await writeFile(resolve(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemap.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`);
await writeFile(resolve(output, 'robots.txt'), `User-agent: *\nDisallow: /\n# Private review version. Enable indexing after legal and community approval.\n`);
console.log(`Built ${sitemap.length} bilingual pages, homepage, brand assets, sitemap and 404.`);
