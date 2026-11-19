import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { montar } from "./ayuda";

afterEach(() => {
  globalThis.location.hash = "";
  vi.unstubAllGlobals();
});

const clic = (nombre: string | RegExp) => fireEvent.click(screen.getByRole("button", { name: nombre }));

const abrir = async (ruta = "#/aprende") => {
  globalThis.location.hash = ruta;
  const vista = await montar();
  await screen.findByRole("heading", { level: 1 });
  return vista;
};

describe("aprendé", () => {
  it("lista las entradas con su dominio y tipo", async () => {
    await abrir();
    expect(screen.getByRole("button", { name: /Cómo potabilizar agua \(ejemplo\)/ }).textContent).toContain(
      "Agua · Guía",
    );
    expect(screen.getByRole("button", { name: /Qué lleva un botiquín \(ejemplo\)/ }).textContent).toContain(
      "Salud · Video",
    );
  });

  it("filtra por dominio", async () => {
    await abrir();
    clic("Comida");
    expect(screen.getByRole("button", { name: /Armar una despensa \(ejemplo\)/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Cómo potabilizar agua \(ejemplo\)/ })).toBeNull();

    clic("Todo");
    expect(screen.getByRole("button", { name: /Cómo potabilizar agua \(ejemplo\)/ })).toBeTruthy();
  });

  it("abre una guía con el Markdown hecho elementos y los logros relacionados", async () => {
    await abrir();
    clic(/Cómo potabilizar agua \(ejemplo\)/);

    expect(globalThis.location.hash).toBe("#/aprende/agua-potabilizar-guia");
    expect(await screen.findByRole("heading", { name: "Cómo potabilizar agua (ejemplo)" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Qué necesitás" })).toBeTruthy();
    expect(screen.getByText(/Guía de EJEMPLO/)).toBeTruthy();

    const link = screen.getByRole("link", { name: "Potabilizar agua (ejemplo)" });
    expect(link.getAttribute("href")).toBe("#/logro/agua-potabilizar");
  });

  it("un video se embebe desde YouTube", async () => {
    await abrir("#/aprende/salud-botiquin-video");
    const marco = document.querySelector("iframe");
    expect(marco?.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/XXXXXXXXXXX");
    expect(marco?.getAttribute("title")).toBe("Qué lleva un botiquín (ejemplo)");
  });

  it("sin conexión, el video avisa y la guía se lee igual", async () => {
    vi.stubGlobal("navigator", { ...globalThis.navigator, onLine: false });

    await abrir("#/aprende/salud-botiquin-video");
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.getByText(/Este video necesita internet/)).toBeTruthy();

    globalThis.location.hash = "#/aprende/agua-potabilizar-guia";
    await montar();
    expect(await screen.findByText(/Guía de EJEMPLO/)).toBeTruthy();
  });

  it("una entrada que ya no existe no rompe la pantalla", async () => {
    await abrir("#/aprende/no-existe");
    expect(screen.getByRole("heading", { name: "No encontramos esa entrada" })).toBeTruthy();
    clic("Volver a Aprendé");
    expect(await screen.findByRole("heading", { name: "Aprendé" })).toBeTruthy();
  });
});
