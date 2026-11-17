# Shpëtimi · Xhamia Shqiptare e Tuttlingenit

Moduli 01: website publik në shqip dhe gjermanisht, sipas konceptit të miratuar në bisedë: e gjelbër e errët, krem, ar i zbehtë dhe identitet shqiptar.

Ky është projekt i veçantë nga Atelier Kuzhina në dosjen prind. Site ID dhe burimi Git janë të veçantë.

## Nisja

```sh
npm run build
npm run dev
```

Hapni http://127.0.0.1:4317. Nuk kërkohen varësi npm: përdoret Node.js 22+.

## Validimi

```sh
npm run lint
npm test
```

## Struktura

- `src/content.mjs`: kontaktet, përmbajtja dhe përkthimet.
- `src/build.mjs`: gjeneron 16 faqe statike dhe asetet SVG të identitetit.
- `dist/`: versioni që publikohet.
- `dist/assets/site.css`: identiteti dhe pamja responsive.
- `dist/assets/site.js`: menuja mobile dhe datat e orarit sipas Europe/Berlin.
- `.openai/hosting.json`: identiteti i Sites dhe direktoria statike.
- `tests/site.test.mjs`: kontrollet e rrugëve, gjuhëve, kontakteve dhe të dhënave të papublikuara.

## Përmbajtja

Kontaktet dhe emri i shoqatës janë marrë nga faqja publike https://www.facebook.com/XhamiaeTuttlingenit/, e lexuar më 9 tetor 2026. Adresa është Bergstraße 27, 78532 Tuttlingen. Nuk është përdorur adresa e vjetër Hermannstraße 8 nga katalogu i qytetit.

Orari është i papublikuar dhe nuk shfaqen orë të sajuara. Kurset, historia, imami dhe kryesia nuk kanë përmbajtje të pakonfirmuar. Facebook dhe Google Maps hapen vetëm pas klikimit. Nuk ka formular që pretendon të dërgojë mesazhe, pagesa ose panel administrimi të simuluar.

Faqet Impressum dhe Privatësia janë për plotësim para hapjes për publikun. Versioni fillestar është privat. `robots.txt` ndalon indeksimin.

## Moduli pasues

Paneli i administrimit me hyrje të mbrojtur, ruajtja e njoftimeve dhe publikimi i orareve të miratuara do të trajtohen si modul i veçantë. Ky modul ofron kontakt me email, telefon dhe burimin aktual në Facebook.

Dokumentimi për klientin, ai teknik dhe regjistri i seksioneve të përfunduara janë te
[`docs/modules/moduli-01/`](docs/modules/moduli-01/README.md).
