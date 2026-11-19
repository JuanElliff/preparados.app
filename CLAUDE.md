# Preparados.app — reglas de trabajo

Contexto del proyecto y estado actual (se cargan al iniciar):

@docs/CONTEXT.md
@docs/MEMORY.md

## Antes y después de cada tarea

- **Antes:** chequeá que la tarea no contradiga `docs/CONTEXT.md` ni una decisión de `docs/MEMORY.md`. Si contradice, frená y preguntá.
- **Después:** actualizá `docs/MEMORY.md`: el "Estado actual" y una línea nueva en la bitácora (`fecha · claude-code · qué se hizo y qué se decidió`). Si tomaste una decisión que no estaba definida, agregala a "Decisiones provisorias" y avisá.
- `docs/CONTEXT.md` solo se cambia con OK explícito del autor.
- No hagas push sin que el autor lo pida.
- No inventes contenido real (logros, guías, cuestionarios, pesos): lo escribe el autor. Para probar, usá el contenido de EJEMPLO.

## Estructura

| Carpeta | Qué es |
| --- | --- |
| `packages/dominio` | Reglas en TS puro, sin UI: estados de logros, XP, niveles, pesos, % de preparación, recomendaciones, validación del catálogo |
| `packages/datos` | Persistencia local: IndexedDB, respaldo exportable/importable, reconciliación con el catálogo |
| `packages/catalogo` | Compila `contenido/` (YAML + Markdown) a `dist/catalogo.json` y lo valida |
| `contenido/` | El catálogo. Ver `contenido/README.md` |
| `docs/` | Contexto, memoria, órdenes de trabajo y referencias visuales |

## Comandos

```bash
npm install            # en la raíz (npm workspaces)
npm test               # todos los paquetes (vitest)
npm run typecheck      # tsc --noEmit en todos los paquetes
cd packages/catalogo && npm run compilar
```

Una tarea no está terminada sin `npm test` y `npm run typecheck` en verde.

## Convenciones

- TypeScript estricto (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- Nombres del dominio en español (logro, dominio, entorno, escenario, inventario), igual que la spec.
- `packages/dominio` no importa nada de UI ni del navegador. Funciones puras; las acciones devuelven un estado nuevo y no mutan el recibido.
- Todo valor de regla no confirmado vive en `packages/dominio/src/config.ts`.
- Los ids del catálogo son permanentes: no se renombran ni se borran.
- Cada cambio de reglas lleva tests.
