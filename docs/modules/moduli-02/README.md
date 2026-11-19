# Moduli 02 · Administrimi

Qëllimi: të ndërtohet një panel i mbrojtur administrimi për njoftimet dhe oraret e miratuara, pa ndryshuar mënyrën e sigurt me të cilën shërbehet website-i publik.

Moduli përdor Cloudflare Access për hyrjen, Cloudflare D1 për të dhënat e strukturuara dhe Worker-in ekzistues për API-të. Website-i publik mbetet dygjuhësh, responsive dhe i përdorshëm edhe kur paneli administrativ ose databaza nuk janë të disponueshme.

Nuk përfshihen në versionin e parë:

- pagesa online;
- ngarkimi i fotografive ose dokumenteve;
- llogari me fjalëkalime të ruajtura nga aplikacioni;
- ndryshimi i të dhënave ligjore të pakonfirmuara;
- aktivizimi i domain-it personal ose indeksimit publik.

## Vendimet bazë

- Zona administrative vendoset nën `/admin/`.
- API-ja administrative vendoset nën `/admin/api/` që UI-ja dhe API-ja të mbrohen nga i njëjti aplikacion Cloudflare Access.
- Versioni i parë lejon një administrator të autorizuar me email të saktë në Cloudflare Access.
- Databaza Production dhe databaza Preview janë të ndara.
- Njoftimet krijohen si draft dhe publikohen vetëm me veprim të qartë.
- Çdo ndryshim administrativ regjistrohet në audit log.
- Përmbajtja shqip dhe gjermanisht plotësohet në të njëjtin formular.

## Seksionet e planifikuara

- [Seksioni 01 · Arkitektura dhe siguria](SEKSIONI-01-ARKITEKTURA-DHE-SIGURIA.md) — projektuar
- [Seksioni 02 · D1, migrimet dhe shtresa e të dhënave](SEKSIONI-02-D1-DHE-SHTRESA-E-TE-DHENAVE.md) — përfunduar
- [Seksioni 03 · Cloudflare Access dhe skeleti i panelit](SEKSIONI-03-CLOUDFLARE-ACCESS-DHE-PANELI.md) — përfunduar
- [Seksioni 04 · Menaxhimi i njoftimeve](SEKSIONI-04-MENAXHIMI-I-NJOFTIMEVE.md) — përfunduar
- [Seksioni 05 · Menaxhimi i orarit të xhumasë](SEKSIONI-05-ORARI-I-XHUMASE.md) — përfunduar
- [Seksioni 06 · Integrimi me website-in publik](SEKSIONI-06-INTEGRIMI-PUBLIK.md) — përfunduar
- [Seksioni 07 · Audit log, validimi dhe forcimi i sigurisë](SEKSIONI-07-AUDIT-LOG-DHE-VALIDIMI.md) — përfunduar
- Seksioni 08 · Kontrolli përfundimtar teknik dhe dokumentimi

## Rrjedha e punës për çdo seksion

1. Krijohet branch i veçantë.
2. Implementohet dhe testohet lokalisht.
3. Krijohet Pull Request.
4. Cloudflare krijon Preview të branch-it.
5. Përdoruesi kontrollon desktop dhe mobile.
6. Përdoruesi bën merge.
7. Dokumentimi i seksionit përditësohet në një Pull Request të veçantë.

Ky dokument është plani i modulit. Krijimi i databazave D1, konfigurimi i Cloudflare Access dhe implementimi i panelit fillojnë vetëm në seksionet përkatëse.
