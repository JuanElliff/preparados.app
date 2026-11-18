# @preparados/datos

Persistencia local del MVP: el estado del usuario vive en el dispositivo y se puede exportar e importar como respaldo.

- `AlmacenIndexedDB`: guarda el estado en IndexedDB del navegador (un solo registro). `AlmacenMemoria` sirve para los tests.
- `exportarRespaldo` / `importarRespaldo`: un JSON marcado como respaldo de Preparados. La importación migra esquemas viejos, valida la forma y ajusta el estado al catálogo vigente. No escribe en el almacén: quien llama decide.
- `reconciliar`: ajusta un estado al catálogo vigente. Sirve al importar y al cargar la app después de una actualización del catálogo. Descarta, con aviso, escenarios, logros e items que ya no existen, registros de logros de equipo, métodos ya no permitidos y duplicados (queda el primero).
- `pedirAlmacenamientoPersistente`: le pide al navegador que no borre los datos por falta de espacio. No cubre la regla de iOS que borra los datos tras 7 días sin uso en Safari: para eso, la app instalada en la pantalla de inicio más el respaldo.

Para cambiar `EstadoUsuario`: subir `VERSION_ESQUEMA` y agregar la migración en `MIGRACIONES` (`src/respaldo.ts`).
