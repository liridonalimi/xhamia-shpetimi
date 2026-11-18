# Seksioni 08 · Vizita dhe kontakti

Data e përfundimit: 18 nëntor 2026

Statusi: Përfunduar dhe publikuar në Production

Branch i implementimit: `feature/visit-contact-section`

Pull request: [#18 · Improve visit and contact section](https://github.com/liridonalimi/xhamia-shpetimi/pull/18)

## Qëllimi

Të përmirësohet seksioni “Ju mirëpresim në Tuttlingen” në homepage dhe faqja Kontakt, në mënyrë që vizitori ta gjejë lehtë adresën, telefonin dhe emailin e xhamisë. Seksioni duhet të funksionojë në shqip dhe gjermanisht, të jetë i aksesueshëm dhe të mos ngarkojë hartë ose tracker të jashtëm pa veprimin e vizitorit.

## Informacioni i paraqitur

| Fusha | Vlera |
| --- | --- |
| Adresa | Bergstraße 27, 78532 Tuttlingen |
| Telefoni | 0172 6292358 |
| Email | shpetimixhamia@gmail.com |
| Drejtimet | Google Maps, vetëm pas klikimit |

Vizitori këshillohet ta konfirmojë vizitën para nisjes. Informacioni për oraret e vizitës, parkimin dhe aksesin nuk paraqitet si i konfirmuar; për këto detaje kërkohet kontakt direkt me xhaminë.

## Ndryshimet

- Seksioni u lidh me heading-un përkatës përmes `aria-labelledby`.
- Homepage-i përdor heading-un `visit-heading-sq` ose `visit-heading-de`.
- Faqja Kontakt përdor titullin e faqes si heading të seksionit.
- Adresa, telefoni dhe emaili u kthyen në karta veprimi të klikueshme.
- Adresa dhe karta vizuale hapin Google Maps në tab të ri.
- Lidhjet e jashtme përdorin `target="_blank"` dhe `rel="noopener noreferrer"`.
- U shtua njoftimi për konfirmimin paraprak të vizitës.
- U shtua shpjegimi se Google Maps hapet vetëm pas klikimit.
- Nuk ngarkohet hartë, `iframe`, Google Maps API ose tracker automatik.
- U krijua `section-08.css` për ta izoluar stilin nga seksionet e miratuara më parë.
- Stylesheet-i ngarkohet vetëm në homepage dhe faqen Kontakt.
- U shtuan gjendje hover/focus dhe mbështetje për `prefers-reduced-motion`.
- Layout-i u përshtat për desktop, tablet dhe telefon.
- U shtua test automatik i posaçëm për Seksionin 8.

## Përmbajtja sipas gjuhës

| Elementi | Shqip | Gjermanisht |
| --- | --- | --- |
| Titulli | Ju mirëpresim në Tuttlingen. | Willkommen in Tuttlingen. |
| Njoftimi | Ju lutemi konfirmoni vizitën para se të niseni. | Bitte stimmen Sie Ihren Besuch ab, bevor Sie sich auf den Weg machen. |
| Drejtimet | Si të na gjeni | Route planen |
| Telefoni | Na telefononi | Anrufen |
| Email | Na shkruani | E-Mail schreiben |
| CTA e adresës | Hap adresën në Google Maps | Adresse in Google Maps öffnen |

## Skedarët kryesorë të ndryshuar

- `src/content.mjs`
- `src/build.mjs`
- `dist/assets/section-08.css`
- `tests/site.test.mjs`
- `dist/index.html`
- `dist/sq/index.html`
- `dist/de/index.html`
- `dist/sq/kontakt/index.html`
- `dist/de/kontakt/index.html`

## Komandat e ekzekutuara

### 1. Kontrolli bazë dhe branch-i

```bash
git status --short --branch
git log -5 --oneline
npm run build
npm run lint
npm test
git switch -c feature/visit-contact-section
```

Rezultati fillestar: `main` ishte i pastër; build dhe lint kaluan; 13/13 teste kaluan.

### 2. Inspektimi i implementimit ekzistues

```bash
rg -n -C 20 "visit-section|visit-grid|visit-card|visitTitle|contactNote|renderVisit|directions" \
  src/build.mjs dist/assets/site.css tests/site.test.mjs

sed -n '1,145p' src/build.mjs
nl -ba tests/site.test.mjs | sed -n '1,230p'
```

Rezultati: seksioni kishte kontaktet bazë, por nuk kishte heading semantik, njoftim privatësie për hartën ose test të posaçëm.

### 3. Implementimi dhe validimi

Pas ndryshimeve në përmbajtje, markup, stil dhe teste u ekzekutuan:

```bash
npm run build
npm run lint
npm test
git diff --check

rg -n -o 'aria-labelledby="visit-heading-(sq|de)"|id="visit-heading-(sq|de)"|class="visit-confirm"|class="contact-method"|class="address-card"' \
  dist/sq/index.html dist/de/index.html \
  dist/sq/kontakt/index.html dist/de/kontakt/index.html
```

Rezultati:

```text
Build       kaloi
Lint        kaloi
Tests       14/14 kaluan
Diff check  pa gabime
```

### 4. Commit-i dhe Pull Request-i

```bash
git add src/content.mjs src/build.mjs tests/site.test.mjs \
  dist/assets/section-08.css dist/index.html \
  dist/sq/index.html dist/de/index.html \
  dist/sq/kontakt/index.html dist/de/kontakt/index.html

git commit -m "Improve visit and contact section"
git push -u origin feature/visit-contact-section

gh pr create --base main --head feature/visit-contact-section \
  --title "Improve visit and contact section" \
  --body "..."
```

Commit-i i implementimit: `1276d3d`.

Pull request: [#18](https://github.com/liridonalimi/xhamia-shpetimi/pull/18).

### 5. Cloudflare Preview

```bash
gh pr checks 18 --watch --interval 10

curl --fail --silent --show-error \
  --output /tmp/xhamia-section8-preview-sq.html \
  --write-out 'SQ Home: %{http_code}\n' \
  https://feature-visit-contact-section-xhamia-shpetimi.liridon-halimi.workers.dev/sq/
```

Të njëjtat kontrolle u ekzekutuan për homepage-in DE dhe faqet Kontakt SQ/DE. Kërkesa e parë mori një `404` kalimtar gjatë krijimit të Preview-it; pas retry-t, të gjitha faqet kthyen `HTTP 200`.

Kontrolli final:

```text
Workers Builds: xhamia-shpetimi   pass
SQ Home                            HTTP 200
DE Home                            HTTP 200
SQ Contact                         HTTP 200
DE Contact                         HTTP 200
section-08.css                     HTTP 200
```

Në Preview u verifikuan lidhjet Google Maps, telefon dhe email. Nuk u gjet hartë e integruar, `iframe` ose tracker automatik.

Përdoruesi e kontrolloi implementimin dhe bëri merge PR #18.

### 6. Merge dhe sinkronizimi

```bash
git status --short --branch
gh pr view 18 --json state,mergedAt,mergeCommit,url,title
git switch main
git pull --ff-only origin main
git status --short --branch
git log -4 --oneline
```

Merge commit: `280c305c2fdf79bb9ee640e4915430f3aaca2009`.

### 7. Verifikimi në Production

```bash
curl --fail --silent --show-error \
  --output /tmp/xhamia-section8-production-sq.html \
  --write-out 'SQ Home: %{http_code}\n' \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/

curl --fail --silent --show-error \
  --output /tmp/xhamia-section8-production-contact-sq.html \
  --write-out 'SQ Contact: %{http_code}\n' \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/kontakt/
```

Të njëjtat kontrolle u ekzekutuan për gjermanishten. Stylesheet-i dhe marker-at e seksionit u kontrolluan veçmas me `curl` dhe `rg`.

Rezultati:

```text
SQ Home          HTTP 200
DE Home          HTTP 200
SQ Contact       HTTP 200
DE Contact       HTTP 200
section-08.css   HTTP 200, 3256 bytes
Privacy check    pa hartë të integruar ose tracker
Build            kaloi
Lint             kaloi
Tests            14/14 kaluan
```

## Adresat e validimit

- Production: <https://xhamia-shpetimi.liridon-halimi.workers.dev>
- Homepage SQ: <https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/>
- Homepage DE: <https://xhamia-shpetimi.liridon-halimi.workers.dev/de/>
- Kontakt SQ: <https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/kontakt/>
- Kontakt DE: <https://xhamia-shpetimi.liridon-halimi.workers.dev/de/kontakt/>
- Preview: <https://feature-visit-contact-section-xhamia-shpetimi.liridon-halimi.workers.dev>
- Pull request: <https://github.com/liridonalimi/xhamia-shpetimi/pull/18>

## Kriteret e pranimit

- [x] Seksioni shfaqet në SQ dhe DE.
- [x] Adresa, telefoni dhe emaili janë të klikueshme.
- [x] Adresa e saktë është Bergstraße 27, 78532 Tuttlingen.
- [x] Google Maps hapet vetëm pas klikimit.
- [x] Nuk ngarkohet hartë, `iframe`, API ose tracker automatik.
- [x] Vizitori këshillohet ta konfirmojë vizitën paraprakisht.
- [x] Informacioni i pakonfirmuar për oraret, parkimin dhe aksesin nuk paraqitet si fakt.
- [x] Heading-et lidhen semantikisht me seksionin.
- [x] Lidhjet e jashtme përdorin atributet e sigurisë.
- [x] Fokusimi me tastierë është i dukshëm.
- [x] `prefers-reduced-motion` respektohet.
- [x] Layout-i funksionon në desktop dhe mobile.
- [x] Build, lint dhe 14/14 teste automatike kalojnë.
- [x] Cloudflare Preview kaloi dhe u kontrollua para merge-it.
- [x] Versioni Production u verifikua pas merge-it.
