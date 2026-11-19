import { useEffect, useState } from "react";

/** Las 5 secciones de la navegación inferior, en orden. */
export const SECCIONES = [
  { id: "inicio", ruta: "/", titulo: "Inicio" },
  { id: "camino", ruta: "/camino", titulo: "Camino" },
  { id: "inventario", ruta: "/inventario", titulo: "Inventario" },
  { id: "aprende", ruta: "/aprende", titulo: "Aprendé" },
  { id: "perfil", ruta: "/perfil", titulo: "Perfil" },
] as const;

/** El onboarding vive fuera de las secciones: no tiene pestaña. */
export const RUTA_BIENVENIDA = "/bienvenida";

/** Solo en desarrollo: la referencia del sistema visual. */
export const RUTA_TEMA = "/tema";

export type Seccion = (typeof SECCIONES)[number];
export type SeccionId = Seccion["id"];

export const SECCION_INICIAL: Seccion = SECCIONES[0];

/** Rutas con hash: no necesitan configuración del servidor y funcionan igual abriendo el archivo. */
const rutaActual = (): string => globalThis.location?.hash.slice(1) || "/";

export function useRuta(): string {
  const [ruta, setRuta] = useState(rutaActual);
  useEffect(() => {
    const alCambiar = () => setRuta(rutaActual());
    globalThis.addEventListener("hashchange", alCambiar);
    return () => globalThis.removeEventListener("hashchange", alCambiar);
  }, []);
  return ruta;
}

export const seccionDeRuta = (ruta: string): Seccion => SECCIONES.find((s) => s.ruta === ruta) ?? SECCION_INICIAL;

export const irA = (ruta: string): void => {
  globalThis.location.hash = ruta;
};
