# Sprint 12.2 — parche final de normalización de plataformas

## Objetivo

Cerrar la limpieza de proveedores de suscripción en España antes de desplegar el Sprint 12.3.

## Cambios

- Se excluye cualquier proveedor cuyo nombre contenga `Channel`.
- Se unifican planes con publicidad, incluidos `Standard with Ads`, `Basic with Ads`, `with Ads` y `con anuncios`.
- Se agrupan los paquetes comerciales de Movistar bajo `Movistar Plus+`.
- Se mantienen las equivalencias de Prime Video, Disney+ y Max.
- La deduplicación se realiza después de normalizar la familia comercial.
- Se añade `TMDbClient.getWatchProviderCatalog(kind, region)` para futuras auditorías del catálogo regional sin exponer el token.

## Archivos modificados

- `js/data/tmdb-client.js`
- `service-worker.js`

## Caché

`seriespelis-v2-sprint12-2-provider-catalog-final`

## Nota

El catálogo regional permite revisar los nombres publicados por TMDb, pero no decide por sí solo qué planes pertenecen a la misma familia. Esa decisión permanece en reglas explícitas y conservadoras para evitar fusionar servicios distintos.
