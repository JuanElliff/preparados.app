# Órdenes para Claude Code

Se pegan de a una, en orden, en Claude Code (VS Code) con `C:\Preparados.app` abierto. Antes de pasar a la siguiente: revisar lo que hizo, correr la app si corresponde y hacer commit.

El contexto del proyecto está en `CLAUDE.md`, que Claude Code lee solo al arrancar.

---

## 0. Puesta en marcha y git

```
Leé CLAUDE.md y los README de packages/ y contenido/. Corré npm install, npm test y npm run typecheck y decime el resultado. Después inicializá git con rama main y un .gitignore adecuado (node_modules, dist, .env), hacé el primer commit "Paquetes dominio, datos y catalogo" y agregá el remoto origin https://github.com/JuanElliff/preparados.app.git. No hagas push todavía.
```

## 1. Biblioteca "Aprendé" separada de los logros

```
Cambio de modelo: "Aprendé" deja de ser una pestaña de cada logro y pasa a ser una biblioteca de contenido aparte.

- En packages/dominio/src/tipos.ts: sacá guia y videoUrl de Logro. El cuestionario queda en el logro (es su verificación). Agregá EntradaBiblioteca { id, dominio, tipo: "guia" | "video", titulo, resumen, cuerpo? (Markdown, obligatorio si es guía), videoUrl? (obligatorio si es video), logros: LogroId[] (relacionados) } y Catalogo.biblioteca.
- validarCatalogo: ids duplicados, dominio existente, guía con cuerpo, video con videoUrl, logros relacionados existentes.
- packages/catalogo: leer contenido/biblioteca/<dominio>/<id>.md (frontmatter YAML + cuerpo Markdown), mismo criterio que los logros (archivos con "_" se ignoran, el nombre del archivo = id).
- contenido/: sacar video y cuerpo de la plantilla de logros; crear contenido/biblioteca/_plantilla.md y una entrada de EJEMPLO por dominio; actualizar contenido/README.md.
- Actualizá el fixture de tests y agregá tests para la validación nueva.
Terminá con npm test, npm run typecheck y npm run compilar en verde.
```

## 2. Duplicados al importar un respaldo

```
En packages/datos/src/reconciliar.ts, cuando un logro aparece registrado más de una vez, hoy se queda el primero. Cambialo para que se quede el de mejor verificación (mayor multiplicador según CONFIG_POR_DEFECTO.multiplicadores); a igual multiplicador, el de fecha más antigua. Actualizá el test y el README de datos.
```

## 3. Esqueleto de la PWA

```
Creá packages/app: PWA con Vite + React + TypeScript + vite-plugin-pwa, que use @preparados/dominio y @preparados/datos del workspace.
- Celular primero (diseñar para 390 px de ancho).
- El catálogo se toma de packages/catalogo/dist/catalogo.json en el build (agregá el paso de compilación al script de build).
- Funciona sin conexión: service worker que precachea la app y el catálogo.
- Manifest instalable (nombre "Preparados", íconos provisorios).
- Navegación inferior con 5 secciones: Inicio, Camino, Inventario, Aprendé, Perfil. Pantallas vacías por ahora.
- Un store de estado simple (sin librerías pesadas) que cargue y guarde con AlmacenIndexedDB y llame a resumir() del dominio.
- Scripts: dev, build, preview, test (vitest + @testing-library/react).
No implementes las pantallas todavía. Decime cómo correrla en el celular en la red local.
```

## 4. Tema visual

```
Armá el sistema visual de packages/app antes de las pantallas. Referencias en docs/referencias/ (tipografía vintage tipo rótulo western: Kanaboy y Virginia).
- Tipografía: buscá en Google Fonts 3 opciones gratuitas con licencia OFL que se parezcan a las referencias para títulos, más una tipografía legible para el texto. Mostrame las opciones y esperá que elija antes de aplicarlas. Las fuentes van incluidas en la app (sin depender de internet).
- Modo oscuro: negro y gris. Modo claro: beige de tono militar. Que siga la preferencia del sistema y se pueda cambiar en Perfil.
- Estilo rústico y táctico; nada de degradados de "app genérica".
- Definí los colores y tamaños como variables CSS en un solo archivo de tema. Contraste de texto mínimo 4.5:1 en los dos modos.
- Hacé una página /tema (solo en desarrollo) que muestre colores, tipografías, botones y el nodo de logro en sus 3 estados.
```

## 5. Onboarding

```
Implementá el onboarding de la primera apertura: elegir entorno (del catálogo), tipo de vivienda y clima (texto o lista simple), y uno o más escenarios. Guardar el perfil con AlmacenIndexedDB. Al terminar, mostrar la ruta inicial (rutaInicial del resumen) y llevar a Inicio. En iOS, si la app no está instalada, mostrar cómo agregarla a la pantalla de inicio: sin instalarla, Safari borra los datos tras 7 días sin uso.
```

## 6. Camino de logros (árbol)

```
Implementá la pantalla Camino: un solo árbol con los logros de habilidad de TODOS los dominios. Los logros de equipo NO van acá: van en Inventario.
- Estilo: camino rústico tipo ramas de árbol, que se recorre de abajo hacia arriba como Duolingo / Candy Crush. Hay bifurcaciones: un logro puede abrir varios, y uno puede necesitar varios.
- Layout: calculalo a partir del grafo de prerrequisitos (capas por profundidad, ramas agrupadas por dominio), no a mano. Escribí el algoritmo de layout como función pura con tests.
- Nodo: estado logrado / disponible / bloqueado (de estadosDeLogros), dominio y XP. Lo disponible se distingue a simple vista.
- Tocar un nodo abre el detalle del logro.
- Tiene que andar fluido con 100 logros en un celular de gama media.
Usá el catálogo de ejemplo para probarlo.
```

## 7. Detalle de logro, cuestionario y subida de nivel

```
Implementá el detalle de logro: título, descripción, dominio, XP, prerrequisitos, items que necesita y estado.
- Acciones según metodosPermitidos: "Lo sé hacer" (declararLogro con autodeclaración, 50% del XP) y "Hacer el cuestionario" (aprobarCuestionario, 100%). Si ya está autodeclarado, ofrecer mejorar con el cuestionario.
- Cuestionario: una pregunta por pantalla, resultado al final con correctas/total; si no aprueba, puede reintentar.
- Link a las entradas de la biblioteca relacionadas con el logro.
- Si el XP nuevo sube el nivel del dominio: animación de subida de nivel (número del nivel nuevo). Respetar prefers-reduced-motion.
- Mostrar los errores de las acciones (bloqueado, método no permitido, sin mejora) con texto claro.
```

## 8. Inventario

```
Implementá Inventario: lista de items del usuario con cantidad y vencimiento (solo si el item vence). Alta, edición y baja. Arriba, las alertas de vencimiento (itemsPorVencer). Abajo, los logros de equipo con su estado: cuáles cumple y qué le falta para los demás. Las notificaciones push quedan para después: en el MVP las alertas se muestran dentro de la app (Web Push necesita un servidor que las envíe).
```

## 9. Biblioteca "Aprendé"

```
Implementá Aprendé: biblioteca de contenido separada de los logros. Filtro por dominio, lista de entradas (guía o video), detalle con el Markdown renderizado o el video de YouTube embebido, y links a los logros relacionados. Sin conexión, las guías se leen igual; los videos muestran un aviso de que necesitan internet.
```

## 10. Inicio

```
Implementá Inicio con resumir(): % de preparación por escenario elegido, nivel y progreso de XP por dominio, 3 recomendaciones (con acceso directo al logro) y alertas de vencimiento. Todo en una pantalla de celular sin scroll largo.
```

## 11. Perfil y respaldo

```
Implementá Perfil: cambiar entorno, vivienda, clima y escenarios; cambiar tema claro/oscuro; exportar respaldo (descarga un .json con exportarRespaldo); importar respaldo (importarRespaldo, mostrar los avisos y pedir confirmación antes de reemplazar los datos actuales); borrar todos los datos con doble confirmación. Pedí almacenamiento persistente con pedirAlmacenamientoPersistente al guardar el primer logro.
```

## 12. Revisión final del MVP

```
Revisá el MVP completo contra CLAUDE.md y la spec: tests y typecheck en verde, build de producción, Lighthouse (PWA instalable, accesibilidad, rendimiento en móvil), funcionamiento sin conexión, y un recorrido completo en el celular: onboarding → declarar un logro → aprobar un cuestionario → subir de nivel → cargar inventario → exportar e importar el respaldo. Dame la lista de problemas encontrados antes de corregir nada.
```

## 13. Publicar en GitHub

```
Preparemos la publicación en https://github.com/JuanElliff/preparados.app (repo público).
1. Revisá que no haya secretos, datos personales ni archivos innecesarios en el historial ni en el árbol.
2. Creá un README.md en la raíz: qué es la app, estado (MVP en desarrollo), cómo correrla, estructura del monorepo y cómo cargar contenido.
3. Proponeme 2 o 3 licencias posibles para el código (y si conviene una distinta para el contenido de contenido/), con una línea sobre qué implica cada una. Esperá mi elección y agregá el archivo LICENSE.
4. Recién con mi OK: git push -u origin main.
```

## 14. Publicación automática en GitHub Pages

```
Configurá la publicación de packages/app en GitHub Pages, en https://juanelliff.github.io/preparados.app/
- Workflow de GitHub Actions que en cada push a main: instala, corre npm test y npm run typecheck, compila el catálogo, hace el build de la app y la publica en Pages. Si fallan los tests, no publica.
- Ruta base de Vite, manifest (start_url, scope) y service worker ajustados a /preparados.app/.
- Que la navegación interna funcione al recargar cualquier pantalla en Pages.
- Decime qué tengo que activar en la configuración del repo (Settings > Pages) y si hace falta algún permiso del workflow.
No hagas push: lo hago yo o te lo pido.
```
