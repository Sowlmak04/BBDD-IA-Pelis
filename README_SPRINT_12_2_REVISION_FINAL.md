# Sprint 12.2 — Revisión final de disponibilidad

## Objetivo

Eliminar duplicados comerciales en el panel `Disponibilidad` cuando TMDb devuelve varias variantes de una misma plataforma de suscripción.

Ejemplo corregido:

- `Amazon Prime Video`
- `Amazon Prime Video with ads`

La aplicación muestra una sola entrada:

- `Amazon Prime Video`

## Implementación

La respuesta de TMDb se normaliza antes de guardarse:

1. Se asigna una clave canónica a las variantes conocidas.
2. Se agrupan las entradas que representan la misma plataforma.
3. Se prefiere la variante sin calificadores como `with ads` o `con anuncios`.
4. Se conserva un logotipo válido.
5. Se mantiene la mejor prioridad de visualización devuelta por TMDb.

Equivalencias iniciales:

- Amazon Prime Video / Amazon Prime Video with ads / Amazon Prime Video con anuncios → Amazon Prime Video
- Disney Plus / Disney+ → Disney+
- HBO Max / Max → Max

Las plataformas no incluidas en la tabla conservan su nombre e identificador de TMDb y no se agrupan entre sí.

## Archivos modificados

- `js/data/tmdb-client.js`
- `service-worker.js`

## Archivo nuevo

- `README_SPRINT_12_2_REVISION_FINAL.md`

## Caché

`seriespelis-v2-sprint12-2-subscription-availability-rev2`

## Compatibilidad

- No cambia el modelo de datos.
- No requiere migración.
- No altera exportación ni importación.
- No modifica reparto, equipo técnico, progreso, temporadas ni datos personales.
- Los registros ya consultados deben actualizar su disponibilidad una vez para sustituir los proveedores duplicados almacenados.
