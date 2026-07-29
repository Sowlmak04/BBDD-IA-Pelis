# Series & Pelis V2 — Sprint 11

## Objetivo

Añadir colecciones inteligentes como vistas virtuales de la biblioteca, sin
duplicar, migrar ni modificar los registros existentes.

## Colecciones incluidas

- Favoritos.
- Prioridad alta.
- Series en curso.
- Sin empezar.
- Mejor valoradas.
- Con etiquetas.

## Seguridad de datos

Las colecciones se calculan en memoria a partir de las cuatro listas existentes.
No crean nuevas claves de almacenamiento y no alteran el modelo de datos.

## Archivos modificados

- `index.html`
- `styles.css`
- `service-worker.js`
- `js/core/navigation.js`
- `js/app.js`

## Archivo nuevo

- `js/features/smart-collections.js`

## Caché

`seriespelis-v2-sprint11-smart-collections`
