# Seksioni 07 · Mbështet xhaminë

Data e përfundimit: 18 nëntor 2026  
Statusi: Përfunduar dhe publikuar në production  
Branch i punës: `feature/support-banner-section`  
Pull request: [#14 · Improve support banner section](https://github.com/liridonalimi/xhamia-shpetimi/pull/14)

Shtesa me të dhënat bankare demonstrative:

Branch: `feature/demo-bank-details`

Pull request: [#16 · Add clearly marked demo bank details](https://github.com/liridonalimi/xhamia-shpetimi/pull/16)

## Qëllimi

Të përmirësohet banneri “Së bashku e mbajmë gjallë bashkësinë” dhe lidhja e tij me faqen “Mbështet xhaminë”. Vizitori duhet të kuptojë tri mënyrat e kontributit para se të hapë faqen e brendshme, pa e paraqitur CTA-në si pagesë direkte. Derisa të merren të dhënat zyrtare, faqja e mbështetjes shfaq vetëm shembuj qartësisht të pavlefshëm për të vlerësuar dizajnin.

## Vendimi për kontributet

Website-i nuk përpunon pagesa. Banneri çon te faqja informative e mbështetjes. Vetëm në atë faqe shfaqen një IBAN dhe BIC demonstrative, të shënuara qartë si të pavlefshme dhe të papërdorshme për pagesë. Të dhënat zyrtare do të zëvendësojnë shembujt më vonë.

Tri mënyrat e paraqitura janë:

- donacione;
- anëtarësim;
- vullnetarizëm.

## Ndryshimet

- Banneri mori një identitet më të fortë me sfond të gjelbër dhe accent të artë.
- U shtua një panel rrethor me ikonën e zemrës.
- U shtuan tri mënyrat e kontributit në SQ dhe DE.
- U shtua `aria-labelledby` për titullin e bannerit.
- Lista e mënyrave ka label të lokalizuar për teknologjitë ndihmëse.
- CTA-ja çon në faqen e brendshme të mbështetjes.
- CTA-ja nuk hap email dhe nuk nis pagesë nga banneri.
- Faqja “Mbështet” mori heading semantik të lidhur.
- U shtuan focus state, responsive layout dhe mbështetje për `prefers-reduced-motion`.
- Banneri i njëjtë përdoret në homepage dhe në faqen “Rreth nesh”.
- U shtua test që ndalon IBAN, BIC dhe `mailto:` brenda bannerit.
- Në faqet SQ/DE të mbështetjes u shtua një panel demonstrativ për IBAN dhe BIC.
- Paneli ka badge dhe paralajmërim të lokalizuar që të dhënat nuk janë të vlefshme.
- Të dhënat ruhen me `valid: false` dhe nuk shfaqen në homepage.
- Nuk u shtua formular pagese, checkout ose integrim me një procesues pagese.

## Të dhënat bankare demonstrative

| Fusha | Vlera demonstrative |
| --- | --- |
| IBAN | `DE00 0000 0000 0000 0000 00` |
| BIC | `BEISPIELXXX` |
| Gjendja në kod | `valid: false` |

Shqip përdor badge-in “Vetëm demonstrim”, ndërsa gjermanishtja “Nur Demo”. Të dyja faqet paralajmërojnë qartë që vlerat nuk duhet të përdoren për pagesë. Këto vlera duhet të zëvendësohen vetëm pasi xhamia të japë IBAN-in dhe BIC-un zyrtar.

## Përmbajtja sipas gjuhës

| Elementi | Shqip | Gjermanisht |
| --- | --- | --- |
| Label | Mënyrat për të ndihmuar | Möglichkeiten zu helfen |
| Mënyra 1 | Donacione | Spenden |
| Mënyra 2 | Anëtarësim | Mitgliedschaft |
| Mënyra 3 | Vullnetarizëm | Ehrenamt |
| CTA | Dua të kontribuoj | Ich möchte helfen |
| Destinacioni | `/sq/mbeshtet/` | `/de/unterstuetzen/` |

## Skedarët kryesorë të ndryshuar

- `src/content.mjs`
- `src/build.mjs`
- `dist/assets/site.css`
- `tests/site.test.mjs`
- `dist/index.html`
- `dist/sq/index.html`
- `dist/sq/rreth-nesh/index.html`
- `dist/sq/mbeshtet/index.html`
- `dist/de/index.html`
- `dist/de/ueber-uns/index.html`
- `dist/de/unterstuetzen/index.html`

## Komandat e ekzekutuara

### 1. Përgatitja e branch-it

```bash
git status --short --branch
git pull --ff-only origin main
git switch -c feature/support-banner-section
```

Rezultati: branch-i i seksionit 7 u krijua nga `main` i sinkronizuar.

### 2. Kontrolli bazë

```bash
npm run build
npm run lint
npm test
git status --short --branch
```

Rezultati fillestar: build dhe lint kaluan; 11/11 teste automatike kaluan.

### 3. Inspektimi i seksionit ekzistues

```bash
rg -n -C 10 "supportTitle|supportText|supportCta|supportSections|supportBanner|support-banner|support-inner|support-info|page === 'support'" \
  src/content.mjs src/build.mjs dist/assets/site.css tests/site.test.mjs
sed -n '70,115p' src/content.mjs
sed -n '145,190p' src/content.mjs
sed -n '65,112p' src/build.mjs
```

Rezultati: banneri kishte CTA të saktë, por tri mënyrat e kontributit shfaqeshin vetëm në faqen e brendshme dhe heading-u nuk ishte i lidhur semantikisht.

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
Tests       12/12 kaluan
Diff check  pa gabime
```

HTML-ja e gjeneruar u kontrollua me:

```bash
rg -o 'support-banner-heading-[^" ]+|class="support-ways"[^>]*|class="button support-cta"[^>]*|support-info-heading-[^" ]+' \
  dist/sq/index.html dist/de/index.html \
  dist/sq/rreth-nesh/index.html dist/de/ueber-uns/index.html \
  dist/sq/mbeshtet/index.html dist/de/unterstuetzen/index.html

rg -n 'IBAN|BIC|Kontonummer' \
  dist/sq/index.html dist/de/index.html \
  dist/sq/rreth-nesh/index.html dist/de/ueber-uns/index.html
```

Rezultati: heading-et, lista dhe CTA-të SQ/DE u gjeneruan saktë; nuk u gjetën të dhëna bankare në banner.

### 5. Commit-i dhe Pull Request-i

```bash
git add src/content.mjs src/build.mjs dist/assets/site.css tests/site.test.mjs \
  dist/index.html dist/sq/index.html dist/sq/rreth-nesh/index.html \
  dist/sq/mbeshtet/index.html dist/de/index.html \
  dist/de/ueber-uns/index.html dist/de/unterstuetzen/index.html
git commit -m "Improve support banner section"
git push -u origin feature/support-banner-section
gh pr create --base main --head feature/support-banner-section \
  --title "Improve support banner section" \
  --body "..."
```

Commit: `4bc8fec`.  
Pull request: [#14](https://github.com/liridonalimi/xhamia-shpetimi/pull/14).

### 6. Cloudflare Preview

```bash
gh pr checks 14 --watch --interval 10
```

Rezultati: `Workers Builds: xhamia-shpetimi` përfundoi me `pass`.

Gjashtë faqet e Preview-it u kontrolluan me `curl`:

```text
SQ Home     HTTP 200
DE Home     HTTP 200
SQ About    HTTP 200
DE About    HTTP 200
SQ Support  HTTP 200
DE Support  HTTP 200
```

Në përgjigjet e Preview-it u verifikuan heading-et, tri mënyrat, CTA-të dhe mungesa e të dhënave bankare në banner.

Përdoruesi e testoi seksionin në desktop dhe mobile dhe konfirmoi se paraqitja dukej shumë mirë.

### 7. Merge dhe sinkronizimi

Përdoruesi bëri merge PR #14.

```bash
gh pr view 14 --json state,mergedAt,mergeCommit,url,title
git switch main
git pull --ff-only origin main
git status --short --branch
git log -4 --oneline
```

Merge commit: `f42b37a4f6344669032c4dc2144ad749f3e68056`.

### 8. Verifikimi në Production

Homepage-i, “Rreth nesh” dhe “Mbështet” u kërkuan në SQ dhe DE me `curl`. Markup-u u verifikua me `rg`:

```bash
curl --fail --silent --show-error --location \
  --output /tmp/xhamia-production-section7-sq.html \
  --write-out 'SQ Home HTTP %{http_code}\n' \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/

curl --fail --silent --show-error --location \
  --output /tmp/xhamia-production-section7-support-sq.html \
  --write-out 'SQ Support HTTP %{http_code}\n' \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/mbeshtet/
```

Të njëjtat kontrolle u ekzekutuan për gjermanishten dhe faqet “Rreth nesh”.

Rezultati final:

```text
SQ Home     HTTP 200
DE Home     HTTP 200
SQ About    HTTP 200
DE About    HTTP 200
SQ Support  HTTP 200
DE Support  HTTP 200
```

Nuk u gjet `IBAN`, `BIC` ose numër llogarie në bannerët Production.

### 9. Shtesa me IBAN dhe BIC demonstrative

Për të vlerësuar paraqitjen e ardhshme të të dhënave bankare, u krijua branch-i `feature/demo-bank-details`. U shtuan vlera qëllimisht të pavlefshme dhe sinjalizim i dukshëm në të dyja gjuhët.

```bash
git switch -c feature/demo-bank-details
npm run build
npm run lint
npm test
git diff --check
git push -u origin feature/demo-bank-details
gh pr create --base main --head feature/demo-bank-details \
  --title "Add clearly marked demo bank details" \
  --body "..."
gh pr checks 16 --watch --interval 10
```

Rezultati para merge-it:

```text
Build                 kaloi
Lint                  kaloi
Tests                 13/13 kaluan
Diff check            pa gabime
Cloudflare Preview    pass
```

Commit-i i implementimit: `d95aca4`.

Pull request: [#16](https://github.com/liridonalimi/xhamia-shpetimi/pull/16).

Përdoruesi e kontrolloi implementimin dhe bëri merge PR #16. Merge-i dhe `main` u verifikuan me:

```bash
git status --short --branch
gh pr view 16 --json state,mergedAt,mergeCommit,url,title
git switch main
git pull --ff-only origin main
git status --short --branch
git log -4 --oneline
```

Merge commit: `b87515c54f02d09e5a6488544df7caf5eb2ceea7`.

Faqet e mbështetjes dhe homepage-et SQ/DE u kontrolluan në Production me `curl`. Me `rg` u verifikuan marker-i `data-demo-bank-details`, badge-et, paralajmërimet dhe vlerat demonstrative. Rezultati:

```text
SQ Support   HTTP 200, paneli demonstrativ u gjet
DE Support   HTTP 200, paneli demonstrativ u gjet
SQ Home      HTTP 200, vlerat demonstrative mungojnë
DE Home      HTTP 200, vlerat demonstrative mungojnë
```

## Adresat e validimit

- Production: <https://xhamia-shpetimi.liridon-halimi.workers.dev>
- Homepage SQ: <https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/>
- Homepage DE: <https://xhamia-shpetimi.liridon-halimi.workers.dev/de/>
- Mbështet SQ: <https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/mbeshtet/>
- Unterstützen DE: <https://xhamia-shpetimi.liridon-halimi.workers.dev/de/unterstuetzen/>
- Preview: <https://feature-support-banner-section-xhamia-shpetimi.liridon-halimi.workers.dev>
- Preview i shtesës bankare: <https://feature-demo-bank-details-xhamia-shpetimi.liridon-halimi.workers.dev>
- Pull request: <https://github.com/liridonalimi/xhamia-shpetimi/pull/14>
- Pull request i shtesës bankare: <https://github.com/liridonalimi/xhamia-shpetimi/pull/16>

## Kriteret e pranimit

- [x] Tri mënyrat e kontributit paraqiten në SQ dhe DE.
- [x] CTA-ja çon në faqen e brendshme të mbështetjes.
- [x] Banneri nuk nis pagesë ose email direkt.
- [x] Vlerat bankare demonstrative shfaqen vetëm në faqet e mbështetjes.
- [x] Vlerat janë qartësisht të shënuara si të pavlefshme dhe të papërdorshme për pagesë.
- [x] Homepage-et dhe bannerët nuk shfaqin IBAN ose BIC.
- [x] Nuk ekziston formular pagese, checkout ose integrim pagese.
- [x] Heading-et lidhen me seksionet përmes `aria-labelledby`.
- [x] Fokusimi me tastierë është i dukshëm.
- [x] Layout-i funksionon në desktop dhe mobile.
- [x] Banneri është konsistent në homepage dhe “Rreth nesh”.
- [x] Build, lint dhe 13/13 teste automatike kalojnë.
- [x] Cloudflare Preview përfundoi me sukses.
- [x] Përdoruesi e testoi në desktop dhe mobile para merge-it.
- [x] Gjashtë faqet SQ/DE u verifikuan në Production me HTTP 200.
- [x] Shtesa e PR #16 u verifikua në Production pas merge-it.
