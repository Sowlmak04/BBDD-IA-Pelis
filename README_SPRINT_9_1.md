# Series & Pelis V2 — Sprint 9.1

## Objetivo
Corregir el cálculo del progreso y admitir temporadas con distinta cantidad de capítulos.

## Prioridad de cálculo
1. Distribución detallada por temporadas.
2. Capítulos uniformes por temporada.
3. Capítulos totales cuando el episodio global puede determinarse.
4. Sin porcentaje cuando faltan datos suficientes.

## Campo nuevo
`episodesBySeason` — ejemplo: `12, 8, 10, 6`.

## Archivos modificados
- index.html
- styles.css
- service-worker.js
- js/data/library-model.js
- js/data/progress-service.js
- js/features/ratings-forms.js
- js/features/statistics-ui.js
- js/ui/render.js
- js/ui/modals.js

## Caché
`seriespelis-v2-sprint9-1-irregular`
