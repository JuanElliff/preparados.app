import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { montar } from "./ayuda";
import { SECCIONES } from "../src/rutas";

afterEach(() => {
  globalThis.location.hash = "";
});

describe("App", () => {
  it("muestra las 5 secciones en la navegación inferior", async () => {
    await montar();
    const nav = screen.getByRole("navigation", { name: "Secciones" });
    expect([...nav.querySelectorAll("a")].map((a) => a.textContent)).toEqual(SECCIONES.map((s) => s.titulo));
  });

  it("arranca en Inicio mientras carga y marca la pestaña activa", async () => {
    await montar();
    expect(screen.getByText("Cargando…")).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Inicio" })).toBeTruthy();
    expect(screen.getByRole("link", { current: "page" }).textContent).toBe("Inicio");
  });

  it("la ruta del hash elige la pantalla", async () => {
    globalThis.location.hash = "#/inventario";
    await montar();
    expect(await screen.findByRole("heading", { name: "Inventario" })).toBeTruthy();
  });
});
