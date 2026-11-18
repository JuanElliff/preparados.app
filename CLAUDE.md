# Preparados.app

App gratuita de preparación y autosuficiencia, gamificada. El usuario registra lo que sabe hacer y lo que tiene; la app le muestra qué le falta según su entorno y los escenarios que eligió. Proyecto hobby, abierto a cualquiera.

Especificación v0.1: https://claude.ai/artifact/9WfdPs2wbAHv7htLjf4DMo

Repositorio: https://github.com/JuanElliff/preparados.app (remoto `origin`, rama `main`). No hacer push sin que el autor lo pida.

## Estructura

| Carpeta | Qué es |
| --- | --- |
| `packages/dominio` | Reglas en TS puro, sin UI: estados de logros, XP, niveles, pesos, % de preparación, recomendaciones, validación del catálogo. Es lo que se reutiliza al migrar a React Native |
| `packages/datos` | Persistencia local: IndexedDB, respaldo exportable/importable, reconciliación con el catálogo |
| `packages/catalogo` | Compila `contenido/` (YAML + Markdown) a `dist/catalogo.json` y lo valida |
| `contenido/` | El catálogo: dominios, items, entornos, escenarios, logros. Lo escribe el autor. Ver `contenido/README.md` |
| `docs/` | Órdenes de trabajo y referencias visuales |

## Comandos

```bash
npm install            # en la raíz (npm workspaces)
npm test               # todos los paquetes (vitest)
npm run typecheck      # tsc --noEmit en todos los paquetes
cd packages/catalogo && npm run compilar
```

Antes de dar una tarea por terminada: `npm test` y `npm run typecheck` en verde.

## Convenciones

- TypeScript estricto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- Nombres del dominio en español (logro, dominio, entorno, escenario, inventario), igual que la spec.
- `packages/dominio` no importa nada de UI ni del navegador. Funciones puras; las acciones devuelven un estado nuevo y no mutan el recibido.
- Todo valor de regla que no esté confirmado vive en `packages/dominio/src/config.ts`, no hardcodeado.
- Los ids del catálogo son permanentes: no se renombran ni se borran.
- Cada cambio de reglas lleva tests.

## Decisiones de producto (resumen)

- MVP: Agua, Comida y Salud. Sin cuenta, datos solo en el dispositivo, uso sin conexión, respaldo exportable. PWA en React; React Native cuando haya versión definitiva.
- Logros de habilidad (se declaran) y de equipo (se cumplen solos con el inventario). Verificación: autodeclaración 50% del XP, cuestionario aprobado 100%.
- Salud y Seguridad: solo conocimiento (cuestionario) y equipo. La app no enseña procedimientos de riesgo; deriva a cursos.
- "Aprendé" es una biblioteca de contenido aparte de los logros.
- Sin contenido de usuarios sin moderar. Sin rachas diarias.

## Dirección visual

- Celular primero.
- Modo oscuro: negro y gris. Modo claro: beige de tono militar.
- Estilo rústico y táctico. El camino de logros es un árbol con ramas y bifurcaciones que incluye todos los dominios, estilo Duolingo / Candy Crush pero con ramas de árbol.
- Tipografía vintage tipo rótulo western (referencias en `docs/referencias/`).
- Niveles con número, sin nombres de rango. Animación al subir de nivel.

## Decisiones provisorias (en `config.ts`, pendientes de confirmar)

Tope de equipo sobre el XP máximo del catálogo · items vencidos cuentan · equipo con prerrequisitos pendientes queda bloqueado · sin escenarios elegidos se usa solo el peso del entorno · desempate de recomendaciones por orden del catálogo · alertas de vencimiento con 30 días de anticipación.
