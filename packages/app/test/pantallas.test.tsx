import { AlmacenMemoria } from "@preparados/datos";
import type { Catalogo } from "@preparados/dominio";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ejemplo from "../../dominio/test/fixtures/catalogo-ejemplo.json";
import { App } from "../src/App";
import { ProveedorTienda } from "../src/estado/contexto";
import { crearTienda } from "../src/estado/tienda";

const catalogo = ejemplo as unknown as Catalogo;

const montar = () =>
  render(
    <ProveedorTienda
      tienda={crearTienda({
        almacen: new AlmacenMemoria(),
        cargarCatalogo: async () => catalogo,
        hoy: () => "2026-11-18",
      })}
    >
      <App />
    </ProveedorTienda>,
  );

afterEach(() => {
  globalThis.location.hash = "";
  delete document.documentElement.dataset.tema;
  globalThis.localStorage.clear();
});

describe("tema en Perfil", () => {
  it("elegir claro u oscuro marca el <html> y queda guardado", async () => {
    globalThis.location.hash = "#/perfil";
    montar();
    (await screen.findByRole("button", { name: "Oscuro" })).click();
    expect(document.documentElement.dataset.tema).toBe("oscuro");
    expect(globalThis.localStorage.getItem("preparados:tema")).toBe("oscuro");

    screen.getByRole("button", { name: "Sistema" }).click();
    expect(document.documentElement.dataset.tema).toBeUndefined();
    expect(globalThis.localStorage.getItem("preparados:tema")).toBe("sistema");
  });
});

describe("página del sistema visual", () => {
  it("muestra el nodo de logro en sus tres estados", () => {
    globalThis.location.hash = "#/tema";
    montar();
    expect(screen.getByRole("heading", { name: "Sistema visual" })).toBeTruthy();
    const clases = [...document.querySelectorAll(".nodo")].map((n) => n.className);
    expect(clases).toEqual(["nodo nodo--logrado", "nodo nodo--disponible", "nodo nodo--bloqueado"]);
  });

  it("no marca ninguna pestaña de la navegación", () => {
    globalThis.location.hash = "#/tema";
    montar();
    expect(screen.queryByRole("link", { current: "page" })).toBeNull();
  });
});
