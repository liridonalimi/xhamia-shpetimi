# Moduli 01 · Dokumentimi teknik

## Arkitektura

Website statik i gjeneruar me Node.js, pa framework ose varësi të jashtme. Gjenerohen faqe HTML të plota në `/sq/` dhe `/de/`, me metadata, canonical dhe alternate hreflang. Root shfaq ballinën shqip. Faqja ruan përmbajtje të lexueshme edhe pa JavaScript; JS shton menunë mobile dhe datat e orarit.

Përmbajtja menaxhohet nga `src/content.mjs`. Asetet SVG janë të riprodhueshme nga build. Ilustrimi i gjeneruar është ruajtur në projekt si JPEG. Kontakti përdor `mailto:` dhe `tel:`; nuk kërkon backend. Nuk ngarkohen embeds ose font-e të palëve të treta.

## Datat dhe namazi

Klienti përdor Europe/Berlin për datën aktuale, edhe nëse vizitori ndodhet në një zonë tjetër. Orari ende nuk ka të dhëna të miratuara. Navigimi i ditëve nuk prodhon orare të sajuara. Integrimi i të dhënave të orarit është pjesë e modulit pasues.

## Aksesueshmëria

HTML semantik, skip link, një H1 për faqe, kontrolle native, aria-current, aria-expanded, menynë mobile e mbyll Escape, fokus i dukshëm dhe prefers-reduced-motion. Versioni mobile do të kontrollohet në browser.

## Kontrollet

`npm run build`: gjenerimi i faqeve.

`npm run lint`: kontrolli i sintaksës JavaScript; nuk pretendon kontroll ESLint të stileve ose HTML-së.

`npm test`: rrugët dhe asetet, përkthimet, ndërrimi i gjuhës, kontaktet, mungesa e orareve të sajuara, draftet ligjore dhe mosngarkimi automatik i palëve të treta.

## Rezultatet e validimit · 9 tetor 2026

- Build: gjenerohen 16 faqe dygjuhëshe dhe ballina root pa gabime.
- Sintaksa: kontrolli JavaScript kalon.
- Teste: 5 teste automatike kalojnë; përfshijnë të gjitha rrugët dhe asetet lokale.
- Browser: ndërrimi i gjuhës në ballinë dhe kontakt ruan faqen; imazhet ngarkohen; nuk ka overflow në 1440, 390 dhe 320 px.
- Mobile: menuja hapet, navigon dhe mbyllet me Escape; datat ndryshojnë dhe rivendosen; shqipja ka emra muajsh shqip pavarësisht mbështetjes së locale nga browser-i.

Versioni është i destinuar për shqyrtim privat në Sites. Nuk ka CMS ose bazë të dhënash në këtë modul. Informacionet ligjore dhe orari zyrtar ende kërkojnë plotësim nga bashkësia.
