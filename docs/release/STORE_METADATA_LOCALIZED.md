# Otto: localized App Store metadata (MKT-6)

> Drafted 2026-09-24 from `STORE_METADATA.md` (the en-US source of truth) and ASO plan §9
> (`Otto_Website/brief/ASO_PLAN.md`). These are **metadata-only** localizations. The app itself is
> English-only, and the es-MX description says so. Character counts are measured. Nothing here
> claims more than the en-US listing does.
>
> **Prices are not written into these descriptions.** App Store Connect shows each storefront its
> own currency, and a dollar figure in a Spanish or UK listing would be wrong for most readers.
>
> Status: **draft, for founder review.** Enter in App Store Connect → App Information →
> Localizable Information, add the language, then paste. de-DE (§9 #3) waits: it needs real
> translation, metric checks and importer testing against German recipe sites.

---

## 1. Spanish (Mexico): `es-MX`

Why first: Apple indexes es-MX metadata in the **US** storefront too, so this adds a second
keyword set in Otto's main market (ASO plan §9, marked there as practice, not Apple doc).
Check after two weeks whether Otto shows up for a Spanish search like *recetas* in the US store.

| Field | Value | Length |
|---|---|---|
| **Name** (≤30) | `Otto: Recetas y Menú Semanal` | 28 |
| **Subtitle** (≤30) | `Un recetario más tranquilo` | 26 |
| **Keywords** (≤100) | `cocina,lista de compras,súper,planificador,paso a paso,importar,sin anuncios,despensa,cena,comida` | 97 |

No keyword repeats a word from the name or subtitle. No competitor or platform names.

**Promotional text** (≤170)
```
Otto guarda cada receta que guardas en un solo lugar, cocina contigo paso a paso y convierte el plan de la semana en tu lista de compras. Sin anuncios. Sin feed.
```
161 characters.

**Description**
```
Otto es un recetario para las recetas que de verdad cocinas.

Tráela
Pega un enlace, un video o el texto de la receta. Otto saca los ingredientes y los pasos, y te
muestra lo que encontró para que corrijas lo que haga falta antes de guardar. Las recetas que
importas conservan siempre el nombre de quien las creó y un enlace a la original.

Cocínala
Un paso a la vez, en letra grande, con el temporizador a la mano. Cambia las porciones y las
cantidades se ajustan solas.

Planea la semana
Acomoda platillos en los próximos días. Otto arma la lista de compras a partir del plan y la
ordena como está acomodado el súper. Comparte la lista con tu cocina y se mantiene al día en
el teléfono de todos.

Pregúntale a Otto
Una duda sobre un sustituto, una técnica o qué hacer con lo que hay en el refri. Otto responde
dentro de la app, escribiendo o por voz.

Nutrición, con honestidad
Otto estima calorías y macros por porción a partir de los ingredientes. Son estimaciones, no
mediciones, y Otto lo dice en lugar de inventar una precisión que no tiene.

Lo que Otto no hace
Sin anuncios. Sin feed. Sin rastreo en otras apps. No se le vende nada a nadie. Puedes borrar
tu cuenta, y todo lo que contiene, desde la app.

Otto Club
Lo esencial de Otto es gratis y seguirá siéndolo. Otto Club es una membresía opcional, mensual
o anual, con una semana de prueba gratis, que desbloquea las funciones más pesadas.

La app está en inglés. Otto lee recetas en inglés mejor que en otros idiomas.

Datos y fotos de recetas de TheMealDB. Los valores de nutrición se calculan con USDA FoodData
Central, que no respalda a Otto.

Otto necesita iOS 15.1 o posterior.
```

Notes for review: *súper* and *refri* are Mexican usage on purpose. *Kitchen* stays *cocina*
(the app's word for a shared household). The English-only line is a trust call. Without it a
Spanish reader downloads, finds English, and leaves a one-star review.

---

## 2. English (U.K.): `en-GB`

Why: en-GB is the listing language for the UK, Australia, Ireland and New Zealand storefronts.
It is a third keyword set with different phrasing (*shopping list*, *weekly shop*,
*favourite*), and it needs no translator.

| Field | Value | Length |
|---|---|---|
| **Name** (≤30) | `Otto: Recipes & Meal Plans` | 26 |
| **Subtitle** (≤30) | `A quieter kind of cookbook` | 26 |
| **Keywords** (≤100) | `favourite,shopping list,meal planner,cook mode,step by step,kitchen,no ads,import,grams,weekly shop` | 99 |

`grams` is fair: Otto writes amounts weight-first (grams and millilitres).

**Promotional text** (≤170): the en-US text works unchanged (144).

**Description**: the en-US description with these edits only:

| en-US | en-GB |
|---|---|
| `groups it the way a store is laid out` | `groups it the way a shop is laid out` |
| `Otto Club is an optional membership that unlocks the heavier features, $4.99 a month or $39.99 a year, with a 1-week free trial.` | `Otto Club is an optional membership that unlocks the heavier features, monthly or yearly, with a 1-week free trial.` |

Everything else in the en-US description is already neutral English. *Favourite* doesn't appear
in the description, so there is nothing to re-spell.

---

## 3. Open

- Founder review of the Spanish copy (voice and regional words).
- Decide whether the subscription display names get localized too (App Store Connect →
  Subscriptions → each product → Localization). Default: leave them English until the app is.
