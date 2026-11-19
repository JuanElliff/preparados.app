import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Ruta desde la que se sirve la app. En local es la raíz; en GitHub Pages, el nombre del repo.
 * El workflow de Pages la pasa como VITE_BASE=/preparados.app/.
 */
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icono-32.png", "icono-180.png"],
      manifest: {
        name: "Preparados",
        short_name: "Preparados",
        description: "Preparación y autosuficiencia, paso a paso. Tus datos quedan en tu dispositivo.",
        lang: "es",
        dir: "ltr",
        id: base,
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "portrait",
        // Para la pantalla de carga al abrir la PWA instalada. Fijo en oscuro: el manifest no
        // puede seguir el tema elegido a mano (eso lo resuelve index.html + tema.ts una vez que
        // carga la página).
        background_color: "#0e0e0d",
        theme_color: "#0e0e0d",
        // Relativos al manifest: así sirven igual en la raíz o dentro de /preparados.app/.
        icons: [
          { src: "icono-192.png", sizes: "192x192", type: "image/png" },
          { src: "icono-512.png", sizes: "512x512", type: "image/png" },
          { src: "icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // El catálogo entra acá: sin él la app no puede mostrar nada sin conexión.
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest,json,woff2}"],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
  // host: true para abrirla desde el celular en la red local.
  server: { host: true },
  preview: { host: true },
});
