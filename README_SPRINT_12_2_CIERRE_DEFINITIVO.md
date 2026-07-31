# Sprint 12.2 — parche de cierre definitivo

## Alcance

Este parche corrige la limpieza de proveedores de suscripción devueltos por TMDb.

### Reglas aplicadas

1. Se descarta cualquier proveedor cuyo nombre contenga `Channel`.
   Ejemplos: `Crunchyroll Amazon Channel`, `AnimeBox Channel Amazon Channel` y `HBO Max Amazon Channel`.
2. Se eliminan de forma genérica los sufijos de planes con anuncios:
   - `with Ads`
   - `Standard with Ads`
   - `Basic with Ads`
   - `Premium with Ads`
   - equivalentes terminados en `con anuncios`
3. Se normalizan nombres conocidos: `Disney Plus` → `Disney+` y `HBO Max` → `Max`.
4. La deduplicación se realiza después de la normalización.

## Archivos modificados

- `js/data/tmdb-client.js`
- `service-worker.js`

## Instalación

Sustituir ambos archivos respetando sus rutas, publicar el proyecto, limpiar la caché y volver a consultar la disponibilidad de los registros usados en las pruebas.

## Caché

`seriespelis-v2-sprint12-2-provider-cleanup-closure`
