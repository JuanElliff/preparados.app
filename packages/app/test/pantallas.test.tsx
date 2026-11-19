import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { montar } from "./ayuda";

afterEach(() => {
  globalThis.location.hash = "";
  delete document.documentElement.dataset.tema;
  globalThis.localStorage.clear();
});

describe("tema en Perfil", () => {
  it("elegir claro u oscuro marca el <html> y queda guardado", async () => {
    globalThis.location.hash = "#/perfil";
    await montar();
    fireEvent.click(await screen.findByRole("button", { name: "Oscuro" }));
    expect(document.documentElement.dataset.tema).toBe("oscuro");
    expect(globalThis.localStorage.getItem("preparados:tema")).toBe("oscuro");

    fireEvent.click(screen.getByRole("button", { name: "Sistema" }));
    expect(document.documentElement.dataset.tema).toBeUndefined();
    expect(globalThis.localStorage.getItem("preparados:tema")).toBe("sistema");
  });
});

describe("página del sistema visual", () => {
  it("muestra el nodo de logro en sus tres estados", async () => {
    globalThis.location.hash = "#/tema";
    await montar();
    expect(screen.getByRole("heading", { name: "Sistema visual" })).toBeTruthy();
    const clases = [...document.querySelectorAll(".nodo")].map((n) => n.className);
    expect(clases).toEqual(["nodo nodo--logrado", "nodo nodo--disponible", "nodo nodo--bloqueado"]);
  });

  it("no marca ninguna pestaña de la navegación", async () => {
    globalThis.location.hash = "#/tema";
    await montar();
    expect(screen.queryByRole("link", { current: "page" })).toBeNull();
  });
});
