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
 */
export async function montar(estado: EstadoUsuario | null = PERFIL) {
  const almacen = new AlmacenMemoria();
  if (estado) await almacen.guardar(nuevoGuardado(estado, catalogo.version));
  const vista = render(
    <ProveedorTienda tienda={crearTienda({ almacen, cargarCatalogo: async () => catalogo, hoy: () => HOY })}>
      <App />
    </ProveedorTienda>,
  );
  return { ...vista, almacen };
}
