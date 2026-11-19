import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { montar, PERFIL } from "./ayuda";

afterEach(() => {
  globalThis.location.hash = "";
});

const clic = (nombre: string | RegExp) => fireEvent.click(screen.getByRole("button", { name: nombre }));

const abrir = async (...args: Parameters<typeof montar>) => {
  globalThis.location.hash = "#/inventario";
  const vista = await montar(...args);
  await screen.findByRole("heading", { name: "Inventario" });
  return vista;
};

describe("inventario", () => {
  it("sin nada cargado, lo dice y ofrece agregar", async () => {
    await abrir();
    expect(screen.getByText(/Todavía no cargaste nada/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Agregar" })).toBeTruthy();
  });

  it("agrega un item con cantidad y vencimiento", async () => {
    const { almacen } = await abrir();
    clic("Agregar");

    fireEvent.change(screen.getByLabelText("Qué es"), { target: { value: "bidon-agua" } });
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Vence el"), { target: { value: "2027-03-01" } });
    clic("Guardar");

    await waitFor(async () => {
      expect((await almacen.cargar())?.estado.inventario).toEqual([
        { item: "bidon-agua", cantidad: 3, vencimiento: "2027-03-01" },
      ]);
    });
    expect(await screen.findByText("3 unidades · vence el 2027-03-01")).toBeTruthy();
  });

  it("no deja guardar una cantidad inválida", async () => {
    await abrir();
    clic("Agregar");
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "0" } });
    clic("Guardar");
    expect(screen.getByText(/La cantidad tiene que ser un número entero mayor que cero/)).toBeTruthy();
  });

  it("el vencimiento solo aparece en los items que vencen", async () => {
    await abrir();
    clic("Agregar");
    fireEvent.change(screen.getByLabelText("Qué es"), { target: { value: "anafe" } });
    expect(screen.queryByLabelText("Vence el")).toBeNull();
  });

  it("edita y da de baja un item", async () => {
    const { almacen } = await abrir({
      ...PERFIL,
      inventario: [{ item: "conserva", cantidad: 2, vencimiento: "2027-01-01" }],
    });

    clic(/^Conserva/);
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "5" } });
    clic("Guardar");
    await waitFor(async () => {
      expect((await almacen.cargar())?.estado.inventario[0]?.cantidad).toBe(5);
    });

    clic(/^Conserva/);
    clic("Quitar");
    await waitFor(async () => {
      expect((await almacen.cargar())?.estado.inventario).toEqual([]);
    });
  });

  it("arriba muestra las alertas de vencimiento", async () => {
    await abrir({
      ...PERFIL,
      // HOY es 2026-11-18: uno vencido y otro dentro de los 30 días de aviso.
      inventario: [
        { item: "conserva", cantidad: 1, vencimiento: "2026-11-10" },
        { item: "bidon-agua", cantidad: 2, vencimiento: "2026-12-01" },
      ],
    });
    expect(screen.getByText(/Conserva: vencido hace 8 días/)).toBeTruthy();
    expect(screen.getByText(/Bidón de agua: vence en 13 días/)).toBeTruthy();
  });

  it("abajo muestra los logros de equipo y qué falta para cada uno", async () => {
    await abrir({ ...PERFIL, inventario: [{ item: "bidon-agua", cantidad: 1 }] });

    // agua-reserva pide 2 bidones: falta 1.
    const reserva = screen.getByText("Reserva de agua (ejemplo)").closest("li");
    expect(reserva?.textContent).toContain("Te falta: 1 × Bidón de agua");

    // agua-filtro arrastra dos cosas: el logro previo y el item.
    const filtro = screen.getByText("Filtro de agua (ejemplo)").closest("li");
    expect(filtro?.textContent).toContain("Primero: Potabilizar agua (ejemplo)");
    expect(filtro?.textContent).toContain("Te falta: 1 × Filtro de agua");
  });

  it("un logro de equipo cumplido se marca como logrado", async () => {
    await abrir({ ...PERFIL, inventario: [{ item: "bidon-agua", cantidad: 2 }] });
    const reserva = screen.getByText("Reserva de agua (ejemplo)").closest("li");
    expect(reserva?.className).toContain("nodo--logrado");
    expect(reserva?.textContent).toContain("Lo tenés");
  });
});
