import { AlmacenMemoria, nuevoGuardado } from "@preparados/datos";
import type { Catalogo, EstadoUsuario } from "@preparados/dominio";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ejemplo from "../../dominio/test/fixtures/catalogo-ejemplo.json";
import { ProveedorTienda, useEstadoApp } from "../src/estado/contexto";
import { crearTienda } from "../src/estado/tienda";

const catalogo = ejemplo as unknown as Catalogo;

const estado: EstadoUsuario = {
  perfil: { entorno: "ciudad", escenarios: ["corte-servicios"] },
  logros: [],
  inventario: [],
};

/** Expone la fecha con la que se calculó el resumen, para comprobar que se actualiza sola. */
function Sonda() {
  const e = useEstadoApp();
  if (e.fase !== "listo") return null;
  return <p>hoy: {e.hoy}</p>;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("recalcular automático", () => {
  it("cada cierto tiempo, vuelve a calcular el resumen con la fecha actual", async () => {
    let hoy = "2026-11-18";
    const almacen = new AlmacenMemoria();
    await almacen.guardar(nuevoGuardado(estado, catalogo.version));
    const tienda = crearTienda({ almacen, cargarCatalogo: async () => catalogo, hoy: () => hoy });
    // Se carga antes de montar, así el primer render ya sale "listo": no hace falta esperar nada
    // async con los timers ya truchos (eso rompería el polling de RTL).
    await tienda.iniciar();

    vi.useFakeTimers();
    render(
      <ProveedorTienda tienda={tienda}>
        <Sonda />
      </ProveedorTienda>,
    );
    expect(screen.getByText("hoy: 2026-11-18")).toBeTruthy();

    hoy = "2026-11-19";
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect(screen.getByText("hoy: 2026-11-19")).toBeTruthy();
  });

  it("al volver visible la pestaña, recalcula sin esperar el intervalo", async () => {
    let hoy = "2026-11-18";
    const almacen = new AlmacenMemoria();
    await almacen.guardar(nuevoGuardado(estado, catalogo.version));
    const tienda = crearTienda({ almacen, cargarCatalogo: async () => catalogo, hoy: () => hoy });

    render(
      <ProveedorTienda tienda={tienda}>
        <Sonda />
      </ProveedorTienda>,
    );
    await screen.findByText("hoy: 2026-11-18");

    hoy = "2026-11-20";
    document.dispatchEvent(new Event("visibilitychange"));
    expect(await screen.findByText("hoy: 2026-11-20")).toBeTruthy();
  });
});
