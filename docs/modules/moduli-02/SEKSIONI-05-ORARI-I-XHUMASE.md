# Seksioni 05 · Menaxhimi i orarit të xhumasë

Implementimi u bashkua në `main` me [PR #33](https://github.com/liridonalimi/xhamia-shpetimi/pull/33), në commit-in `ed65ca0`.

## Përdorimi

Në panelin administrativ, hap **Xhumaja** (`/admin/#xhumaja`), zgjidh orën dhe kliko **Ruaj orarin**. Ora zbatohet çdo të premte sipas orës lokale të Tuttlingenit dhe mbetet në fuqi derisa administratori ta ndryshojë. Vlera fillestare është **12:00 në mesditë**.

Pesë kohët ditore vazhdojnë të vijnë nga API-ja e namazit. Shfaqja e orarit të xhumasë në faqen publike është pjesë e Seksionit 06.

## API dhe ruajtja

- `GET /admin/api/jummah` kthen orarin aktual. Kur nuk ka vlerë në D1, kthen `12:00`.
- `PUT /admin/api/jummah` pranon një objekt JSON me fushën `time` në formatin 24-orësh `HH:mm`. Worker-i kërkon identitet të verifikuar nga Cloudflare Access dhe origjinë të njëjtë për ruajtjen.
- Ndryshimi ruhet si `jummah_time` në `site_settings` dhe regjistrohet në audit log me emailin e verifikuar. Përdoret skema ekzistuese D1, me databaza të ndara për Preview dhe Production.

## Verifikimi

Kaluan `npm run build`, `npm run lint`, `npm test` (35 teste) dhe `git diff --check`. Testet e API-së mbuluan orën fillestare, validimin, ruajtjen dhe auditimin. Në Safari Preview, administratori verifikoi ruajtjen dhe paneli shfaqi konfirmimin **Orari u ruajt: 14:00** për orën e provës.
