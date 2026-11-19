# Contexto de Preparados.app

Qué es el proyecto y qué está decidido. Es estable: solo lo cambia el autor, o Claude con su OK explícito.

- Especificación v0.1: https://claude.ai/artifact/9WfdPs2wbAHv7htLjf4DMo
- Repositorio: https://github.com/JuanElliff/preparados.app (remoto `origin`, rama `main`)

## Producto

App gratuita de preparación y autosuficiencia, gamificada. El usuario registra lo que sabe hacer y lo que tiene; la app le muestra qué le falta según su entorno y los escenarios que eligió. Proyecto hobby, abierto a cualquiera. Se usa sin cuenta; la cuenta es opcional (fase 2).

- **Dominios (9):** Agua, Fuego, Comida, Cultivo, Salud, Seguridad, Comunicación, Refugio, Navegación.
- **Entorno:** ciudad, pueblo, campo, barrio privado, más vivienda y clima. **Escenarios:** corte de servicios, colapso social, catástrofe natural, pandemia (lista abierta).
- **Logros:** de habilidad (se declaran) y de equipo (se cumplen solos con el inventario). Árbol con prerrequisitos; estados logrado / disponible / bloqueado.
- **Verificación:** autodeclaración 50% del XP, cuestionario aprobado 100%. Foto, video y certificado en fase 2.
- **Salud y Seguridad:** solo conocimiento (cuestionario) y equipo. La app no enseña procedimientos de riesgo; deriva a cursos.
- **Métricas:** XP y nivel por dominio (niveles con número, sin nombres de rango); % de preparación por escenario es la métrica central. Recomendaciones = logros disponibles ordenados por peso del dominio.
- **"Aprendé":** biblioteca de contenido aparte de los logros (guías y videos curados por el autor). Sin contenido de usuarios sin moderar.
- Sin rachas diarias. Alertas de vencimiento del inventario.

## MVP

- Dominios: Agua, Comida, Salud.
- Onboarding, Inicio, Camino, Detalle de logro con cuestionario, Inventario, Aprendé, Perfil con respaldo.
- Sin cuenta, datos en el dispositivo, funciona sin conexión, respaldo exportable/importable.
- Fuera: cuenta y sincronización, los otros 6 dominios, foto/video/certificado, planes y mapa, social, IA.

Fases siguientes (orden propuesto): 2) cuenta, sincronización, resto de dominios, evidencias; 3) planes y mapa; 4) conector MCP y chat con IA; 5) social y expertos.

## Técnica

- Monorepo con npm workspaces, TypeScript estricto.
- PWA en React + Vite + vite-plugin-pwa. React Native cuando haya versión definitiva: por eso las reglas viven en `packages/dominio`, sin UI.
- Datos locales en IndexedDB. En iOS la PWA tiene que instalarse en la pantalla de inicio: desde Safari, los datos se borran tras 7 días sin uso.
- Notificaciones push: fase 2 (necesitan servidor). En el MVP las alertas se ven dentro de la app.

## Dirección visual

- Celular primero.
- Modo oscuro: negro y gris. Modo claro: beige de tono militar.
- Rústico y táctico. El camino de logros es un árbol con ramas y bifurcaciones que incluye todos los dominios, estilo Duolingo / Candy Crush pero con ramas de árbol.
- Tipografía vintage tipo rótulo western (referencias en `docs/referencias/`), con fuentes gratuitas parecidas.
- Animación al subir de nivel.

## Legal

Los términos y condiciones no deslindan del todo en Argentina; protege más el diseño (contenido curado, Salud y Seguridad sin prácticas, advertencias). Un abogado revisa los términos antes del lanzamiento. Inventario + ubicación son datos sensibles: en el MVP no salen del dispositivo.
