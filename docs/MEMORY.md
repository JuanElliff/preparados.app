# Memoria de trabajo

Estado actual, decisiones tomadas en el camino y bitácora. La actualiza quien trabaja (Claude Code o Claude en el chat) al terminar cada tarea. Lo de arriba se reescribe; la bitácora solo crece.

## Estado actual

- Paquetes listos con tests: `dominio` (reglas), `datos` (persistencia y respaldo), `catalogo` (compila `contenido/`).
- `contenido/` tiene solo contenido de EJEMPLO, más `contenido/biblioteca/` con una entrada por dominio.
- Git inicializado, rama `main`, sin remoto configurado todavía. Sin push.
- `packages/app` es el esqueleto de la PWA: navegación de 5 secciones con pantallas vacías, tienda propia sobre `AlmacenIndexedDB` + `resumir()`, service worker que precachea la app y el catálogo.
- Tema visual armado: `packages/app/src/tema.css` tiene tipografías, colores y tamaños como variables. Rye para títulos y Bitter para el texto, las dos empaquetadas en `src/fuentes/`.
- Onboarding andando: sin perfil guardado la app redirige a `#/bienvenida` (entorno, vivienda y clima, escenarios) y al terminar muestra la ruta inicial.
- Hechas las órdenes 0 a 5 de `docs/ordenes-claude-code.md`.
- Próximo paso: orden 6 (camino de logros en árbol).

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
- Licencia del repo (antes de publicar).

## Bitácora

Formato: `- AAAA-MM-DD · quién · qué se hizo / decidió`.

- 2026-11-18 · chat · Definida la idea, el MVP y la spec v0.1.
- 2026-11-18 · chat · Creados `packages/dominio`, `packages/datos`, `packages/catalogo` y `contenido/` con ejemplos.
- 2026-11-18 · autor · Salud reemplaza a Seguridad en el MVP. Aprendé pasa a ser biblioteca aparte. Logros de equipo solo en Inventario. Camino único en árbol con todos los dominios. Oscuro negro y gris. Niveles solo con número.
- 2026-11-18 · autor · Un entorno no desaparece del catálogo: los ids son permanentes.
- 2026-11-18 · chat · Escritos `CLAUDE.md`, `docs/CONTEXT.md`, este archivo y las órdenes para Claude Code.
- 2026-11-18 · claude-code · Orden 0: `npm install`, tests y typecheck en verde; git inicializado y primer commit.
- 2026-11-18 · claude-code · Orden 1: "Aprendé" pasa a `Catalogo.biblioteca` (`EntradaBiblioteca`: guía o video) y a `contenido/biblioteca/<dominio>/<id>.md`. Los logros ya no llevan `guia` ni `videoUrl`. Decidido: el compilador da error si un archivo de logro tiene texto después del `---`, para que no quede contenido muerto.
- 2026-11-18 · claude-code · Orden 4: tema en un solo archivo (`src/tema.css`), modo claro beige militar y oscuro negro y gris, con conmutador en Perfil (preferencia del dispositivo en localStorage, no va al respaldo) y página `#/tema` solo en desarrollo. Un test verifica 4,5:1 de contraste en los dos modos.
- 2026-11-18 · claude-code · Orden 5: onboarding en 3 pasos más la pantalla de cierre con `rutaInicial`. Decidido: vive en la ruta `#/bienvenida` (sin pestaña y sin navegación inferior) para que la pantalla final sobreviva al guardado; vivienda y clima son texto libre, para no inventar una taxonomía que después choque con la del autor; el aviso de instalar en iOS sale solo en iPhone/iPad sin instalar.
- 2026-11-18 · autor · Tipografías elegidas: Rye para los títulos y Bitter para el texto.
- 2026-11-18 · claude-code · Orden 3: creado `packages/app` (Vite + React + vite-plugin-pwa). Decidido: el catálogo se copia a `public/catalogo.json` antes de `dev` y `build` y se lee con fetch (no se empaqueta en el JS); navegación con hash propia en vez de router; la tienda reconcilia el guardado cuando cambió la versión del catálogo. Los iconos provisorios se generan con un script.
- 2026-11-18 · claude-code · Orden 2: ante logros duplicados en un respaldo queda el de mejor verificación y, a igual multiplicador, el más antiguo (antes quedaba el primero).
