# Seksioni 03 · Cloudflare Access dhe skeleti i panelit

Data e përfundimit: 19 nëntor 2026

Statusi: Përfunduar, publikuar dhe verifikuar në Preview dhe Production

Branch i implementimit: `feature/admin-access-and-shell`

Pull request i implementimit: [#29 · Add protected administration shell](https://github.com/liridonalimi/xhamia-shpetimi/pull/29)

Commit-et e implementimit: `293c43a`, `c32d1ec`

Merge commit: `c78127873a228ff3992dc5210ccca8c922447cb8`

Branch i dokumentimit: `docs/module-02-section-03`

## Qëllimi

Të krijohet hyrja e parë e sigurt në `/admin/`, pa ndërtuar ende funksionet CRUD. Seksioni lidh Cloudflare Access me Worker-in, verifikon identitetin në server, shfaq gjendjen e D1 dhe krijon një panel responsive që do të zgjerohet në seksionet pasuese.

Website-i publik mbetet i hapur. Vetëm `/admin` dhe `/admin/*` kërkojnë autentikim.

## Cloudflare Access

U krijua aplikacioni self-hosted `Xhamia Shpetimi Admin`. Ai mbron katër destinacione:

- Production `/admin`;
- Production `/admin/*`;
- Preview i branch-it `/admin`;
- Preview i branch-it `/admin/*`.

Path-i prind dhe wildcard-i ruhen veçmas sepse `admin/*` nuk e mbulon vetë `admin`.

Policy `Administrators` përdor veprimin `Allow` dhe lejon vetëm adresat individuale të administratorëve të konfiguruara në Cloudflare. Identiteti i verifikuar gjatë testimit ishte `liridon-halimi@hotmail.com`.

Autentikimi aktual përdor Cloudflare si identity provider. Një sesion aktiv njihet automatikisht; një Private Browsing session pa cookie kërkon hyrje të re. Kohëzgjatja e aplikacionit është 24 orë.

## Validimi në Worker

`src/access-auth.mjs` zbaton validimin e identitetit me `jose`:

- lexon `ctx.access` kur Cloudflare ia jep direkt Worker-it;
- për path-based Access verifikon `Cf-Access-Jwt-Assertion`;
- merr çelësat publikë nga JWKS i team domain-it;
- kontrollon issuer-in dhe Application Audience;
- normalizon email-in;
- dështon me `403` kur token-i, konfigurimi ose identiteti mungon.

Konfigurimi përdor variablat:

- `ACCESS_TEAM_DOMAIN`;
- `ACCESS_POLICY_AUD`;
- `APP_ENV`.

Vlerat e Access janë identifikues konfigurimi, jo password ose API token. Asnjë credential ose cookie sesioni nuk ruhet në repository.

## Route-t administrative

Worker-i ekzekutohet para static assets për:

```text
/api/*
/admin
/admin/*
```

Rrjedha për `/admin/` është:

1. Cloudflare Access kërkon autentikim.
2. Worker-i verifikon JWT-në e Access.
3. Vetëm pas verifikimit shërbehen asset-et administrative.
4. Përgjigjet marrin security headers dhe nuk cache-ohen si sesione publike.

Një kërkesë pa identitet nuk mund t'i marrë asset-et administrative përmes Worker-it.

## Session API

U shtua endpoint-i:

```text
GET /admin/api/session
```

Ai kthen vetëm gjendje të sigurt:

- email-in dhe subject-in e identitetit të verifikuar;
- ambientin `preview` ose `production`;
- gatishmërinë e binding-ut D1.

Kontrolli D1 përdor `SELECT 1 AS ready`. Përgjigjja ka `cache-control: no-store` dhe nuk ekspozon JWT, cookie ose konfigurim të brendshëm.

## Skeleti i panelit

Paneli u ndërtua në shqip dhe ndjek identitetin vizual të website-it:

- navigim anësor responsive;
- mjedisi Preview/Production;
- email-i i administratorit aktiv;
- statusi i Cloudflare Access;
- statusi i D1;
- parimi `Draft fillimisht`;
- modulet e ardhshme Njoftime, Orari dhe Audit log.

Modulet e papërfunduara shënohen `Së shpejti`; nuk shfaqen butona që simulojnë ruajtje ose publikim.

Paneli gjenerohet me `noindex`, `nofollow` dhe `noarchive`.

## Ndarja Preview/Production

I njëjti kod përdor bindings të ndryshme sipas ambientit:

| Mjedisi | D1 | `APP_ENV` |
| --- | --- | --- |
| Production | `xhamia-shpetimi-production` | `production` |
| Preview | `xhamia-shpetimi-preview` | `preview` |

Të dy ambientet përdorin të njëjtin Access application dhe audience. Paneli Preview tregoi `Preview`, identitetin e verifikuar dhe D1 të lidhur.

## Testet automatike

U shtuan teste për:

- identitetin e marrë nga `ctx.access`;
- validimin e JWT-së me issuer dhe audience;
- dështimin e sigurt kur identiteti ose konfigurimi mungon;
- gjenerimin e admin shell me `noindex`;
- CSS responsive dhe session fetch;
- refuzimin e admin-it pa autentikim;
- session API me identitet dhe gjendje D1;
- security headers për asset-et administrative.

```text
Build             kaloi
Lint              kaloi
Tests             28/28 kaluan
Diff check        pa gabime
Wrangler dry-run  kaloi
npm audit         0 vulnerabilities
Preview build     kaloi
```

## Verifikimi manual

U kryen këto kontrolle:

- Preview publik `/sq/` ktheu HTTP `200`;
- Preview `/admin/` pa sesion ktheu `302` drejt Cloudflare Access;
- autentikimi hapi panelin dhe shfaqi email-in e saktë;
- session API konfirmoi sesion aktiv dhe D1 të lidhur;
- desktop view u kontrollua në Safari;
- mobile view u kontrollua në telefon;
- Private Browsing kërkoi autentikim të ri;
- një sesion ekzistues u njoh automatikisht;
- pas merge-it Production `/sq/` ktheu HTTP `200`;
- pas merge-it Production `/admin/` ktheu `302` drejt Cloudflare Access.

## Skedarët e ndryshuar

- `package.json`
- `package-lock.json`
- `wrangler.jsonc`
- `src/access-auth.mjs`
- `src/admin/admin.css`
- `src/admin/admin.js`
- `src/build.mjs`
- `src/worker.mjs`
- `tests/access-auth.test.mjs`
- `tests/site.test.mjs`
- `dist/admin/index.html`
- `dist/admin/assets/admin.css`
- `dist/admin/assets/admin.js`

## Komandat e ekzekutuara

### 1. Branch-i dhe dependency

```bash
git switch -c feature/admin-access-and-shell
npm install jose
```

Rezultati: u krijua branch-i me prefiksin standard `feature/` dhe u instalua `jose@6.2.18`.

### 2. Validimi fillestar

```bash
npm run build
npm run lint
npm test
git diff --check
npm ls jose wrangler --depth=0
npm audit --audit-level=high
npx wrangler deploy --dry-run \
  --outdir /tmp/xhamia-admin-shell-dry-run \
  --config ./wrangler.jsonc
```

Rezultati: 28/28 teste kaluan, dry-run njohu D1 dhe assets, ndërsa auditimi raportoi zero vulnerabilities.

### 3. Commit-i i parë dhe PR

```bash
git add package.json package-lock.json wrangler.jsonc \
  src/access-auth.mjs src/admin/admin.css src/admin/admin.js \
  src/build.mjs src/worker.mjs \
  tests/access-auth.test.mjs tests/site.test.mjs \
  dist/admin/index.html dist/admin/assets/admin.css dist/admin/assets/admin.js

git diff --cached --check
git commit -m "Add protected administration shell"
git push -u origin feature/admin-access-and-shell
gh pr create --base main \
  --head feature/admin-access-and-shell \
  --title "Add protected administration shell" \
  --body-file /tmp/xhamia-pr29-body.md
gh pr checks 29 --watch --interval 10
```

Rezultati: u krijua PR #29 dhe Cloudflare Preview build kaloi.

### 4. Kontrolli i route-ve para Access

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  https://feature-admin-access-and-shell-xhamia-shpetimi.liridon-halimi.workers.dev/sq/

curl -sS -o /dev/null -w "%{http_code}\n" \
  https://feature-admin-access-and-shell-xhamia-shpetimi.liridon-halimi.workers.dev/admin/
```

Rezultati: faqja publike ktheu `200`, ndërsa Worker-i pa konfigurim Access dështoi sigurt me `403`.

### 5. Konfigurimi dhe kontrolli i Access

Cloudflare Access application dhe policy u krijuan në dashboard. Pas krijimit u kontrolluan header-at:

```bash
curl -sS -I \
  https://feature-admin-access-and-shell-xhamia-shpetimi.liridon-halimi.workers.dev/admin/

curl -sS -o /dev/null -w "%{http_code}\n" \
  https://feature-admin-access-and-shell-xhamia-shpetimi.liridon-halimi.workers.dev/sq/
```

Rezultati: admin-i ktheu `302` drejt team domain-it të Access, ndërsa faqja publike vazhdoi me `200`.

### 6. Konfigurimi i validimit JWT

Pas shtimit të `ACCESS_TEAM_DOMAIN` dhe `ACCESS_POLICY_AUD` në Production dhe Preview:

```bash
npm run build
npm run lint
npm test
git diff --check
npx wrangler deploy --dry-run \
  --outdir /tmp/xhamia-admin-access-config \
  --config ./wrangler.jsonc

git add wrangler.jsonc
git commit -m "Configure Cloudflare Access validation"
git push
gh pr checks 29 --watch --interval 10
```

Rezultati: validimi kaloi dhe Cloudflare krijoi Preview të ri me konfigurimin Access.

### 7. Hapja dhe kontrolli në Safari

```bash
open -a Safari \
  "https://feature-admin-access-and-shell-xhamia-shpetimi.liridon-halimi.workers.dev/admin/"
```

Rezultati: Cloudflare Access autentikoi administratorin dhe paneli tregoi identitetin, ambientin Preview dhe D1 të lidhur.

### 8. Verifikimi pas merge-it

```bash
git switch main
git pull --ff-only
gh pr view 29 --json state,mergedAt,mergeCommit,url

curl -sS -o /dev/null -w "%{http_code}\n" \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/

curl -sS -I \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/admin/
```

Rezultati: PR #29 ishte `MERGED`, faqja publike Production ktheu `200` dhe admin-i Production ridrejtoi te Cloudflare Access.

## Rezultati

Seksioni 03 krijoi kufirin e sigurisë dhe skeletin e panelit. Seksioni 04 mund të ndërtojë menaxhimin real të njoftimeve mbi identitetin e verifikuar, D1 Preview/Production dhe audit log-un ekzistues.
