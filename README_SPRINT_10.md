# Series & Pelis V2 — Sprint 10

## Objetivo

Sincronizar desde TMDb la estructura real de temporadas de las series.

## Funciones

- Guarda `seasonsData` con número de temporada, capítulos y fecha de estreno.
- Excluye la temporada 0 del progreso principal.
- Conserva los especiales en `specialsData`.
- Completa automáticamente `episodesBySeason`.
- Permite actualizar una serie ya guardada desde su ficha.
- Conserva progreso, historial, notas, valoraciones y organización personal.
- Mantiene compatibilidad con series manuales y registros antiguos.

## Archivos modificados

- index.html
- styles.css
- service-worker.js
- js/data/library-model.js
- js/data/tmdb-client.js
- js/features/ratings-forms.js
- js/features/tmdb-ui.js
- js/ui/modals.js

## Archivo nuevo

- js/data/tmdb-season-service.js

## Caché

seriespelis-v2-sprint10-tmdb-seasons
