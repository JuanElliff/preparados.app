# Memoria de trabajo

Estado actual, decisiones tomadas en el camino y bitácora. La actualiza quien trabaja (Claude Code o Claude en el chat) al terminar cada tarea. Lo de arriba se reescribe; la bitácora solo crece.

## Estado actual

- Paquetes listos con tests: `dominio` (reglas), `datos` (persistencia y respaldo), `catalogo` (compila `contenido/`).
- `contenido/` tiene solo contenido de EJEMPLO, más `contenido/biblioteca/` con una entrada por dominio.
- `packages/app` tiene el MVP completo: onboarding, Camino (árbol con layout propio y tests), detalle de logro con cuestionario, Inventario, Aprendé (lector de Markdown propio, sin librería), Inicio y Perfil con respaldo.
- Tema visual en `packages/app/src/tema.css`: Rye para títulos y Bitter para el texto, empaquetadas en `src/fuentes/`; claro beige militar y oscuro negro y gris.
- Hechas las órdenes 0 a 14 de `docs/ordenes-claude-code.md`.
- Revisión del MVP (`docs/revision-mvp.md`): corregidos los puntos 1, 2, 3, 4, 5, 7, 8, 9, 10, 11 y 13, con tests donde correspondía. El 6 (el camino no entra en 390 px con más de 3 dominios) espera una decisión del autor. El 12 (dos pestañas abiertas se pisan) queda anotado, sin corregir.
- `public/robots.txt` bloquea la indexación (`Disallow: /`) hasta el lanzamiento, y todas las pantallas muestran el cartel "Versión de prueba · contenido de ejemplo".
- Licencias puestas: MIT para el código, CC BY-SA 4.0 para `contenido/`.
- Publicado en GitHub: https://github.com/JuanElliff/preparados.app, repo **público**, rama `main`. GitHub Pages activado (Settings → Pages → Source: GitHub Actions). La historia se reescribió una vez para sacar las imágenes de referencia de tipografías de los commits viejos; quedan solo en el disco del autor.
- Próximo paso: decidir el punto 6 de la revisión y cargar el contenido real (hoy todo es EJEMPLO).

## Decisiones provisorias (pendientes de confirmar por el autor)

Viven en `packages/dominio/src/config.ts` o en el código indicado.

| Tema | Valor actual |
| --- | --- |
| XP por profundidad | 10 / 25 / 50 / 100 (calibrar con los logros reales) |
| Tope de equipo | 25% del XP máximo del dominio según el catálogo |
| Items vencidos | cuentan para los logros |
| Equipo con prerrequisitos pendientes | bloqueado aunque se tenga el item |
| Sin escenarios elegidos | peso = solo el del entorno |
| Desempate de recomendaciones | orden del catálogo |
| Alertas de vencimiento | 30 días de anticipación |
| Fórmula del % de preparación | promedio ponderado de la cobertura por dominio (spec) |

## Abiertos

- Salud y Seguridad: ¿los logros de conocimiento admiten autodeclaración o solo cuestionario? (hoy: solo cuestionario).
- Vivienda y clima: ¿modifican los pesos o solo filtran logros?
- Umbral de aprobación de los cuestionarios (hoy 0,7 en los ejemplos).
- Mecánicas propuestas para fase 2: vencido, oxidado, desafíos de escenario, simulacros.

## Bitácora

Formato: `- AAAA-MM-DD · quién · qué se hizo / decidió`.

- 2026-11-18 · chat · Definida la idea, el MVP y la spec v0.1.
- 2026-11-18 · chat · Creados `packages/dominio`, `packages/datos`, `packages/catalogo` y `contenido/` con ejemplos.
- 2026-11-18 · autor · Salud reemplaza a Seguridad en el MVP. Aprendé pasa a ser biblioteca aparte. Logros de equipo solo en Inventario. Camino único en árbol con todos los dominios. Oscuro negro y gris. Niveles solo con número.
- 2026-11-18 · autor · Un entorno no desaparece del catálogo: los ids son permanentes.
- 2026-11-18 · chat · Escritos `CLAUDE.md`, `docs/CONTEXT.md`, este archivo y las órdenes para Claude Code.
- 2026-11-18 · claude-code · Orden 0: `npm install`, tests y typecheck en verde; git inicializado y primer commit.
- 2026-11-18 · claude-code · Orden 1: "Aprendé" pasa a `Catalogo.biblioteca` (`EntradaBiblioteca`: guía o video) y a `contenido/biblioteca/<dominio>/<id>.md`. Los logros ya no llevan `guia` ni `videoUrl`. Decidido: el compilador da error si un archivo de logro tiene texto después del `---`, para que no quede contenido muerto.
- 2026-11-18 · claude-code · Orden 2: ante logros duplicados en un respaldo queda el de mejor verificación y, a igual multiplicador, el más antiguo (antes quedaba el primero).
- 2026-11-18 · claude-code · Orden 3: creado `packages/app` (Vite + React + vite-plugin-pwa). Decidido: el catálogo se copia a `public/catalogo.json` antes de `dev` y `build` y se lee con fetch (no se empaqueta en el JS); navegación con hash propia en vez de router; la tienda reconcilia el guardado cuando cambió la versión del catálogo. Los iconos provisorios se generan con un script.
- 2026-11-18 · autor · Tipografías elegidas: Rye para los títulos y Bitter para el texto. Opciones comparadas en https://claude.ai/code/artifact/a14067af-5e21-4928-b456-e8ca9fb0cb71
- 2026-11-18 · claude-code · Orden 4: tema en un solo archivo (`src/tema.css`), modo claro beige militar y oscuro negro y gris, con conmutador en Perfil (preferencia del dispositivo en localStorage, no va al respaldo) y página `#/tema` solo en desarrollo. Un test verifica 4,5:1 de contraste en los dos modos.
- 2026-11-18 · claude-code · Orden 5: onboarding en 3 pasos más la pantalla de cierre con `rutaInicial`. Decidido: vive en la ruta `#/bienvenida` (sin pestaña y sin navegación inferior) para que la pantalla final sobreviva al guardado; vivienda y clima son texto libre, para no inventar una taxonomía que después choque con la del autor; el aviso de instalar en iOS sale solo en iPhone/iPad sin instalar.
- 2026-11-18 · claude-code · Orden 6: pantalla Camino. Decidido: el layout es una función pura (capa = la mayor entre la profundidad del catálogo y la de sus prerrequisitos; cada dominio ocupa su franja de columnas, con una columna de aire entre ramas) y la pantalla solo la pasa a píxeles; las ramas se dibujan en SVG y los nodos son botones; los bloqueados también se pueden tocar, para ver qué les falta.
- 2026-11-18 · claude-code · Orden 7: detalle de logro con "Lo sé hacer" y cuestionario, errores en castellano y cartel de subida de nivel. Decidido: las acciones viven en la tienda (`declarar`, `responderCuestionario`), que persiste y avisa si el dominio subió de nivel comparando el resumen de antes y el de después; los links a la biblioteca apuntan a `#/aprende/<id>`, que empieza a funcionar en la orden 9.
- 2026-11-18 · claude-code · Orden 8: pantalla Inventario. Decidido: la baja se hace desde el formulario del item (tocar la fila, después "Quitar"), para que no se borre de un toque; se pueden cargar varias entradas del mismo item con distinto vencimiento; cada logro de equipo muestra a la vez los prerrequisitos pendientes y los items que faltan. La tienda ahora expone `hoy` para que las pantallas usen la misma fecha que el resumen.
- 2026-11-18 · claude-code · Orden 9: pantalla Aprendé. Decidido: en vez de sumar una librería de Markdown, un lector propio (`src/biblioteca/markdown.ts`) que devuelve bloques y se dibuja con elementos de React, sin inyectar HTML; acepta títulos, párrafos, listas, énfasis y links http(s), y está documentado en `contenido/README.md`. Los videos se embeben desde youtube-nocookie y sin conexión muestran un aviso.
- 2026-11-18 · claude-code · Orden 10: pantalla Inicio, toda con `resumir()`. Cuatro tarjetas cortas (preparación, dominios, recomendaciones, vencimientos) con barras accesibles (`role="progressbar"`); la tarjeta de vencimientos solo aparece si hay algo por vencer.
- 2026-11-18 · claude-code · Orden 11: Perfil con edición del perfil, respaldo y borrado. Decidido: los cambios del perfil se guardan al toque (sin botón de confirmar); la importación muestra fecha, cuántos logros e items trae y los avisos antes de reemplazar; el borrado pide una segunda confirmación en la misma pantalla; `pedirAlmacenamientoPersistente` se llama desde la tienda cuando se registra el primer logro.
- 2026-11-18 · claude-code · Orden 12: revisión del MVP. Tests (114), typecheck y build en verde; Lighthouse local 100/100/100/91 en escritorio y 98/100/100/91 en móvil. Los 13 problemas encontrados quedaron en `docs/revision-mvp.md` sin tocar nada, como pedía la orden. Falta el recorrido en el celular y la prueba sin conexión real.
- 2026-11-18 · claude-code · Órdenes 13 y 14: README de la raíz, revisión de secretos (limpio), LICENSE MIT y `contenido/LICENSE` CC BY-SA 4.0, y el workflow de GitHub Pages. Decidido con el autor: las imágenes promocionales de Kanaboy y Virginia salen del repo. La ruta base sale de `VITE_BASE` (local `/`, Pages `/preparados.app/`), de donde salen también el manifest y el service worker. Sin push.
- 2026-11-18 · autor · Permiso por única vez para el push. Hecho: `git remote add origin` + `git push -u origin main` (9bf641e).
- 2026-11-19 · autor · Repo público, GitHub Pages activado (Settings → Pages → Source: GitHub Actions).
- 2026-11-19 · claude-code · Reescrita la historia para sacar las imágenes de referencia de los commits viejos (`filter-branch` + `push --force`, con permiso explícito del autor). Rama `respaldo-con-referencias` conserva la historia original en el repo local.
- 2026-11-19 · autor · Pidió corregir de la revisión del MVP los puntos 1, 2, 3, 4, 5, 7, 8, 9 y 10 (con tests), agregar en el 11 un `robots.txt` que no indexe y un cartel de "versión de prueba", dejar el 6 para después y el 12 solo anotado, ordenar `docs/MEMORY.md` y borrar la rama `respaldo-con-referencias`.
- 2026-11-19 · claude-code · Corregidos los 10 puntos pedidos de la revisión (uno por uno, con tests): avisos de reconciliación visibles y descartables; vivienda y clima en Perfil guardan recién tras una pausa o al salir del campo; `ErrorBoundary` nuevo que atrapa errores de render y manda a Inicio; la tienda recalcula sola cada 5 minutos y al volver a la pestaña; el aviso de instalar en iOS también se ve desde Perfil (antes solo al final del onboarding); el Camino recuerda el scroll al volver del detalle de un logro; en Inventario ya se puede cambiar el item al editar; fallback de color sólido para `color-mix()` (Safari viejo); `theme-color` dinámico con dos `<meta>` por preferencia del sistema en `index.html` más uno que agrega `tema.ts` cuando se elige a mano. `robots.txt` con `Disallow: /` y cartel fijo "Versión de prueba · contenido de ejemplo" en todas las pantallas. Borrada la rama local `respaldo-con-referencias`.
