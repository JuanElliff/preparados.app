import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { montar } from "./ayuda";

afterEach(() => {
  globalThis.location.hash = "";
});

const clic = (nombre: string) => fireEvent.click(screen.getByRole("button", { name: nombre }));

describe("onboarding", () => {
  it("sin perfil guardado, la primera apertura lleva a la bienvenida", async () => {
    await montar(null);
    expect(await screen.findByRole("heading", { name: "¿Dónde vivís?" })).toBeTruthy();
    expect(globalThis.location.hash).toBe("#/bienvenida");
    // Durante el onboarding no hay navegación inferior.
    expect(screen.queryByRole("navigation", { name: "Secciones" })).toBeNull();
  });

  it("no deja seguir sin entorno ni terminar sin escenarios", async () => {
    await montar(null);
    await screen.findByRole("heading", { name: "¿Dónde vivís?" });
    expect(screen.getByRole("button", { name: "Seguir" }).hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "Campo" }));
    expect(screen.getByRole("button", { name: "Seguir" }).hasAttribute("disabled")).toBe(false);
    clic("Seguir");
    await screen.findByRole("heading", { name: "Tu casa y tu clima" });
    clic("Seguir");

    await screen.findByRole("heading", { name: "¿Para qué te querés preparar?" });
    expect(screen.getByRole("button", { name: "Terminar" }).hasAttribute("disabled")).toBe(true);
  });

  it("guarda el perfil y muestra por dónde empezar", async () => {
    const { almacen } = await montar(null);
    await screen.findByRole("heading", { name: "¿Dónde vivís?" });

    fireEvent.click(screen.getByRole("radio", { name: "Ciudad" }));
    clic("Seguir");

    await screen.findByRole("heading", { name: "Tu casa y tu clima" });
    fireEvent.change(screen.getByLabelText("Tipo de vivienda"), { target: { value: "Departamento" } });
    clic("Seguir");

    await screen.findByRole("heading", { name: "¿Para qué te querés preparar?" });
    fireEvent.click(screen.getByRole("checkbox", { name: "Corte de servicios" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Pandemia" }));
    clic("Terminar");

    expect(await screen.findByRole("heading", { name: "Por acá se empieza" })).toBeTruthy();
    const guardado = await almacen.cargar();
    expect(guardado?.estado.perfil).toEqual({
      entorno: "ciudad",
      vivienda: "Departamento",
      escenarios: ["corte-servicios", "pandemia"],
    });

    // La ruta inicial sale del resumen del dominio: logros disponibles de profundidad 1.
    expect(screen.getByText("Potabilizar agua (ejemplo)")).toBeTruthy();

    clic("Empezar");
    expect(globalThis.location.hash).toBe("#/");
    expect(await screen.findByRole("heading", { name: "Inicio" })).toBeTruthy();
  });
});
