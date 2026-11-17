# Seksioni 03 · Kohët e namazit

Data e përfundimit: 17 nëntor 2026  
Statusi: Përfunduar dhe publikuar në production  
Branch i punës: `feature/prayer-times-section`  
Pull request: [#6 · Add MWL Hanafi prayer schedule](https://github.com/liridonalimi/xhamia-shpetimi/pull/6)

## Qëllimi

Të paraqiten kohët e llogaritura të hyrjes së namazit për adresën e xhamisë, pa i ngatërruar me kohët e faljes me xhemat ose me xhumanë. Integrimi duhej të përdorte konfigurimin e miratuar Muslim World League dhe Hanafi, të funksiononte në shqip dhe gjermanisht dhe të mos e lidhte browser-in drejtpërdrejt me shërbimin e jashtëm.

## Konfigurimi i miratuar

- Burimi: AlAdhan Prayer Times API
- Metoda: Muslim World League, `method=3`
- Ikindia: Hanafi, `school=1`
- Timezone: `Europe/Berlin`
- Gjerësia gjeografike: `47.9801632`
- Gjatësia gjeografike: `8.8161992`
- Adresa: Bergstraße 27, 78532 Tuttlingen

## Arkitektura

```text
Browser
  → /api/prayer-times?date=YYYY-MM-DD
  → Cloudflare Worker
  → AlAdhan API
```

Browser-i komunikon vetëm me domain-in e website-it. Cloudflare Worker kontrollon datën, kërkon orarin nga AlAdhan, ruan vetëm pesë kohët e nevojshme dhe kthen JSON të sanitizuar. Përgjigjja e jashtme ruhet në cache për 24 orë; browser-i mund ta ruajë përgjigjen për 5 minuta.

## Ndryshimet

- U shtua endpoint-i `/api/prayer-times` në `src/worker.mjs`.
- U shtua `ASSETS` binding dhe routing `/api/*` në `wrangler.jsonc`.
- U përdorën koordinatat e sakta në vend të endpoint-it jo të besueshëm sipas emrit të qytetit.
- U aktivizuan Muslim World League dhe ikindia Hanafi.
- U shtua loading state, success state dhe error state në seksionin e namazit.
- U aktivizua navigimi para/pas ndërmjet datave në faqen e plotë.
- U shtua butoni `Kthehu te sot` / `Zurück zu heute`.
- U dalluan qartë kohët e llogaritura nga falja me xhemat dhe xhumaja.
- U përditësua faqja e privatësisë në SQ dhe DE me shpjegimin Cloudflare Worker → AlAdhan.
- U shtuan teste automatike për konfigurimin, endpoint-in dhe sanitizimin e përgjigjes.
- `npm run dev`, `deploy` dhe `preview` përdorin shprehimisht `wrangler.jsonc`.

## Skedarët kryesorë të ndryshuar

- `src/worker.mjs`
- `src/content.mjs`
- `src/build.mjs`
- `dist/assets/site.js`
- `dist/assets/site.css`
- `tests/site.test.mjs`
- `wrangler.jsonc`
- `package.json`
- faqet e gjeneruara SQ/DE në `dist/`

## Komandat e ekzekutuara

### 1. Përgatitja e branch-it

```bash
git switch main
git pull --ff-only origin main
git branch -d docs/section-02-hero
git switch -c feature/prayer-times-section
git status --short --branch
```

Rezultati: puna filloi nga `main` i sinkronizuar dhe në branch të izoluar.

### 2. Kontrolli bazë

```bash
npm run build
npm run lint
npm test
```

Rezultati fillestar: build dhe lint kaluan; 7/7 teste automatike kaluan.

### 3. Inspektimi i implementimit ekzistues

```bash
rg -n "Seksioni 03|namaz|prayer|orari|schedule" README.md docs src tests package.json
sed -n '1,190p' src/content.mjs
sed -n '35,95p' src/build.mjs
rg -n -C 3 "data-prayer-date|data-date-step|data-date-reset|prayer-time" \
  dist/assets/site.js tests/site.test.mjs
```

Rezultati: faqja paraqiste pesë viza dhe lejonte ndryshimin e datës edhe kur nuk kishte orar të miratuar.

### 4. Gjendja e qartë para integrimit

U shtua një njoftim dygjuhësh dhe u hoq përkohësisht navigimi i datave derisa të zgjidhej metoda. Pas ndryshimit u ekzekutuan:

```bash
npm run build
npm run lint
npm test
git diff --check
git status --short --branch
git diff --stat
```

Commit-i i parë:

```bash
git commit -m "Improve pending prayer schedule experience"
```

Commit: `b3b9888`.

### 5. Cloudflare Preview i parë

```bash
git push -u origin feature/prayer-times-section
gh pr create --base main --head feature/prayer-times-section \
  --title "Improve prayer schedule pending state" \
  --body "..."
gh pr checks 6 --watch --interval 5
```

Preview:

```text
https://feature-prayer-times-section-xhamia-shpetimi.liridon-halimi.workers.dev
```

### 6. Verifikimi i AlAdhan

Endpoint-i sipas emrit të qytetit u provua me:

```bash
curl --fail --silent --show-error --max-time 30 \
  'https://api.aladhan.com/v1/timingsByCity/17-11-2026?city=Tuttlingen&country=Germany&state=Baden-W%C3%BCrttemberg&timezonestring=Europe%2FBerlin' |
  jq '{code, status, timings: .data.timings | {Fajr,Dhuhr,Asr,Maghrib,Isha}, method: .data.meta.method, school: .data.meta.school, timezone: .data.meta.timezone, latitude: .data.meta.latitude, longitude: .data.meta.longitude}'
```

Rezultati tregoi koordinata të pasakta. Prandaj endpoint-i sipas qytetit nuk u përdor.

Koordinatat e adresës u kontrolluan me OpenStreetMap Nominatim:

```bash
curl --fail --silent --show-error --max-time 30 --get \
  'https://nominatim.openstreetmap.org/search' \
  --data-urlencode 'street=Bergstraße 27' \
  --data-urlencode 'city=Tuttlingen' \
  --data-urlencode 'format=jsonv2'
```

Koordinatat e përdorura: `47.9801632, 8.8161992`.

### 7. Krahasimi i metodave

U krahasuan Muslim World League standard, Muslim World League Hanafi dhe Diyanet Hanafi me endpoint-in sipas koordinatave. Zgjedhja përfundimtare e përdoruesit ishte Muslim World League dhe Hanafi.

Parametrat e miratuar:

```text
method=3
school=1
latitude=47.9801632
longitude=8.8161992
timezonestring=Europe/Berlin
```

### 8. Implementimi i Worker-it

U shtua `src/worker.mjs` dhe konfigurimi i Worker-it. Pas implementimit u ekzekutuan:

```bash
npm run build
npm run lint
npm test
git diff --check
WRANGLER_LOG_PATH=/tmp/xhamia-shpetimi-wrangler.log \
  npx wrangler deploy --dry-run --config ./wrangler.jsonc
```

Rezultati: build dhe lint kaluan; testet u rritën në 8/8. Wrangler lexoi 44 asete, njohu `env.ASSETS` dhe përfundoi dry-run pa publikuar.

### 9. Testi lokal me Wrangler

Për shkak të një konfigurimi të gjeneruar në një dosje prind, konfigurimi i projektit u specifikua shprehimisht. Nuk u fshi asnjë konfigurim i projektit tjetër.

```bash
WRANGLER_LOG_PATH=/tmp/xhamia-shpetimi-wrangler-dev.log \
  npx wrangler dev --config ./wrangler.jsonc --port 4317
```

Endpoint-i u kontrollua me:

```bash
curl --fail --silent --show-error --max-time 30 \
  'http://127.0.0.1:4317/api/prayer-times?date=2026-11-17' |
  jq .
```

Rezultati:

```text
Fajr    05:45
Dhuhr   12:10
Asr     15:01
Maghrib 16:45
Isha    18:28
```

Kontrollet mbrojtëse:

```text
GET me datë të pavlefshme → HTTP 400
POST në endpoint          → HTTP 405
```

### 10. Commit-i i integrimit

```bash
git add src/worker.mjs src/content.mjs src/build.mjs \
  dist/assets/site.js dist/assets/site.css tests/site.test.mjs \
  wrangler.jsonc package.json dist
git commit -m "Add cached MWL Hanafi prayer times API"
git push
```

Commit: `ee0facc`.

### 11. Cloudflare Preview final

```bash
gh pr checks 6 --watch --interval 5
```

Rezultati: `Workers Builds: xhamia-shpetimi` përfundoi me `pass`.

API në Preview u verifikua me:

```bash
curl --fail --silent --show-error --max-time 30 \
  'https://feature-prayer-times-section-xhamia-shpetimi.liridon-halimi.workers.dev/api/prayer-times?date=2026-11-17' |
  jq '{date, timezone, method, school, source, timings}'
```

Rezultati: HTTP 200, Muslim World League, Hanafi, Europe/Berlin dhe pesë orare të vlefshme.

### 12. Merge dhe sinkronizimi

Përdoruesi testoi Preview-n dhe bëri merge PR #6.

```bash
gh pr view 6 --json state,mergedAt,mergeCommit,url
git switch main
git pull --ff-only origin main
git log --oneline -6
```

Merge commit: `fc65d141921f95e0aeeb96a3d668b689e607f372`.

### 13. Verifikimi në Production

```bash
npm run build
npm run lint
npm test
git diff --check
WRANGLER_LOG_PATH=/tmp/xhamia-shpetimi-production-review.log \
  npx wrangler deploy --dry-run --config ./wrangler.jsonc
```

Cloudflare Production Build u kontrollua me:

```bash
gh api \
  repos/liridonalimi/xhamia-shpetimi/commits/fc65d141921f95e0aeeb96a3d668b689e607f372/check-runs
```

Rezultati: `completed` dhe `success`.

Kontrolli i Production:

```bash
curl --fail --silent --show-error --max-time 30 \
  'https://xhamia-shpetimi.liridon-halimi.workers.dev/api/prayer-times?date=2026-11-17' |
  jq '{date, timezone, method, school, source, timings}'
```

Rezultati final:

```text
SQ page      HTTP 200
DE page      HTTP 200
API          HTTP 200
Invalid date HTTP 400
POST         HTTP 405
```

## Adresat e validimit

- Production: <https://xhamia-shpetimi.liridon-halimi.workers.dev>
- Faqja SQ: <https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/namazi/>
- Faqja DE: <https://xhamia-shpetimi.liridon-halimi.workers.dev/de/gebetszeiten/>
- Preview i seksionit: <https://feature-prayer-times-section-xhamia-shpetimi.liridon-halimi.workers.dev>
- Pull request: <https://github.com/liridonalimi/xhamia-shpetimi/pull/6>

## Kriteret e pranimit

- [x] Përdoret Muslim World League, `method=3`.
- [x] Përdoret ikindia Hanafi, `school=1`.
- [x] Përdoren koordinatat e verifikuara të Bergstraße 27.
- [x] Browser-i nuk lidhet drejtpërdrejt me AlAdhan.
- [x] Pesë kohët sanitizohen para se t’i dërgohen browser-it.
- [x] Kohët e llogaritura dallohen nga falja me xhemat dhe xhumaja.
- [x] Navigimi ndërmjet datave funksionon në faqen e plotë.
- [x] Gjendjet loading, success dhe error janë dygjuhëshe.
- [x] Faqja e privatësisë përshkruan integrimin.
- [x] Build, lint dhe 8/8 teste automatike kalojnë.
- [x] Cloudflare Preview u kontrollua para merge-it.
- [x] Cloudflare Production Build përfundoi me sukses.
- [x] API dhe faqet SQ/DE u verifikuan në Production.

## Burimet teknike

- AlAdhan Prayer Times API: <https://aladhan.com/prayer-times-api>
- AlAdhan Calculation Methods: <https://aladhan.com/calculation-methods>
- Cloudflare Workers Static Assets: <https://developers.cloudflare.com/workers/static-assets/binding/>
