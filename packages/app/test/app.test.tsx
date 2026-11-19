import { AlmacenMemoria } from "@preparados/datos";
import type { Catalogo } from "@preparados/dominio";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ejemplo from "../../dominio/test/fixtures/catalogo-ejemplo.json";
import { App } from "../src/App";
import { ProveedorTienda } from "../src/estado/contexto";
import { crearTienda } from "../src/estado/tienda";
import { SECCIONES } from "../src/rutas";

const catalogo = ejemplo as unknown as Catalogo;

const montar = () => {
  const tienda = crearTienda({
    almacen: new AlmacenMemoria(),
    cargarCatalogo: async () => catalogo,
    hoy: () => "2026-11-18",
  });
  return render(
    <ProveedorTienda tienda={tienda}>
      <App />
    </ProveedorTienda>,
  );
};

describe("App", () => {
  it("muestra las 5 secciones en la navegación inferior", async () => {
    montar();
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    expect([...nav.querySelectorAll("a")].map((a) => a.textContent)).toEqual(SECCIONES.map((s) => s.titulo));
  });

  it("arranca en Inicio mientras carga y marca la pestaña activa", async () => {
    montar();
    expect(screen.getByText("Cargando…")).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Inicio" })).toBeTruthy();
    expect(screen.getByRole("link", { current: "page" }).textContent).toBe("Inicio");
  });

  it("la ruta del hash elige la pantalla", async () => {
    globalThis.location.hash = "#/inventario";
    montar();
    expect(await screen.findByRole("heading", { name: "Inventario" })).toBeTruthy();
    globalThis.location.hash = "";
  });
});
