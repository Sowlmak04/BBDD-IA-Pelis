# Sprint 12.1.2 — Corrección del orden del reparto principal

## Objetivo

Corregir la omisión del protagonista en el bloque «Reparto principal» de algunas películas y series.

## Causa localizada

TMDb asigna normalmente `order = 0` al primer intérprete del reparto. La normalización anterior utilizaba una comprobación basada en valores verdaderos/falsos, por lo que el valor numérico `0` se interpretaba como ausente y se sustituía por `9999`. Como consecuencia, el protagonista se enviaba al final de la lista y podía quedar fuera del límite de 15 intérpretes.

## Cambios

- Se conserva correctamente `order = 0`.
- El reparto se ordena de menor a mayor según el orden de relevancia de TMDb.
- Los créditos sin orden válido se sitúan al final.
- Se almacena `billingOrder` para futuras funcionalidades relacionadas con intérpretes.
- Se mantiene el límite de 15 personas.
- Se actualiza la caché del Service Worker.

## Registros existentes

Los registros que ya perdieron al protagonista deben abrirse en «Ficha completa» y actualizarse con «Actualizar desde TMDb». No hay migración ni cambios destructivos.

## Archivos modificados

- `js/data/tmdb-client.js`
- `service-worker.js`

## Caché

`seriespelis-v2-sprint12-1-2-cast-order-fix`
