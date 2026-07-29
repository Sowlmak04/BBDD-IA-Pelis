# Series & Pelis V2 — Sprint 12.0

## Objetivo

Crear una ficha completa independiente para ampliar los metadatos sin convertir la ficha principal en una pantalla interminable.

## Funcionalidad

- Botón `Ficha completa` desde el detalle habitual.
- Nueva pantalla completa adaptada a móvil.
- Sección `Resumen` con sinopsis, duración, idiomas, países, estado y productoras.
- Secciones preparadas para reparto, disponibilidad y multimedia.
- Actualización manual de los datos desde TMDb.
- Campos nuevos opcionales y compatibles con registros anteriores.

## Archivos nuevos

- `js/features/detail-view.js`
- `README_SPRINT_12_0.md`

## Archivos modificados

- `index.html`
- `styles.css`
- `service-worker.js`
- `js/data/tmdb-client.js`
- `js/data/library-model.js`
- `js/features/tmdb-ui.js`
- `js/features/ratings-forms.js`
- `js/ui/modals.js`

## Caché

`seriespelis-v2-sprint12-0-detailed-view`

## Datos añadidos

- `originCountries`
- `spokenLanguages`
- `productionCompanies`
- `productionStatus`

No se requiere migración. Los registros antiguos muestran `No disponible` hasta que se actualicen desde TMDb.


## Nota técnica

Los países se obtienen de `origin_country` para series y de `production_countries` para películas.
