# Series & Pelis V2 — Sprint 11.0.2

## Objetivo

Cambiar la combinación de varios géneros seleccionados de lógica OR a lógica AND.

## Comportamiento anterior

Al seleccionar `Drama` y `Terror`, aparecían títulos que tuvieran al menos uno
de los dos géneros.

## Comportamiento nuevo

Al seleccionar `Drama` y `Terror`, solo aparecen títulos que contengan ambos.

- Un género seleccionado: debe estar presente.
- Dos géneros seleccionados: ambos deben estar presentes.
- Tres géneros seleccionados: los tres deben estar presentes.

## Seguridad

No se modifican registros, claves de almacenamiento, exportaciones ni el modelo
de datos. Solo cambia la interpretación del filtro múltiple por género.

## Archivos modificados

- `js/features/history-filters-search.js`
- `service-worker.js`

## Archivo nuevo

- `README_SPRINT_11_0_2.md`

## Caché

`seriespelis-v2-sprint11-0-2-genre-filter-and`
