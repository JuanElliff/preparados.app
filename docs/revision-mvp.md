# Revisión del MVP

Orden 12. Fecha: 2026-11-18. Nada de esto está corregido todavía: es la lista para decidir qué se arregla.

## Lo que está en verde

| Chequeo | Resultado |
| --- | --- |
| `npm test` (4 paquetes) | 114 tests, todos pasan |
| `npm run typecheck` | sin errores |
| Build de producción | 231 kB de JS (72 kB gzip), 19 archivos precacheados (366 kB) |
| Lighthouse escritorio | rendimiento 100 · accesibilidad 100 · buenas prácticas 100 · SEO 91 |
| Lighthouse móvil | rendimiento 98 · accesibilidad 100 · buenas prácticas 100 · SEO 91 |
| Contraste del tema | test propio: 4,5:1 en los dos modos |
| Precache | index.html, JS, CSS, las dos tipografías, `catalogo.json`, íconos y manifest |

El MVP tiene todas las pantallas de la spec: onboarding, Inicio, Camino, detalle con cuestionario,
Inventario, Aprendé y Perfil con respaldo.

## Problemas, de más a menos importante

### 1. Los avisos de reconciliación no se muestran nunca

`packages/app/src/estado/tienda.ts`. Cuando cambia la versión del catálogo, la tienda reconcilia el
estado guardado y deja la lista de lo descartado en `estado.avisos`. Ninguna pantalla la lee: si a
alguien se le borran logros o items porque el catálogo cambió, no se entera.

### 2. Perfil escribe en IndexedDB en cada tecla

`packages/app/src/pantallas/Perfil.tsx`. Los campos de vivienda y clima guardan en cada `onChange`.
Son escrituras por letra. Conviene guardar al salir del campo o con una espera corta.

### 3. No hay red de seguridad ante un error de render

Un error en cualquier pantalla deja la app en blanco, y con el service worker cacheado cuesta más
salir del paso. Falta un *error boundary* con un mensaje y un botón para volver a Inicio.

### 4. `recalcular()` no lo llama nadie

La fecha se fija al cargar. Si la app queda abierta y pasa la medianoche, las alertas de vencimiento
y los estados quedan viejos hasta que se recargue.

### 5. El aviso de instalación en iOS aparece una sola vez

Hoy se muestra al final del onboarding. Si en ese momento no la instala, no vuelve a verlo, y en
Safari los datos se borran tras 7 días sin uso. Debería poder verse también desde Perfil.

### 6. El camino ya no entra en una pantalla de celular

Con los 3 dominios del MVP mide 520 px de ancho: en 390 px hay scroll horizontal. Con los 9
dominios de la spec va a ser bastante peor. Hay que decidir: navegación por dominio, zoom, o
columnas más angostas.

### 7. El camino salta al fondo cada vez que se entra

También al volver del detalle de un logro, que es el caso más común. Debería recordar dónde estabas.

### 8. En Inventario no se puede cambiar el item de una entrada

Al editar, el selector queda deshabilitado: para corregir un item cargado mal hay que quitarlo y
volver a cargarlo.

### 9. `color-mix()` en el cartel de subida de nivel

Safari menor a 16.4 no lo entiende y el fondo del cartel queda sin tinte. No rompe nada, pero
conviene un color de respaldo.

### 10. El `theme_color` del manifest es fijo oscuro

La app sincroniza la barra del navegador con el tema elegido, pero el manifest tiene un solo color:
instalada en modo claro, la barra del sistema arranca oscura.

### 11. Detalles de publicación

- No hay `robots.txt` (es lo único que baja el SEO a 91).
- CSS y tipografías bloquean el primer pintado: FCP 1,7 s en el móvil simulado.
- `start_url`, `scope` y la base de Vite son `/`: hay que ajustarlos para GitHub Pages (orden 14).

### 12. Dos pestañas abiertas se pisan

El último guardado gana, sin aviso. Es poco probable en el celular y aceptable para el MVP, pero
conviene anotarlo.

### 13. Limpieza

`estaInstalada` y `SECCION_INICIAL` quedaron exportados sin uso.

## Lo que falta verificar y no se puede acá

- **Recorrido completo en el celular** (onboarding → declarar → cuestionario → subir de nivel →
  inventario → exportar e importar). Necesita HTTPS en la red local o la app publicada.
- **Funcionamiento sin conexión real**: el precache está completo y la navegación tiene fallback a
  `index.html`, pero falta probarlo en modo avión con la app instalada.
- **Instalación como PWA**: Lighthouse 12 ya no trae la categoría PWA. El manifest se revisó a mano
  (nombre, `start_url`, `scope`, `display: standalone`, íconos 192/512 y maskable, service worker
  con `autoUpdate`).
- **Contenido real**: `contenido/` sigue con los ejemplos. El catálogo de verdad es condición para
  publicar.
