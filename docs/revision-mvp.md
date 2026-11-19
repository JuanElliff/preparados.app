# Revisión del MVP

Orden 12. Hecha el 2026-11-18. Los puntos 1 a 5, 7 a 11 y 13 se corrigieron el 2026-11-19, con
tests donde correspondía. El 6 espera una decisión del autor. El 12 queda anotado, sin corregir.

## Lo que está en verde

| Chequeo | Resultado |
| --- | --- |
| `npm test` (4 paquetes) | 131 tests, todos pasan |
| `npm run typecheck` | sin errores |
| Build de producción | 271 kB de JS (83 kB gzip), 19 archivos precacheados (369 kB) |
| Lighthouse escritorio | rendimiento 100 · accesibilidad 100 · buenas prácticas 100 · SEO 91 (antes de agregar `robots.txt`) |
| Lighthouse móvil | rendimiento 98 · accesibilidad 100 · buenas prácticas 100 · SEO 91 (antes de agregar `robots.txt`) |
| Contraste del tema | test propio: 4,5:1 en los dos modos |
| Precache | index.html, JS, CSS, las dos tipografías, `catalogo.json`, íconos, manifest y el cartel fijo |

El MVP tiene todas las pantallas de la spec: onboarding, Inicio, Camino, detalle con cuestionario,
Inventario, Aprendé y Perfil con respaldo.

## Problemas, de más a menos importante

### 1. Los avisos de reconciliación no se muestran nunca — Corregido

`packages/app/src/estado/tienda.ts`. Cuando cambia la versión del catálogo, la tienda reconcilia el
estado guardado y deja la lista de lo descartado en `estado.avisos`. Ninguna pantalla la lee: si a
alguien se le borran logros o items porque el catálogo cambió, no se entera.

**Corregido.** `src/AvisoDescartes.tsx`: un banner en `App.tsx`, visible en cualquier pantalla
(incluida la bienvenida, por si el entorno guardado desapareció), que se puede cerrar. Test en
`test/avisos.test.tsx`.

### 2. Perfil escribe en IndexedDB en cada tecla — Corregido

`packages/app/src/pantallas/Perfil.tsx`. Los campos de vivienda y clima guardan en cada `onChange`.
Son escrituras por letra. Conviene guardar al salir del campo o con una espera corta.

**Corregido.** Vivienda y clima ahora tienen estado local: guardan 500 ms después de la última
tecla, o al toque si el campo pierde el foco antes. Tests en `test/perfil.test.tsx`.

### 3. No hay red de seguridad ante un error de render — Corregido

Un error en cualquier pantalla deja la app en blanco, y con el service worker cacheado cuesta más
salir del paso. Falta un *error boundary* con un mensaje y un botón para volver a Inicio.

**Corregido.** `src/ErrorBoundary.tsx`, envolviendo todo en `main.tsx`. Muestra el mensaje del error
y un botón que manda a Inicio. Test en `test/error-boundary.test.tsx`.

### 4. `recalcular()` no lo llama nadie — Corregido

La fecha se fija al cargar. Si la app queda abierta y pasa la medianoche, las alertas de vencimiento
y los estados quedan viejos hasta que se recargue.

**Corregido.** `ProveedorTienda` (`src/estado/contexto.tsx`) llama a `recalcular()` cada 5 minutos y
al volver a la pestaña (`visibilitychange`). Tests en `test/recalcular.test.tsx`.

### 5. El aviso de instalación en iOS aparece una sola vez — Corregido

Hoy se muestra al final del onboarding. Si en ese momento no la instala, no vuelve a verlo, y en
Safari los datos se borran tras 7 días sin uso. Debería poder verse también desde Perfil.

**Corregido.** El aviso se sacó a `src/InstalacionIOS.tsx` (`<AvisoInstalacion />`) y se usa tanto en
el cierre del onboarding como en Perfil. Test en `test/perfil.test.tsx`.

### 6. El camino ya no entra en una pantalla de celular — Espera decisión del autor

Con los 3 dominios del MVP mide 520 px de ancho: en 390 px hay scroll horizontal. Con los 9
dominios de la spec va a ser bastante peor. Hay que decidir: navegación por dominio, zoom, o
columnas más angostas.

Sin cambios: el autor todavía no eligió un camino.

### 7. El camino salta al fondo cada vez que se entra — Corregido

También al volver del detalle de un logro, que es el caso más común. Debería recordar dónde estabas.

**Corregido.** `Camino.tsx` recuerda la última posición de scroll (fuera del componente, porque se
desmonta al navegar) y la restaura al volver a entrar; solo arranca abajo la primera vez. Test en
`test/camino.test.tsx`.

### 8. En Inventario no se puede cambiar el item de una entrada — Corregido

Al editar, el selector queda deshabilitado: para corregir un item cargado mal hay que quitarlo y
volver a cargarlo.

**Corregido.** Se sacó el `disabled`; si el item nuevo no vence, se limpia el vencimiento que
hubiera quedado del anterior. Test en `test/inventario.test.tsx`.

### 9. `color-mix()` en el cartel de subida de nivel — Corregido

Safari menor a 16.4 no lo entiende y el fondo del cartel queda sin tinte. No rompe nada, pero
conviene un color de respaldo.

**Corregido.** `.subida` en `estilos.css` declara primero un fondo sólido (`var(--fondo)`) y después
el `color-mix()`: los navegadores que no entienden la segunda declaración se quedan con la primera.

### 10. El `theme_color` del manifest es fijo oscuro — Corregido donde se pudo

La app sincroniza la barra del navegador con el tema elegido, pero el manifest tiene un solo color:
instalada en modo claro, la barra del sistema arranca oscura.

**Corregido para el caso más común** (tema "sistema", sin elegir nada a mano): `index.html` ahora
trae dos `<meta name="theme-color">`, uno por preferencia (`prefers-color-scheme`), así la barra
acierta desde el primer pintado sin esperar al JS. Si se elige un tema a mano en Perfil, `tema.ts`
agrega un tercer `<meta>` que pisa a esos dos. El `theme_color` del **manifest** (que es el que usa
la pantalla de carga al abrir la PWA instalada) sigue fijo en oscuro: no hay forma de que dependa
del tema elegido sin generar el manifest dinámicamente, algo que excede este MVP. Test en
`test/tema-colores.test.ts`.

### 11. Detalles de publicación — Corregido lo que se pidió

- No hay `robots.txt` (es lo único que baja el SEO a 91).
- CSS y tipografías bloquean el primer pintado: FCP 1,7 s en el móvil simulado.
- `start_url`, `scope` y la base de Vite son `/`: hay que ajustarlos para GitHub Pages (orden 14).

**Hecho:** `public/robots.txt` con `Disallow: /`, para que no se indexe hasta el lanzamiento (el
catálogo sigue siendo de EJEMPLO). Sumado, no pedido originalmente: un cartel fijo y discreto
("Versión de prueba · contenido de ejemplo") visible en todas las pantallas, para que quien entre
desde ese link sepa que no es la app final. El FCP y el ajuste de ruta para Pages quedan como
estaban (el segundo ya se había resuelto en la orden 14, antes de esta revisión).

### 12. Dos pestañas abiertas se pisan — Anotado, sin corregir

El último guardado gana, sin aviso. Es poco probable en el celular y aceptable para el MVP, pero
conviene anotarlo.

Queda así: no se tocó nada.

### 13. Limpieza — Corregido

`estaInstalada` y `SECCION_INICIAL` quedaron exportados sin uso.

**Corregido.** Las dos dejaron de exportarse: siguen usándose dentro de su propio archivo
(`instalacion.ts` y `rutas.ts`), pero ya no salen de ahí.

## Lo que falta verificar y no se puede acá

- **Recorrido completo en el celular** (onboarding → declarar → cuestionario → subir de nivel →
  inventario → exportar e importar). Necesita HTTPS en la red local o la app publicada.
- **Funcionamiento sin conexión real**: el precache está completo y la navegación tiene fallback a
  `index.html`, pero falta probarlo en modo avión con la app instalada.
- **Instalación como PWA**: Lighthouse 12 ya no trae la categoría PWA. El manifest se revisó a mano
  (nombre, `start_url`, `scope`, `display: standalone`, íconos 192/512 y maskable, service worker
  con `autoUpdate`).
- **Contenido real**: `contenido/` sigue con los ejemplos. El catálogo de verdad es condición para
  publicar (y para sacar el `robots.txt` y el cartel de versión de prueba).
