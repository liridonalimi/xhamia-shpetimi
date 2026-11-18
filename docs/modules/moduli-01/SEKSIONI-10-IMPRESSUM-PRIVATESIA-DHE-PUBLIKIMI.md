# Seksioni 10 · Impressum, Privatësia dhe përgatitja për publikim

Data e përfundimit teknik: 18 nëntor 2026

Statusi: Implementimi teknik është përfunduar dhe publikuar në Production. Miratimi ligjor dhe të dhënat e regjistrit mbeten për t’u plotësuar nga shoqata para indeksimit publik.

Branch i implementimit: `feature/legal-privacy-readiness`

Pull request: [#22 · Prepare legal pages and launch safeguards](https://github.com/liridonalimi/xhamia-shpetimi/pull/22)

Merge commit: `2d618fede90cd497e7438f161c94279014eac3a5`

## Qëllimi

Të ndërtohen faqe ligjore të qarta në shqip dhe gjermanisht, të ndahen faktet e konfirmuara nga informacioni që mungon dhe website-i të mbetet i mbrojtur nga indeksimi derisa shoqata të konfirmojë përfaqësuesin ligjor, regjistrin dhe deklaratën përfundimtare të privatësisë.

Ky seksion është një implementim dhe draft teknik. Ai nuk paraqitet si këshillë ligjore ose si deklaratë ligjore e miratuar.

## Ndryshimet

- U krijua `legalProfile` si burim i vetëm për statusin e publikimit dhe fushat ligjore.
- Fushat e pakonfirmuara ruhen si `null`; nuk përdoren emra ose numra regjistri të sajuar.
- Impressum paraqet emrin e shoqatës, adresën, telefonin dhe emailin e konfirmuar.
- Përfaqësuesi, gjykata e regjistrit dhe numri i regjistrimit shënohen qartë si të paplotësuara.
- Numri i TVSH-së kërkohet vetëm nëse një numër i tillë ekziston.
- Privatësia u nda në dhjetë pjesë të lexueshme në SQ dhe DE.
- U dokumentua hostimi me Cloudflare Workers & Pages dhe përpunimi i mundshëm i të dhënave teknike të kërkesës.
- U dokumentua rrjedha e orarit: browser-i kontakton Worker-in, ndërsa Worker-i kërkon AlAdhan me datën dhe koordinatat fikse të xhamisë.
- U sqarua se Facebook dhe Google Maps hapen vetëm pas klikimit.
- U sqarua se website-i nuk ka formular kontakti, analiza vizitorësh, reklama, cookies, `localStorage`, profilizim ose vendimmarrje automatike.
- U shtuan të drejtat e personit dhe kontakti i LfDI Baden-Württemberg.
- U shtuan lidhje drejt § 5 DDG, Cloudflare DPA dhe LfDI Baden-Württemberg.
- U krijua checklist-a që duhet përfunduar para publikimit të plotë.
- Canonical, Open Graph dhe sitemap u korrigjuan nga URL-ja e vjetër `chatgpt.site` në URL-në reale të Production.
- Çdo faqe publike merr `meta name="robots" content="noindex,nofollow"` sa kohë publikimi nuk është miratuar.
- `robots.txt` gjenerohet nga i njëjti status dhe vazhdon me `Disallow: /`.
- Edhe faqja 404 ka `noindex,nofollow`.
- U krijua `section-10.css`, e ngarkuar vetëm në Impressum dhe Privatësi.
- U shtuan layout responsive, karta ligjore, statusi i gatishmërisë dhe fushat e paplotësuara.
- Testet kontrollojnë metadata, sitemap, robots, të dhënat ligjore dhe mungesën e placeholder-ëve të rremë.

## Të dhënat e konfirmuara

| Fusha | Vlera |
| --- | --- |
| Shoqata | Qendra Shqiptare Kulturore Islame Shpëtimi e.V. |
| Adresa | Bergstraße 27, 78532 Tuttlingen |
| Telefoni | 0172 6292358 |
| Email | shpetimixhamia@gmail.com |
| Hosting | Cloudflare Workers & Pages |
| URL Production | `https://xhamia-shpetimi.liridon-halimi.workers.dev` |

## Të dhënat që mungojnë

- personi ose personat me të drejtë përfaqësimi;
- gjykata/regjistri i shoqatës;
- numri i regjistrimit;
- numri i TVSH-së, vetëm nëse ekziston;
- verifikimi i konfigurimit konkret të Cloudflare dhe afateve të logjeve;
- kontrolli dhe miratimi ligjor i deklaratës së privatësisë.

Derisa këto pika të konfirmohen, `legalProfile.approvedForPublicLaunch` mbetet `false` dhe indeksimi publik nuk aktivizohet.

## Burimet zyrtare të përdorura

- [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html)
- [Neni 13 DSGVO](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679)
- [LfDI Baden-Württemberg](https://www.baden-wuerttemberg.datenschutz.de/kontakt-aufnehmen/)
- [Cloudflare Data Processing Addendum](https://www.cloudflare.com/cloudflare-customer-dpa/)

## Skedarët kryesorë të ndryshuar

- `src/content.mjs`
- `src/build.mjs`
- `dist/assets/section-10.css`
- `tests/site.test.mjs`
- `dist/404.html`
- `dist/sitemap.xml`
- të gjitha faqet e gjeneruara në `dist/sq/`
- të gjitha faqet e gjeneruara në `dist/de/`

## Komandat e ekzekutuara

### 1. Kontrolli bazë

```bash
git status --short --branch
git log -4 --oneline
rg -n -C 12 "legalDraft|imprintText|privacyText|missingLegal|legal-section|robots.txt|sitemap|const origin|page === 'imprint'" \
  src dist tests README.md
npm run build
npm run lint
npm test
```

Rezultati fillestar: `main` ishte i pastër dhe në sinkron me `origin/main`; build dhe lint kaluan; 15/15 teste kaluan. Kontrolli zbuloi se canonical dhe sitemap përdornin ende URL-në e vjetër `chatgpt.site`.

### 2. Krijimi i branch-it

```bash
git switch -c feature/legal-privacy-readiness
```

### 3. Implementimi dhe validimi

```bash
npm run build
npm run lint
npm test
git diff --check
git status --short
```

Rezultati:

```text
Build       kaloi
Lint        kaloi
Tests       16/16 kaluan
Diff check  pa gabime
```

### 4. Commit-i dhe Pull Request-i

```bash
git add src/build.mjs src/content.mjs tests/site.test.mjs dist
git commit -m "Prepare legal pages and launch safeguards"
git push -u origin feature/legal-privacy-readiness

gh pr create --base main --head feature/legal-privacy-readiness \
  --title "Prepare legal pages and launch safeguards" \
  --body "..."
```

Commit-i i implementimit: `9f25d99`.

Pull request: [#22](https://github.com/liridonalimi/xhamia-shpetimi/pull/22).

### 5. Cloudflare Preview

```bash
gh pr checks 22 --watch --interval 10

curl --fail --silent --show-error --location \
  --output /dev/null --write-out 'SQ Impressum: %{http_code}\n' \
  https://feature-legal-privacy-readiness-xhamia-shpetimi.liridon-halimi.workers.dev/sq/impressum/
```

Të njëjtat kontrolle u ekzekutuan për Privatësinë SQ, Impressum DE, Datenschutz DE, `section-10.css` dhe `robots.txt`.

```text
Workers Builds: xhamia-shpetimi   pass
SQ Impressum                       HTTP 200
SQ Privatësia                      HTTP 200
DE Impressum                       HTTP 200
DE Datenschutz                     HTTP 200
section-10.css                     HTTP 200
robots.txt                         Disallow: /
```

### 6. Merge dhe sinkronizimi

Përdoruesi bëri merge PR #22.

```bash
gh pr view 22 --json state,mergedAt,mergeCommit,url
git switch main
git pull --ff-only origin main
```

Rezultati: PR #22 ishte `MERGED`; merge commit-i është `2d618fede90cd497e7438f161c94279014eac3a5`.

### 7. Verifikimi në Production

```bash
curl --fail --silent --show-error \
  --output /tmp/xhamia-section10-production-impressum-sq.html \
  --write-out 'SQ Impressum: %{http_code}\n' \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/impressum/

curl --fail --silent --show-error \
  --output /tmp/xhamia-section10-production.css \
  --write-out 'Section CSS: %{http_code} %{size_download} bytes\n' \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/assets/section-10.css

rg -n -o 'name="robots" content="noindex,nofollow"|legal-readiness|LfDI Baden-Württemberg|Cloudflare Data Processing Addendum' \
  /tmp/xhamia-section10-production-*.html

npm run build
npm run lint
npm test
git diff --check
```

Rezultati:

```text
SQ Impressum        HTTP 200
SQ Privatësia       HTTP 200
DE Impressum        HTTP 200
DE Datenschutz      HTTP 200
section-10.css      HTTP 200, 4432 bytes
robots.txt          HTTP 200, Disallow: /
Metadata            noindex,nofollow aktive
Build               kaloi
Lint                kaloi
Tests               16/16 kaluan
Diff check          pa gabime
```

## Adresat e validimit

- Production: <https://xhamia-shpetimi.liridon-halimi.workers.dev>
- Impressum SQ: <https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/impressum/>
- Privatësia SQ: <https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/privatesia/>
- Impressum DE: <https://xhamia-shpetimi.liridon-halimi.workers.dev/de/impressum/>
- Datenschutz DE: <https://xhamia-shpetimi.liridon-halimi.workers.dev/de/datenschutz/>
- Preview: <https://feature-legal-privacy-readiness-xhamia-shpetimi.liridon-halimi.workers.dev>
- Pull request: <https://github.com/liridonalimi/xhamia-shpetimi/pull/22>

## Kriteret e pranimit

- [x] Impressum dhe Privatësia ekzistojnë në SQ dhe DE.
- [x] Të dhënat e konfirmuara ndahen nga informacioni që mungon.
- [x] Nuk publikohen emra, numra regjistri ose afate ruajtjeje të sajuara.
- [x] Përpunimi me Cloudflare dhe rrjedha e AlAdhan shpjegohen.
- [x] Facebook dhe Google Maps hapen vetëm pas klikimit.
- [x] Mungesa e formularit, analytics, cookies dhe profilizimit shpjegohet.
- [x] Të drejtat dhe autoriteti LfDI Baden-Württemberg paraqiten.
- [x] Canonical, Open Graph dhe sitemap përdorin URL-në reale të Production.
- [x] `noindex,nofollow` dhe `robots.txt Disallow: /` mbeten aktive.
- [x] Layout-i funksionon në desktop dhe mobile.
- [x] Build, lint dhe 16/16 teste automatike kalojnë.
- [x] Cloudflare Preview kaloi para merge-it.
- [x] Versioni Production u verifikua pas merge-it.
- [ ] Shoqata duhet të japë përfaqësuesin dhe të dhënat e regjistrit.
- [ ] Shoqata duhet të miratojë tekstin ligjor dhe konfigurimin e privatësisë.
- [ ] Indeksimi publik duhet aktivizuar vetëm pas këtyre miratimeve.
