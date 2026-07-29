# Sprint 12.1 · Ficha ampliada, reparto y actualización TMDb unificada

## Incluye

- Reparto principal con fotografía, nombre y personaje.
- Equipo técnico relevante: creación, dirección, guion, producción ejecutiva y música.
- Información ampliada: título original, lema, fechas, temporadas, episodios, estado y clasificación para adultos.
- Botón único «Actualizar desde TMDb» para series y películas.
- En series actualiza también temporadas y episodios; en películas actualiza todos los metadatos disponibles.
- Diseño compacto y adaptado a móvil.

## Compatibilidad

No hay migración destructiva. Los registros anteriores siguen funcionando. Para completar reparto y equipo en registros antiguos, abre la ficha completa y pulsa «Actualizar desde TMDb».

## Archivos modificados

- styles.css
- service-worker.js
- js/data/tmdb-client.js
- js/data/library-model.js
- js/features/detail-view.js

## Caché

`seriespelis-v2-sprint12-1-cast-crew`
