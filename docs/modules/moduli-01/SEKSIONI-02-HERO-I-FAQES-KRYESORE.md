# Seksioni 02 · Hero i faqes kryesore

Data e përfundimit: 17 nëntor 2026  
Statusi: Përfunduar dhe publikuar në production  
Branch i punës: `feature/homepage-hero`  
Pull request: [#4 · Improve homepage hero](https://github.com/liridonalimi/xhamia-shpetimi/pull/4)

## Qëllimi

Të optimizohej Hero i faqes kryesore pa ndryshuar dizajnin dhe tekstin e miratuar. Imazhi duhej të ngarkohej më lehtë në telefon, adresa të bëhej funksionale dhe faqja të ruante paraqitjen responsive në desktop dhe mobile.

## Ndryshimet

- U krijua `hero-640.jpg`, version i optimizuar i imazhit për ekrane të vogla.
- Madhësia e imazhit mobile u zvogëlua nga 591 KB në 212 KB.
- Imazhi i Hero-s përdor `srcset` dhe `sizes`, që browser-i të zgjedhë variantin e përshtatshëm.
- Imazhi kryesor përdor `fetchpriority="high"` dhe `decoding="async"`.
- Adresa `Bergstraße 27 · Tuttlingen` u kthye në lidhje drejt Google Maps.
- Lidhja e adresës hapet në tab të ri me `rel="noopener"`.
- U shtua gjendje `hover` për adresën.
- Testet kontrollojnë asetet e deklaruara në `srcset`, konfigurimin responsive dhe lidhjen e verifikuar të adresës.

## Skedarët e ndryshuar

- `src/build.mjs`
- `dist/assets/site.css`
- `tests/site.test.mjs`
- `dist/assets/hero-640.jpg`
- `dist/index.html`
- `dist/sq/index.html`
- `dist/de/index.html`

## Komandat e ekzekutuara

### 1. Përgatitja e branch-it

```bash
git status --short --branch
git pull --ff-only origin main
git switch -c feature/homepage-hero
```

Rezultati: puna filloi në një branch të izoluar nga `main`.

### 2. Kontrolli bazë

```bash
npm run build
npm run lint
npm test
```

Rezultati fillestar: build dhe lint kaluan; 6 teste automatike kaluan.

### 3. Inspektimi i Hero-s

```bash
rg -n "hero|heroTitle|heroText|heroPrimary|heroSecondary|heroCaption" \
  src/content.mjs src/build.mjs dist/assets/site.css tests/site.test.mjs
ls -lh dist/assets/hero.jpg
file dist/assets/hero.jpg
sips -g pixelWidth -g pixelHeight dist/assets/hero.jpg
sed -n '1,150p' src/content.mjs
sed -n '1,110p' src/build.mjs
```

Rezultati: imazhi fillestar ishte JPEG 1024 × 1536 me madhësi 591 KB.

### 4. Krijimi i imazhit responsive

```bash
sips --resampleWidth 640 --setProperty formatOptions 82 \
  dist/assets/hero.jpg --out dist/assets/hero-640.jpg
```

Rezultati: u krijua imazhi 640 × 960 me madhësi 212 KB.

### 5. Rigjenerimi dhe testimi

```bash
npm run build
npm run lint
npm test
git diff --check
git status --short --branch
git diff --stat
```

Rezultati: build dhe lint kaluan; numri i testeve u rrit nga 6 në 7 dhe të gjitha kaluan. `git diff --check` nuk gjeti probleme formatimi.

### 6. Kontrolli vizual lokal

```bash
npm run dev
```

Faqja u kontrollua në `http://127.0.0.1:4317/sq/` në desktop dhe me viewport mobile 390 × 844.

Rezultati:

- desktop-i ruajti dizajnin e miratuar;
- në mobile u zgjodh `hero-640.jpg`;
- nuk u gjet overflow horizontal;
- adresa tregonte te Google Maps dhe hapej në tab të ri.

Serveri lokal u ndal me `Ctrl+C`.

### 7. Commit-i dhe publikimi i branch-it

```bash
git add src/build.mjs dist/assets/site.css tests/site.test.mjs \
  dist/assets/hero-640.jpg dist/index.html dist/sq/index.html dist/de/index.html
git commit -m "Improve homepage hero performance and directions"
git push -u origin feature/homepage-hero
```

Commit: `cd2505f`.

### 8. Pull request dhe Cloudflare Preview

```bash
gh pr create --base main --head feature/homepage-hero \
  --title "Improve homepage hero" \
  --body "..."
gh pr checks 4
```

Rezultati: `Workers Builds: xhamia-shpetimi` përfundoi me `pass`.

Preview i branch-it:

```text
https://feature-homepage-hero-xhamia-shpetimi.liridon-halimi.workers.dev
```

Kontrolli i Preview-t:

```bash
curl --fail --silent --show-error \
  https://feature-homepage-hero-xhamia-shpetimi.liridon-halimi.workers.dev/sq/
```

Rezultati: HTTP `200`; HTML përmbante `hero-640.jpg`, `class="hero-location"` dhe adresën e Google Maps.

### 9. Miratimi dhe merge

Preview u testua dhe u miratua nga përdoruesi. Pull request #4 u bë merge në GitHub.

```bash
git switch main
git pull --ff-only origin main
git log --oneline -5
```

Merge commit: `94f2ee0`.

### 10. Verifikimi pas merge-it

```bash
npm run build
npm run lint
npm test
git diff --check
git status --short --branch
```

Rezultati: build dhe lint kaluan; 7/7 teste automatike kaluan dhe `main` ishte i pastër.

Production u kontrollua me:

```bash
curl --fail --silent --show-error --max-time 30 \
  -o /dev/null -w 'HTTP %{http_code}\n' \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/

curl --fail --silent --show-error --max-time 30 \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/ |
  rg -o 'hero-640\.jpg|class="hero-location"|https://www\.google\.com/maps/search/[^" ]+'
```

Rezultati: Production u përgjigj me HTTP `200` dhe përmbante imazhin responsive, klasën e adresës dhe lidhjen e Google Maps.

## Adresat e validimit

- Production: <https://xhamia-shpetimi.liridon-halimi.workers.dev>
- Preview i seksionit: <https://feature-homepage-hero-xhamia-shpetimi.liridon-halimi.workers.dev>
- Pull request: <https://github.com/liridonalimi/xhamia-shpetimi/pull/4>

## Kriteret e pranimit

- [x] Dizajni dhe përmbajtja e Hero-s mbetën të pandryshuara.
- [x] Mobile përdor imazhin e optimizuar 640 px.
- [x] Adresa hap Google Maps në tab të ri.
- [x] Nuk ka overflow horizontal në desktop ose mobile.
- [x] Cloudflare Preview u kontrollua përpara merge-it.
- [x] Build, lint dhe 7 teste automatike kaluan.
- [x] Përdoruesi e testoi dhe e miratoi seksionin.
- [x] Ndryshimet u verifikuan në Production pas merge-it.
