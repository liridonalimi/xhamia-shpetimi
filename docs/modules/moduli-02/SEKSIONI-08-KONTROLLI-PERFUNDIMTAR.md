# Seksioni 08 · Kontrolli përfundimtar teknik dhe dokumentimi

Kontrolli i 19 nëntorit 2026 u krye mbi `main` në commit-in `1a3324d`, pas bashkimit të [PR #38](https://github.com/liridonalimi/xhamia-shpetimi/pull/38).

## Rezultatet

| Kontrolli | Rezultati |
| --- | --- |
| `npm run build` dhe `npm run lint` | Kaluan |
| `npm test` | 38 nga 38 teste kaluan |
| `git diff --check` | Kaloi |
| `npm audit --audit-level=high` | Regjistri raportoi 0 dobësi |
| `npx wrangler deploy --dry-run --config ./wrangler.jsonc` | Paketoi Worker-in dhe 56 skedarë statikë |
| Production `/sq/`, `/de/` dhe `/api/public-updates?lang=sq` | HTTP 200 |
| Production `/admin/`, pa sesion | HTTP 302 |

Testet mbuluan refuzimin e qasjes pa identitet, ndalimin e shkrimit nga origjina tjetër, ciklin e njoftimeve, ruajtjen e orarit të xhumasë, përzgjedhjen e përmbajtjes publike sipas gjuhës dhe historikun vetëm për lexim. Kontrollet me sesion administrativ u kryen në Preview gjatë seksioneve përkatëse. Kontrolli përfundimtar në Production ishte vetëm për lexim.

## Mirëmbajtja

1. Testo ndryshimet në Cloudflare Preview. Kur krijohet një host i ri Preview, shto rrugët `/admin` dhe `/admin/*` për atë host te aplikacioni ekzistues **Xhamia Shpetimi Admin**.
2. Kontrollo etiketën **Preview** në panel para se të përdorësh të dhëna prove. Preview dhe Production përdorin databaza D1 të ndara.
3. Pas deploy-it, kontrollo ballinat shqip dhe gjermanisht, orarin e xhumasë dhe hyrjen te `/admin/` nga një dritare private. Për detajet e secilit funksion, përdor [indeksin e Modulit 02](README.md).

Moduli 02 mbulon administrimin dhe integrimin me faqen publike. Aktivizimi i indeksimit mbetet i lidhur me miratimin e të dhënave ligjore për publikim.
