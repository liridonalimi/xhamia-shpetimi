# Seksioni 06 · Njoftimet dhe Facebook

Data e përfundimit: 17 nëntor 2026  
Statusi: Përfunduar dhe publikuar në production  
Branch i punës: `feature/latest-news-facebook-section`  
Pull request: [#12 · Improve latest news Facebook section](https://github.com/liridonalimi/xhamia-shpetimi/pull/12)

## Qëllimi

Të përmirësohet seksioni “Njoftimet më të fundit / Facebook” në homepage, duke e bërë burimin zyrtar të njoftimeve më të dukshëm dhe më të lehtë për t’u përdorur. Seksioni duhej të funksiononte në shqip dhe gjermanisht, të ishte i aksesueshëm dhe të mos ngarkonte iframe, Facebook SDK, feed ose tracker automatik.

## Vendimi për privatësinë

Website-i nuk integron feed-in e Facebook-ut. Përmbajtja e Facebook-ut ngarkohet vetëm pasi vizitori klikon linkun dhe largohet nga website-i i xhamisë.

Kjo shmang:

- ngarkimin automatik të Facebook SDK;
- iframe të palës së tretë;
- cookie ose tracker automatik nga Facebook;
- varësinë e homepage-it nga disponueshmëria e Facebook-ut;
- ngadalësimin e faqes nga një feed i jashtëm.

## Ndryshimet

- Seksioni u lidh me titullin përmes `aria-labelledby`.
- U shtuan kategoritë e përmbajtjes në shqip dhe gjermanisht.
- Paneli i Facebook-ut u bë plotësisht i klikueshëm.
- U shtua shenja `Kanali zyrtar` / `Offizieller Kanal`.
- U shtua handle-i `@XhamiaeTuttlingenit`.
- U shtua CTA e qartë brenda panelit.
- U shtua shpjegimi se Facebook hapet vetëm pas klikimit.
- Linku përdor `target="_blank"` dhe `rel="noopener noreferrer"`.
- U shtuan hover, fokus i dukshëm dhe mbështetje për `prefers-reduced-motion`.
- Layout-i u përshtat për desktop, tablet dhe telefon.
- U shtua test automatik që ndalon embed-et dhe SDK-në e Facebook-ut.

## Përmbajtja sipas gjuhës

| Elementi | Shqip | Gjermanisht |
| --- | --- | --- |
| Titulli | Njoftimet më të fundit. | Aktuelles aus der Gemeinde. |
| Kategoria 1 | Njoftime | Ankündigungen |
| Kategoria 2 | Aktivitete | Aktivitäten |
| Kategoria 3 | Fotografi | Fotos |
| Shenja | Kanali zyrtar | Offizieller Kanal |

Faqja zyrtare:

```text
https://www.facebook.com/XhamiaeTuttlingenit/
```

## Skedarët kryesorë të ndryshuar

- `src/content.mjs`
- `src/build.mjs`
- `dist/assets/site.css`
- `tests/site.test.mjs`
- `dist/index.html`
- `dist/sq/index.html`
- `dist/de/index.html`

## Komandat e ekzekutuara

### 1. Përgatitja e branch-it

```bash
git status --short --branch
git pull --ff-only origin main
git switch -c feature/latest-news-facebook-section
```

Rezultati: branch-i i seksionit 6 u krijua nga `main` i sinkronizuar.

### 2. Kontrolli bazë

```bash
npm run build
npm run lint
npm test
git status --short --branch
```

Rezultati fillestar: build dhe lint kaluan; 10/10 teste automatike kaluan.

### 3. Inspektimi i seksionit ekzistues

```bash
rg -n -C 10 "newsEyebrow|newsTitle|newsText|facebookCta|facebookNote|news-section|facebook-panel|facebook-icon|facebook.com|third-party|trackers" \
  src/content.mjs src/build.mjs dist/assets/site.css tests/site.test.mjs
sed -n '65,80p' src/content.mjs
sed -n '140,155p' src/content.mjs
sed -n '80,90p' src/build.mjs
sed -n '100,170p' tests/site.test.mjs
```

Rezultati: seksioni kishte linkun zyrtar dhe nuk kishte embed, por dy CTA-të nuk formonin një hierarki të qartë dhe mungonte shpjegimi për privatësinë.

### 4. Implementimi dhe testimi

Pas ndryshimeve në përmbajtje, markup, CSS dhe teste u ekzekutuan:

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
Tests       11/11 kaluan
Diff check  pa gabime
```

HTML-ja e gjeneruar u kontrollua me:

```bash
rg -o 'news-heading-[^" ]+|class="news-topics"[^>]*|class="facebook-panel"[^>]*|class="facebook-official"[^>]*>[^<]+|class="facebook-handle"[^>]*>[^<]+' \
  dist/sq/index.html dist/de/index.html

rg -n '<iframe|connect\.facebook\.net|facebook\.com/plugins' \
  dist/index.html dist/sq/index.html dist/de/index.html
```

Rezultati: paneli dhe përmbajtja SQ/DE u gjeneruan saktë; nuk u gjet asnjë embed ose SDK i Facebook-ut.

### 5. Commit-i dhe Pull Request-i

```bash
git add src/content.mjs src/build.mjs dist/assets/site.css \
  tests/site.test.mjs dist/index.html dist/sq/index.html dist/de/index.html
git commit -m "Improve latest news Facebook section"
git push -u origin feature/latest-news-facebook-section
gh pr create --base main --head feature/latest-news-facebook-section \
  --title "Improve latest news Facebook section" \
  --body "..."
```

Commit: `3db7861`.  
Pull request: [#12](https://github.com/liridonalimi/xhamia-shpetimi/pull/12).

### 6. Cloudflare Preview

```bash
gh pr checks 12 --watch --interval 10
```

Rezultati: `Workers Builds: xhamia-shpetimi` përfundoi me `pass`.

Preview-i u kontrollua me `curl` dhe `rg`:

```text
SQ Preview  HTTP 200
DE Preview  HTTP 200
```

Në përgjigjet e Preview-it u verifikuan heading-et, kategoritë, kanali zyrtar, handle-i, URL-ja dhe atributet e sigurisë. Nuk u gjet iframe ose SDK e Facebook-ut.

Përdoruesi e testoi seksionin në desktop dhe mobile dhe konfirmoi se paraqitja dukej shumë mirë.

### 7. Merge dhe sinkronizimi

Përdoruesi bëri merge PR #12.

```bash
gh pr view 12 --json state,mergedAt,mergeCommit,url,title
git switch main
git pull --ff-only origin main
git status --short --branch
git log -4 --oneline
```

Merge commit: `edb84c097d9db11bf6f78d21519e6b8993c3bf7f`.

### 8. Verifikimi në Production

```bash
curl --fail --silent --show-error --location \
  --output /tmp/xhamia-production-section6-sq.html \
  --write-out 'SQ Production HTTP %{http_code}\n' \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/

curl --fail --silent --show-error --location \
  --output /tmp/xhamia-production-section6-de.html \
  --write-out 'DE Production HTTP %{http_code}\n' \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/de/

rg -o 'news-heading-[^" ]+|class="news-topics"[^>]*|class="facebook-panel"[^>]*|class="facebook-official"[^>]*>[^<]+|class="facebook-handle"[^>]*>[^<]+' \
  /tmp/xhamia-production-section6-sq.html \
  /tmp/xhamia-production-section6-de.html

rg -n '<iframe|connect\.facebook\.net|facebook\.com/plugins' \
  /tmp/xhamia-production-section6-sq.html \
  /tmp/xhamia-production-section6-de.html
```

Rezultati final:

```text
SQ Production  HTTP 200
DE Production  HTTP 200
Facebook embed nuk u gjet
Facebook SDK   nuk u gjet
```

## Adresat e validimit

- Production: <https://xhamia-shpetimi.liridon-halimi.workers.dev>
- Homepage SQ: <https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/>
- Homepage DE: <https://xhamia-shpetimi.liridon-halimi.workers.dev/de/>
- Preview: <https://feature-latest-news-facebook-section-xhamia-shpetimi.liridon-halimi.workers.dev>
- Facebook: <https://www.facebook.com/XhamiaeTuttlingenit/>
- Pull request: <https://github.com/liridonalimi/xhamia-shpetimi/pull/12>

## Kriteret e pranimit

- [x] Seksioni ka titull dhe hierarki të qartë në SQ dhe DE.
- [x] Paneli i Facebook-ut është plotësisht i klikueshëm.
- [x] Faqja dhe handle-i zyrtar paraqiten qartë.
- [x] Linku i jashtëm përdor atributet e sigurisë.
- [x] Vizitori informohet se Facebook hapet pas klikimit.
- [x] Nuk ngarkohet iframe, feed, SDK ose tracker automatik.
- [x] Fokusimi me tastierë është i dukshëm.
- [x] `prefers-reduced-motion` respektohet.
- [x] Layout-i funksionon në desktop dhe mobile.
- [x] Build, lint dhe 11/11 teste automatike kalojnë.
- [x] Cloudflare Preview përfundoi me sukses.
- [x] Përdoruesi e testoi në desktop dhe mobile para merge-it.
- [x] Homepage-i SQ/DE u verifikua në Production me HTTP 200.
