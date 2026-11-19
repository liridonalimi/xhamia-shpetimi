# Seksioni 02 · D1, migrimet dhe shtresa e të dhënave

Data e përfundimit: 19 nëntor 2026

Statusi: Përfunduar, publikuar dhe verifikuar në Production

Branch i implementimit: `codex/module-02-d1-data-layer`

Pull request i implementimit: [#27 · Add D1 data layer for administration](https://github.com/liridonalimi/xhamia-shpetimi/pull/27)

Commit i implementimit: `f6f420d`

Merge commit: `9a706166643d9c76b7651aa682b104cae7b29751`

Branch i dokumentimit: `docs/module-02-section-02`

## Qëllimi

Të krijohet baza e qëndrueshme e të dhënave për panelin administrativ, pa ndërtuar ende `/admin/` ose API administrative. Seksioni përgatit databazat e ndara Preview/Production, migration-in fillestar dhe një data layer të testuar për njoftimet, oraret e miratuara, konfigurimet dhe auditimin.

## Resurset D1

U krijuan dy databaza të ndara në rajonin Cloudflare `WEUR`:

| Mjedisi | Databaza | Përdorimi |
| --- | --- | --- |
| Production | `xhamia-shpetimi-production` | Vetëm të dhënat reale pas merge-it dhe aprovimit. |
| Preview | `xhamia-shpetimi-preview` | Testet e branch-eve dhe Cloudflare Preview. |

Të dyja përdorin të njëjtin binding logjik `DB`, por `wrangler.jsonc` i drejton te resource ID të ndryshme. Kështu kodi mbetet i njëjtë ndërsa të dhënat nuk përzihen.

## Migration-i fillestar

Skedari `migrations/0001_module_02_initial_schema.sql` krijon katër tabela.

### `announcements`

- përmbajtje shqip dhe gjermanisht;
- status `draft`, `published` ose `archived`;
- interval opsional publikimi;
- timestamps dhe aktori i krijimit/ndryshimit;
- rregull që një record `published` duhet të ketë `published_at`.

### `prayer_overrides`

- një record për datë lokale;
- kohët opsionale Fajr, Dhuhr, Asr, Maghrib dhe Isha;
- deri në dy kohë të xhumasë;
- shënime SQ/DE;
- validim `HH:MM` dhe kufizim 00:00–23:59;
- draftet nuk lexohen si orare publike.

Kjo tabelë ruan vetëm oraret e miratuara nga xhamia. Nuk zëvendëson llogaritjen ekzistuese AlAdhan MWL/Hanafi.

### `site_settings`

- key unik;
- vlerë JSON valide;
- koha dhe aktori i ndryshimit.

Nuk u shtuan të dhëna ligjore, bankare ose organizative të pakonfirmuara.

### `audit_log`

- aktori;
- veprimi;
- tipi dhe ID-ja e entitetit;
- përmbledhje JSON e fushave të ndryshuara;
- timestamp.

Dy database triggers refuzojnë `UPDATE` dhe `DELETE` mbi audit log. Historiku është append-only.

## Data layer

`src/data/admin-store.mjs` përdor API-në D1 me:

- prepared statements dhe parametra;
- `batch()` për shkrimin atomik të entitetit dhe audit log-ut;
- validim të datave, timestamps, email-it, tekstit dhe orëve;
- lexime publike që kthejnë vetëm records `published`;
- kufij për gjatësinë e tekstit dhe numrin e rezultateve;
- gabime të strukturuara `DataValidationError`.

Funksionet fillestare mbulojnë:

- krijimin dhe publikimin e njoftimeve;
- leximin e njoftimeve aktive;
- ruajtjen dhe publikimin e orareve të miratuara;
- leximin e një orari të publikuar sipas datës;
- leximin dhe ruajtjen e `site_settings`;
- leximin e audit log-ut.

Route-t HTTP që do t'i përdorin këto funksione ndërtohen në seksionet pasuese.

## Ndarja e konfigurimit

### `wrangler.jsonc`

- binding-u top-level `DB` lidhet me D1 Production;
- `previews.d1_databases` lidh të njëjtin emër `DB` me D1 Preview;
- `migrations_dir` tregon te dosja `migrations`.

### `wrangler.preview-migrations.jsonc`

Ky konfigurim përdoret vetëm nga komandat e migrimit të Preview. Binding-u `PREVIEW_DB` tregon te e njëjta databazë që përdor Cloudflare Preview.

## Rrjedha e migration-it

Migration-i u aplikua në këtë rend:

1. SQLite in-memory gjatë testeve automatike.
2. Wrangler D1 lokal.
3. D1 Preview para hapjes së PR-së.
4. D1 Production vetëm pasi përdoruesi e kontrolloi dhe e bëri merge PR #27.

Production nuk mori seed data. Tabelat janë bosh dhe gati për panelin real.

## Autentikimi i Wrangler

Wrangler nuk ishte fillimisht i autentikuar lokalisht. OAuth callback në browser raportoi mungesë CSRF, ndërsa device login zbuloi corporate proxy/certificate mismatch.

Zgjidhja e sigurt ishte:

```bash
NODE_USE_SYSTEM_CA=1 npx wrangler login --device
```

Kjo i lejoi Node-it të përdorë certifikatat e besuara të macOS pa çaktivizuar TLS. Linku i autorizimit u hap në Safari, ku Cloudflare ishte tashmë i kyçur. Asnjë API token, kod njëpërdorimësh ose credential nuk u ruajt në repository.

## Testet

U shtuan pesë teste të data layer-it:

- schema dhe kufizimet e migration-it;
- audit log append-only;
- draft/publish për njoftimet;
- intervalet e publikimit dhe validimet negative;
- draft/publish për oraret e miratuara;
- JSON settings dhe identiteti i aktorit.

Numri total i testeve u rrit nga 18 në 23.

```text
Build             kaloi
Lint              kaloi
Tests             23/23 kaluan
Diff check        pa gabime
Wrangler dry-run  kaloi me binding DB + ASSETS
Preview build     kaloi
Preview homepage  HTTP 200
Preview API       HTTP 200
Production home   HTTP 200
Production API    HTTP 200
```

## Cloudflare Preview

Preview i implementimit:

<https://codex-module-02-d1-data-layer-xhamia-shpetimi.liridon-halimi.workers.dev/sq/>

Cloudflare tregoi dy bindings në Preview:

- `ASSETS`;
- `DB` → `xhamia-shpetimi-preview`.

Paneli `/admin/` nuk është pjesë e këtij seksioni, prandaj një kërkesë atje vazhdon të kthejë 404 deri në Seksionin 03.

## Production

Pas merge-it u aplikua migration-i Production dhe u verifikua:

- `No migrations to apply`;
- të katër tabelat ekzistojnë;
- query-ja e verifikimit nuk ndryshoi asnjë rresht;
- homepage dhe Prayer API vazhduan të përgjigjen me HTTP `200`.

## Skedarët e ndryshuar

- `migrations/0001_module_02_initial_schema.sql`
- `src/data/admin-store.mjs`
- `tests/admin-store.test.mjs`
- `wrangler.jsonc`
- `wrangler.preview-migrations.jsonc`
- `package.json`

## Komandat e ekzekutuara

### 1. Gjendja dhe branch-i

```bash
git status --short --branch
git log -3 --oneline
git switch -c codex/module-02-d1-data-layer
node --version
npx wrangler --version
```

Rezultati: `main` ishte i pastër, Node ishte `v24.18.0` dhe Wrangler `4.163.0`.

### 2. Autentikimi dhe inventari D1

```bash
NODE_USE_SYSTEM_CA=1 npx wrangler login --device
NODE_USE_SYSTEM_CA=1 npx wrangler whoami
NODE_USE_SYSTEM_CA=1 npx wrangler d1 list --json
```

Rezultati: login OAuth u krye me sukses dhe account-i nuk kishte databaza D1 ekzistuese.

### 3. Krijimi i databazave

```bash
NODE_USE_SYSTEM_CA=1 npx wrangler d1 create \
  xhamia-shpetimi-production --location weur

NODE_USE_SYSTEM_CA=1 npx wrangler d1 create \
  xhamia-shpetimi-preview --location weur
```

Rezultati: të dyja databazat u krijuan në `WEUR`.

### 4. Migration lokal dhe Preview

```bash
npm run db:migrate:local
NODE_USE_SYSTEM_CA=1 npm run db:migrate:preview

NODE_USE_SYSTEM_CA=1 npx wrangler d1 migrations list \
  PREVIEW_DB --remote --config ./wrangler.preview-migrations.jsonc

NODE_USE_SYSTEM_CA=1 npx wrangler d1 execute \
  PREVIEW_DB --remote --config ./wrangler.preview-migrations.jsonc \
  --command "SELECT name, type FROM sqlite_schema WHERE name IN \
  ('announcements','prayer_overrides','site_settings','audit_log') ORDER BY name"
```

Rezultati: 11 komanda SQL u aplikuan dhe Preview nuk kishte migration pending.

### 5. Validimi i implementimit

```bash
npm run build
npm run lint
npm test
npx wrangler deploy --dry-run \
  --outdir /tmp/xhamia-shpetimi-d1-dry-run \
  --config ./wrangler.jsonc
git diff --check
```

Rezultati: build/lint kaluan, 23/23 teste kaluan dhe dry-run njohu bindings `DB` dhe `ASSETS`.

### 6. Commit, Pull Request dhe Preview

```bash
git add package.json wrangler.jsonc wrangler.preview-migrations.jsonc \
  migrations/0001_module_02_initial_schema.sql \
  src/data/admin-store.mjs tests/admin-store.test.mjs

git commit -m "Add D1 data layer for administration"
git push -u origin codex/module-02-d1-data-layer

gh pr create --base main \
  --head codex/module-02-d1-data-layer \
  --title "Add D1 data layer for administration"

gh pr checks 27 --watch --interval 10
```

Rezultati: commit `f6f420d`, PR #27 dhe Cloudflare Preview build kaloi.

### 7. Merge dhe migration Production

```bash
gh pr view 27 --json state,mergedAt,mergeCommit,url
git switch main
git pull --ff-only origin main

NODE_USE_SYSTEM_CA=1 npx wrangler d1 migrations list \
  DB --remote --config ./wrangler.jsonc

NODE_USE_SYSTEM_CA=1 npm run db:migrate:production

NODE_USE_SYSTEM_CA=1 npx wrangler d1 migrations list \
  DB --remote --config ./wrangler.jsonc

NODE_USE_SYSTEM_CA=1 npx wrangler d1 execute \
  DB --remote --config ./wrangler.jsonc \
  --command "SELECT name, type FROM sqlite_schema WHERE name IN \
  ('announcements','prayer_overrides','site_settings','audit_log') ORDER BY name"
```

Rezultati: migration-i u aplikua në Production, të katër tabelat u gjetën dhe nuk mbeti migration pending.

### 8. Production smoke test

```bash
curl --fail --silent --show-error --output /dev/null \
  --write-out "Homepage %{http_code}\\n" \
  https://xhamia-shpetimi.liridon-halimi.workers.dev/sq/

curl --fail --silent --show-error \
  --output /tmp/xhamia-section02-production-prayer.json \
  --write-out "Prayer API %{http_code}\\n" \
  'https://xhamia-shpetimi.liridon-halimi.workers.dev/api/prayer-times?date=2026-11-19'
```

Rezultati: homepage dhe Prayer API kthyen HTTP `200`.

## Burimet zyrtare

- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [Cloudflare D1 Wrangler commands](https://developers.cloudflare.com/d1/wrangler-commands/)
- [Worker Preview resources dhe izolimi](https://developers.cloudflare.com/workers/previews/resources/)
- [Worker Preview configuration](https://developers.cloudflare.com/workers/previews/configuration/)

## Kriteret e pranimit

- [x] Production dhe Preview përdorin databaza fizikisht të ndara.
- [x] Migration-i është versionuar dhe i njëjtë në të gjitha mjediset.
- [x] Nuk krijohen tabela gjatë request-it.
- [x] Prepared statements përdoren për input-et.
- [x] Shkrimet e entitetit dhe audit log-ut janë atomike.
- [x] Audit log refuzon ndryshimin dhe fshirjen.
- [x] Draftet nuk dalin në leximet publike.
- [x] Nuk u shtuan të dhëna të sajuara.
- [x] Website-i publik dhe Prayer API vazhdojnë të funksionojnë.

## Hapi i ardhshëm

Seksioni 03 ndërton Cloudflare Access, kontrollin e identitetit dhe skeletin responsive të panelit `/admin/`. Branch-et e reja të implementimit do të përdorin prefix-in `feature/`, në përputhje me Modulin 01.
