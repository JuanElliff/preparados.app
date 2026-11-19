import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { catalogoCon, HOY, montar, PERFIL } from "./ayuda";

afterEach(() => {
  globalThis.location.hash = "";
});

const clic = (nombre: string | RegExp) => fireEvent.click(screen.getByRole("button", { name: nombre }));

const abrir = async (id: string, ...args: Parameters<typeof montar>) => {
  globalThis.location.hash = `#/logro/${id}`;
  const vista = await montar(...args);
  await screen.findByRole("heading", { name: /ejemplo/ });
  return vista;
};

/** Responde las 3 preguntas del cuestionario de ejemplo. Las correctas son 0, 1 y 2. */
const responderCuestionario = (respuestas: number[]) => {
  respuestas.forEach((opcion, i) => {
    fireEvent.click(screen.getAllByRole("radio")[opcion] as HTMLElement);
    clic(i === respuestas.length - 1 ? "Terminar" : "Siguiente");
  });
};

describe("detalle de logro", () => {
  it("muestra dominio, XP y estado", async () => {
    await abrir("agua-potabilizar");
    expect(screen.getByText("Agua · 10 XP · Disponible")).toBeTruthy();
  });

  it('"Lo sé hacer" registra la autodeclaración y deja la mitad del XP', async () => {
    const { almacen } = await abrir("agua-potabilizar");
    clic("Lo sé hacer");

    await waitFor(async () => {
      expect((await almacen.cargar())?.estado.logros).toEqual([
        { logro: "agua-potabilizar", metodo: "autodeclaracion", fecha: HOY },
      ]);
    });
    expect(await screen.findByText("Agua · 5 de 10 XP · Logrado")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mejorar con el cuestionario" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Lo sé hacer" })).toBeNull();
  });

  it("el cuestionario va de a una pregunta y aprobar deja el XP completo", async () => {
    const { almacen } = await abrir("agua-potabilizar");
    clic("Hacer el cuestionario");

    expect(screen.getByText(/Pregunta 1 de 3/)).toBeTruthy();
    responderCuestionario([0, 1, 2]);

    expect(await screen.findByRole("heading", { name: "Aprobado" })).toBeTruthy();
    expect(screen.getByText("Respondiste bien 3 de 3.")).toBeTruthy();
    await waitFor(async () => {
      expect((await almacen.cargar())?.estado.logros[0]?.metodo).toBe("cuestionario");
    });

    clic("Volver al logro");
    expect(await screen.findByText("Agua · 10 de 10 XP · Logrado")).toBeTruthy();
  });

  it("si no aprueba, dice cuántas acertó y deja reintentar", async () => {
    const { almacen } = await abrir("agua-potabilizar");
    clic("Hacer el cuestionario");
    responderCuestionario([0, 0, 0]);

    expect(await screen.findByRole("heading", { name: "No alcanzó" })).toBeTruthy();
    expect(screen.getByText("Respondiste bien 1 de 3.")).toBeTruthy();
    expect((await almacen.cargar())?.estado.logros).toEqual([]);

    clic("Reintentar");
    expect(screen.getByText(/Pregunta 1 de 3/)).toBeTruthy();
  });

  it("un logro de Salud solo ofrece el cuestionario", async () => {
    await abrir("salud-conocimiento-1");
    expect(screen.queryByRole("button", { name: "Lo sé hacer" })).toBeNull();
    expect(screen.getByRole("button", { name: "Hacer el cuestionario" })).toBeTruthy();
  });

  it("un logro bloqueado no deja registrar y explica qué falta", async () => {
    await abrir("agua-lluvia");
    expect(screen.getByText(/Bloqueado/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lo sé hacer" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText(/Potabilizar agua \(ejemplo\)/)).toBeTruthy();
    expect(screen.getByText(/Se destraba cuando completes lo de arriba/)).toBeTruthy();
  });

  it("enlaza las entradas de la biblioteca del logro", async () => {
    await abrir("agua-potabilizar");
    const link = screen.getByRole("link", { name: "Cómo potabilizar agua (ejemplo)" });
    expect(link.getAttribute("href")).toBe("#/aprende/agua-potabilizar-guia");
  });

  it("si el XP sube el nivel del dominio, lo muestra", async () => {
    // Con el XP del ejemplo no alcanza para el nivel 2: se sube el del logro a propósito.
    const catalogo = catalogoCon((c) => {
      const logro = c.logros.find((l) => l.id === "agua-potabilizar");
      if (logro) logro.xpBase = 120;
    });
    await abrir("agua-potabilizar", PERFIL, catalogo);
    clic("Lo sé hacer");

    const cartel = await screen.findByRole("status");
    expect(cartel.textContent).toContain("Agua subió de nivel");
    expect(cartel.textContent).toContain("2");

    clic("Seguir");
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  });
});
