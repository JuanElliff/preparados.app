import { AlmacenMemoria, nuevoGuardado } from "@preparados/datos";
import type { Catalogo, EstadoUsuario } from "@preparados/dominio";
import { render } from "@testing-library/react";
import ejemplo from "../../dominio/test/fixtures/catalogo-ejemplo.json";
import { App } from "../src/App";
import { ProveedorTienda } from "../src/estado/contexto";
import { crearTienda } from "../src/estado/tienda";

export const catalogo = ejemplo as unknown as Catalogo;
export const HOY = "2026-11-18";

export const PERFIL: EstadoUsuario = {
  perfil: { entorno: "ciudad", escenarios: ["corte-servicios"] },
  logros: [],
  inventario: [],
};

/**
 * Monta la app con un almacén en memoria. Sin estado guardado arranca el onboarding;
 * con estado, va directo a las secciones.
 *
 * `versionGuardada`: para simular que el catálogo cambió desde el último guardado (dispara la
 * reconciliación). Por defecto, la misma versión del catálogo que se usa: sin cambios.
 */
export async function montar(
  estado: EstadoUsuario | null = PERFIL,
  usado: Catalogo = catalogo,
  versionGuardada?: string,
) {
  const almacen = new AlmacenMemoria();
  if (estado) await almacen.guardar(nuevoGuardado(estado, versionGuardada ?? usado.version));
  const vista = render(
    <ProveedorTienda tienda={crearTienda({ almacen, cargarCatalogo: async () => usado, hoy: () => HOY })}>
      <App />
    </ProveedorTienda>,
  );
  return { ...vista, almacen };
}

/** Copia del catálogo de ejemplo con un retoque, para probar casos que el ejemplo no cubre. */
export function catalogoCon(retoque: (c: Catalogo) => void): Catalogo {
  const copia = structuredClone(catalogo);
  retoque(copia);
  return copia;
}
