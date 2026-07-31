# Sprint 12.2 — Disponibilidad mediante suscripción

## Objetivo

Activar el panel `Disponibilidad` de la ficha completa para consultar en TMDb las plataformas en las que una película o serie está incluida mediante suscripción en España.

Este sprint no muestra alquiler ni compra y no añade enlaces de apertura a las plataformas.

## Funcionalidad incorporada

- Consulta independiente de disponibilidad mediante el endpoint de proveedores de TMDb.
- Región inicial centralizada en `ES` mediante `TMDbClient.WATCH_REGION`.
- Uso exclusivo de la categoría `flatrate` de TMDb, correspondiente a suscripción.
- Logos y nombres de las plataformas disponibles.
- Fecha y hora de la última consulta.
- Mensaje específico cuando TMDb no devuelve plataformas de suscripción para España.
- Persistencia de los datos en el registro.
- Compatibilidad con exportación e importación.
- Conservación de la disponibilidad al actualizar el resto de metadatos desde TMDb.
- Nueva caché del Service Worker.

## Archivos modificados

- `styles.css`
- `service-worker.js`
- `js/data/tmdb-client.js`
- `js/data/library-model.js`
- `js/features/detail-view.js`

## Archivo nuevo

- `README_SPRINT_12_2.md`

## Modelo de datos añadido

Cada registro puede incorporar:

- `watchRegion`
- `watchProviders`
- `watchProvidersLink`
- `watchProvidersUpdatedAt`

Los registros antiguos continúan funcionando sin migración manual. Los nuevos campos se normalizan al cargar la biblioteca.

## Comportamiento esperado

1. Abrir la ficha completa de una película o serie vinculada con TMDb.
2. Desplegar `Disponibilidad`.
3. Pulsar `Actualizar disponibilidad`.
4. La aplicación consulta exclusivamente la disponibilidad por suscripción en España.
5. Si existen proveedores, muestra sus logos y nombres.
6. Si no existen, muestra un mensaje neutral.
7. La fecha de consulta queda guardada.

## Caché

`seriespelis-v2-sprint12-2-subscription-availability`

## Fuera de alcance

- Alquiler.
- Compra.
- Enlaces directos o deep links.
- Comparación con la plataforma personal del registro.
- Indicadores en las tarjetas de la biblioteca.
- País configurable desde la interfaz.
