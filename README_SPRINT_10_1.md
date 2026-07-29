# Series & Pelis V2 — Sprint 10.1

## Objetivo

Sustituir los campos libres de temporada y capítulo por selectores dinámicos y validados.

## Funcionalidad

- Selector de temporada.
- Selector de capítulo dependiente de la temporada.
- Límites obtenidos desde TMDb.
- Compatibilidad con distribuciones manuales irregulares.
- Compatibilidad con capítulos uniformes por temporada.
- Opción «Sin empezar».
- Validación de combinaciones imposibles.
- Conservación del progreso al editar.
- Actualización automática tras seleccionar una ficha de TMDb.

## Archivos modificados

- `index.html`
- `styles.css`
- `service-worker.js`
- `js/features/tmdb-ui.js`
- `js/features/ratings-forms.js`
- `js/ui/modals.js`

## Archivo nuevo

- `js/features/season-episode-selectors.js`

## Caché

`seriespelis-v2-sprint10-1-season-episode-selectors`
