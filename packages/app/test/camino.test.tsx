import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { montar, PERFIL } from "./ayuda";

beforeAll(() => {
  // jsdom no implementa scrollTo y la pantalla arranca abajo del árbol.
  globalThis.scrollTo = () => {};
});

afterEach(() => {
  globalThis.location.hash = "";
});

const nodo = (titulo: string) => screen.getByRole("button", { name: new RegExp(`^${titulo}\\.`) });

describe("camino", () => {
  it("muestra solo las habilidades, agrupadas por dominio", async () => {
    globalThis.location.hash = "#/camino";
    await montar();
    await screen.findByRole("heading", { name: "Camino" });

    // agua-reserva y agua-filtro son de equipo: van en Inventario.
    expect(screen.queryByRole("button", { name: /^Reserva de agua/ })).toBeNull();
    expect(nodo("Potabilizar agua \\(ejemplo\\)")).toBeTruthy();

    const rotulos = [...document.querySelectorAll(".camino__rotulo")].map((r) => r.textContent);
    expect(rotulos).toEqual(["Agua", "Comida", "Salud"]);
  });

  it("cada nodo dice dominio, XP y estado", async () => {
    globalThis.location.hash = "#/camino";
    await montar();
    await screen.findByRole("heading", { name: "Camino" });
    expect(nodo("Potabilizar agua \\(ejemplo\\)").getAttribute("aria-label")).toBe(
      "Potabilizar agua (ejemplo). Agua, 10 XP, disponible.",
    );
  });

  it("marca como logrado lo que el usuario ya hizo", async () => {
    globalThis.location.hash = "#/camino";
    await montar({
      ...PERFIL,
      logros: [{ logro: "agua-potabilizar", metodo: "cuestionario", fecha: "2026-11-18" }],
    });
    await screen.findByRole("heading", { name: "Camino" });
    const marcado = nodo("Potabilizar agua \\(ejemplo\\)");
    expect(marcado.className).toContain("camino-nodo--logrado");
    expect(marcado.getAttribute("aria-label")).toContain("logrado");
  });

  it("tocar un nodo abre el detalle del logro", async () => {
    globalThis.location.hash = "#/camino";
    await montar();
    await screen.findByRole("heading", { name: "Camino" });
    fireEvent.click(nodo("Potabilizar agua \\(ejemplo\\)"));

    expect(globalThis.location.hash).toBe("#/logro/agua-potabilizar");
    expect(await screen.findByRole("heading", { name: "Potabilizar agua (ejemplo)" })).toBeTruthy();
    // La pestaña Camino queda marcada, porque el detalle cuelga de ahí.
    expect(screen.getByRole("link", { current: "page" }).textContent).toBe("Camino");

    fireEvent.click(screen.getByRole("button", { name: "Volver al camino" }));
    expect(await screen.findByRole("heading", { name: "Camino" })).toBeTruthy();
  });

  it("al volver del detalle de un logro, recuerda dónde estaba en vez de saltar al fondo", async () => {
    const llamadas: number[] = [];
    globalThis.scrollTo = ((opciones?: ScrollToOptions) => llamadas.push(opciones?.top ?? 0)) as typeof scrollTo;

    globalThis.location.hash = "#/camino";
    await montar();
    await screen.findByRole("heading", { name: "Camino" });

    // El usuario se mueve por el árbol antes de tocar un logro.
    Object.defineProperty(globalThis, "scrollY", { value: 350, configurable: true });
    globalThis.dispatchEvent(new Event("scroll"));

    fireEvent.click(nodo("Potabilizar agua \\(ejemplo\\)"));
    await screen.findByRole("heading", { name: "Potabilizar agua (ejemplo)" });

    fireEvent.click(screen.getByRole("button", { name: "Volver al camino" }));
    await screen.findByRole("heading", { name: "Camino" });

    expect(llamadas.at(-1)).toBe(350);

    Object.defineProperty(globalThis, "scrollY", { value: 0, configurable: true });
    globalThis.scrollTo = () => {};
  });
});
