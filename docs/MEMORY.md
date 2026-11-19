# Memoria de trabajo

Estado actual, decisiones tomadas en el camino y bitácora. La actualiza quien trabaja (Claude Code o Claude en el chat) al terminar cada tarea. Lo de arriba se reescribe; la bitácora solo crece.

## Estado actual

- Paquetes listos con tests: `dominio` (reglas), `datos` (persistencia y respaldo), `catalogo` (compila `contenido/`).
- `contenido/` tiene solo contenido de EJEMPLO, más `contenido/biblioteca/` con una entrada por dominio.
- Git inicializado, rama `main`, sin remoto configurado todavía. Sin push.
- Hechas las órdenes 0, 1 y 2 de `docs/ordenes-claude-code.md`.
- Próximo paso: orden 3 (esqueleto de la PWA en `packages/app`). La orden 4 (tema visual) necesita que el autor elija la tipografía.

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
- Tipografía: elegir entre las opciones que proponga la orden 4.

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
