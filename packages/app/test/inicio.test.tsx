import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { montar, PERFIL } from "./ayuda";

afterEach(() => {
  globalThis.location.hash = "";
});

const abrir = async (...args: Parameters<typeof montar>) => {
  globalThis.location.hash = "#/";
  const vista = await montar(...args);
  await screen.findByRole("heading", { name: "Inicio" });
  return vista;
};

describe("inicio", () => {
  it("muestra el % de preparación de cada escenario elegido", async () => {
    await abrir({ ...PERFIL, perfil: { entorno: "ciudad", escenarios: ["corte-servicios", "pandemia"] } });
    const barras = screen.getAllByRole("progressbar");
    const preparacion = barras.filter((b) => ["Corte de servicios", "Pandemia"].includes(b.getAttribute("aria-label") ?? ""));
    expect(preparacion).toHaveLength(2);
    expect(preparacion[0]?.getAttribute("aria-valuenow")).toBe("0");
  });

  it("sube el porcentaje al registrar un logro", async () => {
    await abrir({
      ...PERFIL,
      logros: [{ logro: "agua-potabilizar", metodo: "cuestionario", fecha: "2026-11-18" }],
    });
    const barra = screen.getByRole("progressbar", { name: "Corte de servicios" });
    expect(Number(barra.getAttribute("aria-valuenow"))).toBeGreaterThan(0);
  });

  it("muestra nivel y XP de cada dominio", async () => {
    await abrir();
    expect(screen.getByText("Agua · Nivel 1")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "Agua, nivel 1" })).toBeTruthy();
  });

  it("lista tres recomendaciones y lleva al logro", async () => {
    await abrir();
    const recomendados = screen
      .getAllByRole("button")
      .filter((b) => b.className.includes("nodo--disponible"));
    expect(recomendados).toHaveLength(3);

    fireEvent.click(recomendados[0] as HTMLElement);
    expect(globalThis.location.hash).toMatch(/^#\/logro\//);
  });

  it("muestra las alertas de vencimiento y el acceso al inventario", async () => {
    await abrir({ ...PERFIL, inventario: [{ item: "conserva", cantidad: 1, vencimiento: "2026-11-20" }] });
    expect(screen.getByText("Conserva: en 2 días")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Ver inventario" }));
    expect(globalThis.location.hash).toBe("#/inventario");
  });

  it("sin vencimientos cercanos no muestra esa tarjeta", async () => {
    await abrir();
    expect(screen.queryByRole("heading", { name: "Vencimientos" })).toBeNull();
  });
});
