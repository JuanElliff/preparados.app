# Preparados.app

App gratuita de preparación y autosuficiencia, gamificada. Registrás lo que sabés hacer y lo que
tenés, y la app te muestra qué te falta según tu entorno y los escenarios que elegiste.

- Sin cuenta: los datos viven en tu dispositivo y se exportan como respaldo.
- Funciona sin conexión, instalable como PWA.
- En castellano, pensada primero para el celular.

**Estado: MVP en desarrollo.** Las pantallas están hechas (onboarding, Inicio, Camino, detalle de
logro con cuestionario, Inventario, Aprendé y Perfil con respaldo), pero **el catálogo es todo
contenido de EJEMPLO**: los logros, las guías y los cuestionarios reales se escriben aparte.
Lo que falta y lo que hay que corregir está en [`docs/revision-mvp.md`](docs/revision-mvp.md).

## Cómo correrla

Hace falta Node 20 o más nuevo.

```bash
npm install                        # en la raíz (npm workspaces)
npm run dev -w @preparados/app     # compila el catálogo y levanta la app
```

Vite muestra una línea **Network** con la dirección para abrirla desde el celular en la misma red.
Sin HTTPS no hay service worker ni instalación: ver [`packages/app/README.md`](packages/app/README.md).

```bash
npm test                           # todos los paquetes (vitest)
npm run typecheck                  # tsc --noEmit en todos los paquetes
npm run build -w @preparados/app   # build de producción en packages/app/dist
```

## Estructura

| Carpeta | Qué es |
| --- | --- |
| `packages/dominio` | Las reglas, en TypeScript puro y sin UI: estados de los logros, XP, niveles, pesos, % de preparación, recomendaciones y validación del catálogo. Es lo que se reutiliza el día que la app pase a React Native |
| `packages/datos` | Persistencia local: IndexedDB, respaldo exportable e importable, y reconciliación con el catálogo vigente |
| `packages/catalogo` | Compila `contenido/` (YAML + Markdown) a `dist/catalogo.json` y lo valida |
| `packages/app` | La PWA: React + Vite, celular primero, sin conexión |
| `contenido/` | El catálogo: dominios, items, entornos, escenarios, logros y biblioteca |
| `docs/` | Contexto del proyecto, memoria de trabajo, órdenes y referencias visuales |

Las reglas del dominio no dependen del navegador: se prueban solas y se pueden llevar a otra app.

## Cómo se carga el contenido

Todo el catálogo se escribe en `contenido/`, en YAML y Markdown, y se compila a un JSON que la app
lee. Las instrucciones completas están en [`contenido/README.md`](contenido/README.md).

```bash
cd packages/catalogo && npm run compilar   # contenido/ → dist/catalogo.json
```

- Un logro por archivo en `logros/<dominio>/<id>.md`: solo datos, sin texto después del `---`.
- Una entrada de "Aprendé" por archivo en `biblioteca/<dominio>/<id>.md`: datos arriba, guía abajo.
- Los ids son permanentes: no se renombran ni se borran una vez publicados.
- Si algo está mal, el compilador lo dice con archivo y campo, y no genera el JSON.

En Salud (y en Seguridad cuando entre) la app no enseña procedimientos de riesgo: solo conocimiento
y equipo, y las guías derivan a cursos presenciales.

## Licencia

Pendiente de definir.
