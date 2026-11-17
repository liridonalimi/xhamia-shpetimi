# Seksioni 04 · Një vend për të gjithë

Data e përfundimit: 17 nëntor 2026  
Statusi: Përfunduar dhe publikuar në production  
Branch i punës: `feature/community-cards-section`  
Pull request: [#8 · Improve community cards section](https://github.com/liridonalimi/xhamia-shpetimi/pull/8)

## Qëllimi

Të përmirësohet seksioni me tri kartat kryesore të bashkësisë, në mënyrë që vizitori të kuptojë menjëherë ku çon secila kartë dhe të mund ta përdorë të gjithë sipërfaqen e kartës me maus, prekje ose tastierë. Seksioni duhej të ruante identitetin vizual të faqes dhe të funksiononte njësoj në shqip dhe gjermanisht.

## Ndryshimet

- E gjithë sipërfaqja e secilës kartë u bë e klikueshme.
- U shtuan numrat vizualë `01`, `02` dhe `03`.
- U shtua një vijë e artë në pjesën e sipërme gjatë hover-it ose fokusimit.
- U shtua ngritja e lehtë e kartës dhe hije diskrete gjatë ndërveprimit.
- U shtua fokus i dukshëm për navigimin me tastierë.
- U respektua `prefers-reduced-motion` për vizitorët që kufizojnë animacionet.
- U shtuan `aria-labelledby` dhe ID unike për titujt e kartave.
- Në homepage, kartat çojnë te faqet e brendshme për kontakt, bashkësi dhe mbështetje.
- Në faqen e bashkësisë, karta e dytë hap Facebook-un si link të jashtëm.
- Linku i Facebook-ut përdor `target="_blank"` dhe `rel="noopener noreferrer"`.
- Teksti i thirrjes së kartës së bashkësisë u përshtat në shqip dhe gjermanisht.

## Destinacionet

| Karta | Shqip | Gjermanisht |
| --- | --- | --- |
| 01 · Mësim dhe dije | `/sq/kontakt/` | `/de/kontakt/` |
| 02 · Jeta në bashkësi | `/sq/bashkesia/` | `/de/gemeinde/` |
| 03 · Mbështet xhaminë | `/sq/mbeshtet/` | `/de/unterstuetzen/` |

Në faqen e brendshme të bashkësisë, karta 02 përdor adresën zyrtare të Facebook-ut:

```text
https://www.facebook.com/XhamiaeTuttlingenit/
```

## Skedarët kryesorë të ndryshuar

- `src/build.mjs`
- `src/content.mjs`
- `dist/assets/site.css`
- `tests/site.test.mjs`
- `dist/index.html`
- faqet e gjeneruara SQ/DE në `dist/`

## Komandat e ekzekutuara

### 1. Përgatitja e branch-it

```bash
git status --short --branch
git pull --ff-only origin main
git switch -c feature/community-cards-section
```

Rezultati: puna filloi nga `main` i sinkronizuar dhe në branch të izoluar.

### 2. Kontrolli bazë

```bash
npm run build
npm run lint
npm test
```

Rezultati fillestar: build dhe lint kaluan; 8/8 teste automatike kaluan.

### 3. Inspektimi i seksionit ekzistues

```bash
rg -n -C 8 "communityEyebrow|communityTitle|communityIntro|cards:|function communityCards|community-section|community-grid|community-card|inner-cards" \
  src/content.mjs src/build.mjs dist/assets/site.css tests/site.test.mjs
sed -n '30,75p' src/content.mjs
sed -n '100,145p' src/content.mjs
```

Rezultati: karta e parë përdorte drejtpërdrejt email-in, karta e dytë hapte Facebook-un edhe nga homepage dhe vetëm teksti i linkut ishte zonë e qartë klikimi.

### 4. Implementimi dhe testimi

Pas përmirësimit të markup-it, destinacioneve, stilit dhe testit të ri u ekzekutuan:

```bash
npm run build
npm run lint
npm test
git diff --check
git status --short --branch
git diff --stat
```

Rezultati:

```text
Build       kaloi
Lint        kaloi
Tests       9/9 kaluan
Diff check  pa gabime
```

HTML-ja e gjeneruar u kontrollua me:

```bash
rg -o 'community-card[^>]*|card-number[^>]*>[^<]+|class="text-link card-link"[^>]*' \
  dist/sq/index.html dist/de/index.html \
  dist/sq/bashkesia/index.html dist/de/gemeinde/index.html
```

Rezultati: numrat `01–03`, destinacionet SQ/DE dhe atributet e linkut të jashtëm u gjeneruan saktë.

### 5. Commit-i dhe Pull Request-i

```bash
git add src/content.mjs src/build.mjs dist/assets/site.css tests/site.test.mjs \
  dist/index.html dist/sq/index.html dist/sq/bashkesia/index.html \
  dist/de/index.html dist/de/gemeinde/index.html
git commit -m "Improve community card navigation"
git push -u origin feature/community-cards-section
gh pr create --base main --head feature/community-cards-section \
  --title "Improve community cards section" \
  --body "..."
```

Commit: `33ead74`.  
Pull request: [#8](https://github.com/liridonalimi/xhamia-shpetimi/pull/8).

### 6. Cloudflare Preview

```bash
gh pr checks 8 --watch --interval 10
```

Rezultati: `Workers Builds: xhamia-shpetimi` përfundoi me `pass`.

Faqet e Preview-it u kontrolluan me `curl` dhe markup-u u kontrollua me `rg`:

```text
SQ Preview  HTTP 200
DE Preview  HTTP 200
```

Përdoruesi testoi seksionin në desktop dhe mobile dhe konfirmoi se gjithçka dukej në rregull.

### 7. Merge dhe sinkronizimi

Përdoruesi bëri merge PR #8.

```bash
gh pr view 8 --json state,mergedAt,mergeCommit,url,title
git switch main
git pull --ff-only origin main
git status --short --branch
git log -3 --oneline
```

Merge commit: `5803423ecfc16bfa3dd8e54328a81302228faa99`.

### 8. Verifikimi në Production

```bash
curl --fail --silent --show-error --location \
  --output /tmp/xhamia-production-section4-sq.html \
  --write-out 'SQ Production HTTP %{http_code}\n' \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/

curl --fail --silent --show-error --location \
  --output /tmp/xhamia-production-section4-de.html \
  --write-out 'DE Production HTTP %{http_code}\n' \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/de/

rg -o 'community-card-[^" ]+|card-number[^>]*>[^<]+|class="text-link card-link"[^>]*' \
  /tmp/xhamia-production-section4-sq.html \
  /tmp/xhamia-production-section4-de.html
```

Rezultati final:

```text
SQ Production  HTTP 200
DE Production  HTTP 200
Kartat 01–03   aktive
Destinacionet  të sakta në SQ dhe DE
```

## Adresat e validimit

- Production: <https://xhamia-shpetimi.liridon-halimi.workers.dev>
- Homepage SQ: <https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/>
- Homepage DE: <https://xhamia-shpetimi.liridon-halimi.workers.dev/de/>
- Preview i seksionit: <https://feature-community-cards-section-xhamia-shpetimi.liridon-halimi.workers.dev>
- Pull request: <https://github.com/liridonalimi/xhamia-shpetimi/pull/8>

## Kriteret e pranimit

- [x] Të tri kartat janë plotësisht të klikueshme.
- [x] Destinacionet e homepage-it janë faqe të brendshme dhe të qarta.
- [x] Facebook-u hapet si link i jashtëm vetëm në kontekstin e duhur.
- [x] Linku i jashtëm përdor atributet e sigurisë.
- [x] Fokusimi me tastierë është i dukshëm.
- [x] Kartat kanë semantikë dhe emërtim të përshtatshëm për accessibility.
- [x] `prefers-reduced-motion` respektohet.
- [x] Përmbajtja dhe destinacionet funksionojnë në SQ dhe DE.
- [x] Build, lint dhe 9/9 teste automatike kalojnë.
- [x] Cloudflare Preview përfundoi me sukses.
- [x] Përdoruesi e testoi në desktop dhe mobile para merge-it.
- [x] Faqet SQ/DE u verifikuan në Production me HTTP 200.
