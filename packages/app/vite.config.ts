import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
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
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#14150f",
        theme_color: "#14150f",
        icons: [
          { src: "/icono-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icono-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // El catálogo entra acá: sin él la app no puede mostrar nada sin conexión.
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest,json,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  // host: true para abrirla desde el celular en la red local.
  server: { host: true },
  preview: { host: true },
});
