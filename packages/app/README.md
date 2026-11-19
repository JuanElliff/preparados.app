# @preparados/app

La PWA de Preparados.app: React + Vite, celular primero (se diseña a 390 px de ancho), datos en el
dispositivo y funcionamiento sin conexión.

```bash
npm run dev -w @preparados/app        # compila el catálogo y levanta Vite
npm run build -w @preparados/app      # compila el catálogo y genera dist/
npm run preview -w @preparados/app    # sirve dist/ (es el único modo con service worker)
npm test -w @preparados/app           # vitest + @testing-library/react
```

## Cómo se arma

- `scripts/preparar-catalogo.mjs` compila `contenido/` y copia `packages/catalogo/dist/catalogo.json`
  a `public/catalogo.json`. Lo corren `dev` y `build`, así que el catálogo nunca queda viejo.
  El archivo copiado no se versiona: se genera.
- El service worker (`vite-plugin-pwa`, `registerType: "autoUpdate"`) precachea la app **y el catálogo**.
- `src/estado/tienda.ts` es el estado de la app: carga el catálogo y el guardado de `AlmacenIndexedDB`,
  llama a `resumir()` del dominio y avisa a los suscriptores. Sin librería de estado, para poder
  reusarla en React Native.
- Navegación con hash (`#/camino`), sin router: cinco secciones en la barra inferior.
- Los iconos son provisorios y se generan con `npm run iconos -w @preparados/app` (quedan versionados).
- Las tipografías (Rye para títulos, Bitter para el texto; las dos con licencia OFL) viven en
  `src/fuentes/`, subset latin bajado de Google Fonts. Van dentro de la app: no se piden a internet.
- El tema está entero en `src/tema.css`: tipografías, colores y tamaños como variables CSS. Modo oscuro
  negro y gris, modo claro beige militar; sigue al sistema salvo que se elija uno en Perfil. En desarrollo,
  `#/tema` muestra el sistema visual completo.

## Probarla en el celular, en la red local

1. En la compu: `npm run dev -w @preparados/app`. Vite escucha en toda la red (`server.host`) y muestra
   una línea **Network**, por ejemplo `http://192.168.0.12:5173/`.
2. El celular tiene que estar en la misma red Wi-Fi. Abrí esa dirección en el navegador del celular.
3. La primera vez, Windows pregunta si deja pasar a Node: hay que permitirlo en **redes privadas**.

Con `http://` simple se ve la interfaz, pero **no** hay service worker ni se puede instalar la app:
los navegadores solo los habilitan en `https://` o en `localhost`. Para probar la instalación y el
funcionamiento sin conexión en el celular hace falta HTTPS en la red local; la forma más corta es
agregar `@vitejs/plugin-basic-ssl` (certificado propio: el celular avisa que no es de confianza y hay
que aceptarlo una vez) o publicar la carpeta `dist/` en un hosting con HTTPS.
