import type { Catalogo } from "@preparados/dominio";

/**
 * El catálogo compilado se copia a public/ antes del build (npm run catalogo) y el service worker
 * lo precachea, así la app lo tiene disponible sin conexión.
 */
export async function cargarCatalogo(): Promise<Catalogo> {
  const r = await fetch(`${import.meta.env.BASE_URL}catalogo.json`);
  if (!r.ok) throw new Error(`no se pudo leer el catálogo (${r.status})`);
  return (await r.json()) as Catalogo;
}
