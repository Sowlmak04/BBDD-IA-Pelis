# Series & Pelis V2 — Sprint 11.0.1

## Objetivo

Corregir la construcción y aplicación del filtro por género.

## Problema corregido

Antes, cadenas completas como `Crimen, Drama` o `Drama, Misterio, Fantasía`
se trataban como categorías únicas.

Ahora cada género se interpreta individualmente y aparece una sola vez.

## Comportamiento

- Separación por comas.
- Eliminación de espacios sobrantes.
- Eliminación de duplicados sin distinguir mayúsculas y minúsculas.
- Orden alfabético.
- Coincidencia OR al seleccionar varios géneros.
- Compatibilidad con filtros antiguos guardados como combinaciones completas.
- Ninguna migración ni modificación de los registros existentes.

## Archivos modificados

- `js/features/history-filters-search.js`
- `service-worker.js`

## Archivo nuevo

- `README_SPRINT_11_0_1.md`

## Caché

`seriespelis-v2-sprint11-0-1-normalized-genre-filters`
