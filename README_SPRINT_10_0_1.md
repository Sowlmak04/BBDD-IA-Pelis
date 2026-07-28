# Series & Pelis V2 — Sprint 10.0.1

## Objetivo

Optimizar la visualización móvil mostrando un máximo de cuatro registros por página.

## Cambio

```javascript
const PAGE_SIZE = 4;
```

El ajuste se aplica a las cuatro listas principales:

- Series pendientes
- Series vistas
- Películas pendientes
- Películas vistas

## Archivos modificados

- `js/core/navigation.js`
- `js/ui/render.js`
- `service-worker.js`

## Caché

`seriespelis-v2-sprint10-0-1-page-size-4`

No se modifican datos, búsquedas, filtros, progreso, estadísticas, TMDb, importación ni exportación.
