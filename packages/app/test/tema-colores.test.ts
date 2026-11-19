import { afterEach, describe, expect, it } from "vitest";
import { aplicarTema } from "../src/tema";

const ID_META = "theme-color-elegido";

afterEach(() => {
  delete document.documentElement.dataset.tema;
  document.getElementById(ID_META)?.remove();
  document.documentElement.style.removeProperty("--fondo");
});

describe("aplicarTema: theme-color", () => {
  it('en "sistema" no agrega ningún meta: lo resuelven los dos de index.html con media query', () => {
    document.documentElement.style.setProperty("--fondo", "#d6cfb6");
    aplicarTema("sistema");
    expect(document.getElementById(ID_META)).toBeNull();
  });

  it("al elegir un tema a mano, agrega un meta sin media que pisa a los del sistema", () => {
    document.documentElement.style.setProperty("--fondo", "#d6cfb6");
    aplicarTema("claro");
    const meta = document.getElementById(ID_META);
    expect(meta?.tagName).toBe("META");
    expect(meta?.getAttribute("name")).toBe("theme-color");
    expect(meta?.hasAttribute("media")).toBe(false);
    expect(meta?.getAttribute("content")).toBe("#d6cfb6");
  });

  it("si se cambia de oscuro a claro, actualiza el mismo meta en vez de duplicarlo", () => {
    document.documentElement.style.setProperty("--fondo", "#0e0e0d");
    aplicarTema("oscuro");
    document.documentElement.style.setProperty("--fondo", "#d6cfb6");
    aplicarTema("claro");
    expect(document.querySelectorAll(`#${ID_META}`)).toHaveLength(1);
    expect(document.getElementById(ID_META)?.getAttribute("content")).toBe("#d6cfb6");
  });

  it("volver a sistema saca el meta elegido a mano", () => {
    document.documentElement.style.setProperty("--fondo", "#0e0e0d");
    aplicarTema("oscuro");
    expect(document.getElementById(ID_META)).not.toBeNull();
    aplicarTema("sistema");
    expect(document.getElementById(ID_META)).toBeNull();
  });
});
