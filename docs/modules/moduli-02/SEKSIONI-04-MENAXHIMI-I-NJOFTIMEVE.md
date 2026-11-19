# Seksioni 04 · Menaxhimi i njoftimeve

Implementimi u bashkua në `main` me [PR #31](https://github.com/liridonalimi/xhamia-shpetimi/pull/31). Branch-i ishte `feature/admin-announcements` dhe merge commit-i është `0afcd5a`.

## Përdorimi i panelit

1. Hape `/admin/njoftime/` pas hyrjes në Cloudflare Access.
2. Plotëso titullin dhe tekstin në shqip dhe gjermanisht. Fillimi dhe fundi i shfaqjes janë opsionalë. Ora e futur interpretohet sipas zonës kohore të pajisjes.
3. Zgjidh **Ruaj draftin**. Draftin mund ta gjesh në listë, ta filtrosh sipas statusit dhe ta redaktosh.
4. Ruaj ndryshimet e fundit, pastaj zgjidh **Publiko** dhe konfirmo. Publikimi përdor versionin e ruajtur të draftit.
5. Zgjidh **Arkivo** për të arkivuar një draft ose një njoftim të publikuar. Vetëm draftet mund të redaktohen.

Në këtë seksion, publikimi vendos statusin në D1. Shfaqja në faqen publike shqip dhe gjermanisht është pjesë e Seksionit 06.

## API, të dhënat dhe qasja

- `GET /admin/api/announcements` liston deri në 100 njoftime, me filtër opsional `status`. `POST` krijon një draft.
- `GET /admin/api/announcements/:id` lexon një njoftim. `PUT` përditëson një draft. `POST` në nënrrugët `/publish` dhe `/archive` ndryshon statusin.
- Worker-i verifikon identitetin e Cloudflare Access dhe origjinën e kërkesave që shkruajnë të dhëna. Veprimet e krijimit, përditësimit, publikimit dhe arkivimit regjistrohen në audit log me emailin e verifikuar.
- Përdoret skema ekzistuese D1. Preview dhe Production kanë databaza të ndara.

Për këtë branch, destinacionet e mëposhtme u shtuan te aplikacioni ekzistues **Xhamia Shpetimi Admin**. Përdoruesi konfirmoi qasjen në Preview pas korrigjimit të konfigurimit.

```text
feature-admin-announcements-xhamia-shpetimi.liridon-halimi.workers.dev/admin
feature-admin-announcements-xhamia-shpetimi.liridon-halimi.workers.dev/admin/*
```

## Verifikimi i implementimit

Kaluan `npm run build`, `npm run lint`, `npm test` (34 teste), `git diff --check`, `npm audit --audit-level=high` dhe `npx wrangler deploy --dry-run --config ./wrangler.jsonc`. Testet lokale mbuluan ciklin e njoftimit në API, auditimin dhe refuzimin e kërkesave pa identitet ose nga origjinë tjetër. Konfirmimi manual në Preview mbuloi qasjen në panel.
