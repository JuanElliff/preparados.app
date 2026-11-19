import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { montar, PERFIL } from "./ayuda";

afterEach(() => {
  globalThis.location.hash = "";
});

describe("avisos de reconciliación", () => {
  it("si el catálogo cambió, muestra lo que se descartó y se puede cerrar", async () => {
    globalThis.location.hash = "#/";
    await montar(
      { ...PERFIL, logros: [{ logro: "borrado", metodo: "cuestionario", fecha: "2026-11-01" }] },
      undefined,
      "vieja",
    );

    expect(await screen.findByText(/logro descartado: borrado \(ya no existe\)/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Entendido" }));
    expect(screen.queryByText(/logro descartado: borrado/)).toBeNull();
  });

  it("sin cambios en el catálogo, no muestra nada", async () => {
    globalThis.location.hash = "#/";
    await montar();
    await screen.findByRole("heading", { name: "Inicio" });
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("si el entorno guardado desaparece, el aviso se ve aunque mande de vuelta a la bienvenida", async () => {
    globalThis.location.hash = "#/";
    await montar({ ...PERFIL, perfil: { entorno: "luna", escenarios: [] } }, undefined, "vieja");

    expect(await screen.findByText(/el entorno guardado ya no existe/)).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "¿Dónde vivís?" })).toBeTruthy();
  });
});
