# Seksioni 06 · Integrimi me website-in publik

Implementimi u bashkua në `main` me [PR #35](https://github.com/liridonalimi/xhamia-shpetimi/pull/35), në commit-in `f6a21fa`.

## Çfarë shfaqet

- Në ballinën shqip dhe gjermanisht, xhumaja shfaqet brenda seksionit **Kohët e namazit**, poshtë pesë kohëve ditore. Ajo shfaqet gjithashtu në faqet `/sq/namazi/` dhe `/de/gebetszeiten/`.
- Orari javor lexohet nga cilësimi `jummah_time` në D1. Kur cilësimi mungon, shfaqet `12:00` sipas orës lokale të Tuttlingenit. Pesë kohët ditore vazhdojnë të vijnë nga API-ja ekzistuese e namazit.
- Ballina shfaq deri në dhjetë njoftime të publikuara brenda afatit të tyre. Nëse nuk ka njoftime aktive, seksioni qëndron i fshehur.

## Integrimi teknik

`GET /api/public-updates?lang=sq` ose `?lang=de` kthen orën e xhumasë dhe vetëm titullin e tekstin e njoftimeve në gjuhën e kërkuar. API-ja nuk kthen identitetet e administratorëve. Përgjigjja përdor `Cache-Control: no-store` dhe përmbajtja vendoset në faqe si tekst. Kur të dhënat nuk mund të lexohen, seksionet përkatëse qëndrojnë të fshehura dhe pjesa tjetër e faqes mbetet e përdorshme.

## Verifikimi

Kaluan build-i, lint-i, kontrolli i diff-it dhe të 36 testet. Testi i API-së verifikoi të dyja gjuhët dhe përjashtimin e drafteve e të njoftimeve të skaduara. Në Safari Preview u kontrollua shfaqja e xhumasë në faqen e namazit dhe u miratua vendosja e saj brenda seksionit të namazit në ballinë.
