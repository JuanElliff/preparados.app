import { exportarRespaldo, nuevoGuardado } from "@preparados/datos";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { catalogo, montar, PERFIL } from "./ayuda";

afterEach(() => {
  globalThis.location.hash = "";
  globalThis.localStorage.clear();
  delete document.documentElement.dataset.tema;
  vi.restoreAllMocks();
});

const clic = (nombre: string | RegExp) => fireEvent.click(screen.getByRole("button", { name: nombre }));

const abrir = async (...args: Parameters<typeof montar>) => {
  globalThis.location.hash = "#/perfil";
  const vista = await montar(...args);
  await screen.findByRole("heading", { name: "Perfil" });
  return vista;
};

/** Un archivo de respaldo, como el que elegiría el usuario. */
const respaldo = (logros: number) =>
  new File(
    [
      exportarRespaldo(
        nuevoGuardado(
          {
            perfil: { entorno: "campo", escenarios: ["pandemia"] },
            logros: Array.from({ length: logros }, () => ({
              logro: "agua-potabilizar",
              metodo: "cuestionario" as const,
              fecha: "2026-11-01",
            })),
            inventario: [],
          },
          catalogo.version,
          new Date("2026-11-17T12:00:00Z"),
        ),
      ),
    ],
    "preparados.json",
    { type: "application/json" },
  );

describe("perfil", () => {
  it("cambia el entorno y lo guarda", async () => {
    const { almacen } = await abrir();
    fireEvent.change(screen.getByLabelText("Entorno"), { target: { value: "campo" } });
    await waitFor(async () => {
      expect((await almacen.cargar())?.estado.perfil.entorno).toBe("campo");
    });
    expect(screen.getByText("Guardado.")).toBeTruthy();
  });

  it("agrega y saca escenarios", async () => {
    const { almacen } = await abrir();
    fireEvent.click(screen.getByRole("checkbox", { name: "Pandemia" }));
    await waitFor(async () => {
      expect((await almacen.cargar())?.estado.perfil.escenarios).toEqual(["corte-servicios", "pandemia"]);
    });

    fireEvent.click(screen.getByRole("checkbox", { name: "Corte de servicios" }));
    await waitFor(async () => {
      expect((await almacen.cargar())?.estado.perfil.escenarios).toEqual(["pandemia"]);
    });
  });

  it("exporta un archivo con el respaldo", async () => {
    const urls: string[] = [];
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: (b: Blob) => {
        urls.push(b.type);
        return "blob:respaldo";
      },
      revokeObjectURL: () => {},
    });
    const clics: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      clics.push(this.download);
    });

    await abrir();
    clic("Exportar");

    expect(urls).toEqual(["application/json"]);
    expect(clics).toEqual(["preparados-2026-11-18.json"]);
    vi.unstubAllGlobals();
  });

  it("al importar pide confirmación antes de reemplazar", async () => {
    const { almacen } = await abrir();
    fireEvent.change(screen.getByLabelText("Archivo de respaldo"), { target: { files: [respaldo(1)] } });

    expect(await screen.findByRole("heading", { name: "¿Reemplazamos lo que tenés?" })).toBeTruthy();
    expect(screen.getByText(/trae 1 logros y 0 items/)).toBeTruthy();
    // Mientras no se confirme, no se toca nada.
    expect((await almacen.cargar())?.estado.perfil.entorno).toBe("ciudad");

    clic("Reemplazar");
    await waitFor(async () => {
      expect((await almacen.cargar())?.estado.perfil.entorno).toBe("campo");
    });
  });

  it("cancelar la importación deja todo como estaba", async () => {
    const { almacen } = await abrir();
    fireEvent.change(screen.getByLabelText("Archivo de respaldo"), { target: { files: [respaldo(1)] } });
    await screen.findByRole("heading", { name: "¿Reemplazamos lo que tenés?" });

    clic("Cancelar");
    expect(screen.queryByRole("heading", { name: "¿Reemplazamos lo que tenés?" })).toBeNull();
    expect((await almacen.cargar())?.estado.perfil.entorno).toBe("ciudad");
  });

  it("muestra los avisos de lo que el respaldo pierde", async () => {
    const { almacen } = await abrir();
    const texto = exportarRespaldo(
      nuevoGuardado(
        {
          perfil: { entorno: "ciudad", escenarios: ["corte-servicios", "invasion-zombie"] },
          logros: [],
          inventario: [],
        },
        "vieja",
      ),
    );
    fireEvent.change(screen.getByLabelText("Archivo de respaldo"), {
      target: { files: [new File([texto], "r.json", { type: "application/json" })] },
    });

    expect(await screen.findByText("escenario descartado: invasion-zombie (ya no existe)")).toBeTruthy();
    clic("Reemplazar");
    await waitFor(async () => {
      expect((await almacen.cargar())?.estado.perfil.escenarios).toEqual(["corte-servicios"]);
    });
  });

  it("rechaza un archivo que no es un respaldo", async () => {
    await abrir();
    fireEvent.change(screen.getByLabelText("Archivo de respaldo"), {
      target: { files: [new File(["{}"], "cualquiera.json", { type: "application/json" })] },
    });
    expect(await screen.findByText("Ese archivo no es un respaldo de Preparados.")).toBeTruthy();
  });

  it("borrar todo pide confirmar y vuelve a la bienvenida", async () => {
    const { almacen } = await abrir({
      ...PERFIL,
      logros: [{ logro: "agua-potabilizar", metodo: "cuestionario", fecha: "2026-11-18" }],
    });

    clic("Borrar mis datos");
    expect(screen.getByRole("button", { name: "No" })).toBeTruthy();
    clic("Sí, borrar todo");

    await waitFor(async () => expect(await almacen.cargar()).toBeNull());
    expect(await screen.findByRole("heading", { name: "¿Dónde vivís?" })).toBeTruthy();
  });
});

describe("almacenamiento persistente", () => {
  it("se pide al guardar el primer logro", async () => {
    const persist = vi.fn(async () => true);
    vi.stubGlobal("navigator", { ...globalThis.navigator, storage: { persist } });

    globalThis.location.hash = "#/logro/agua-potabilizar";
    await montar();
    fireEvent.click(await screen.findByRole("button", { name: "Lo sé hacer" }));

    await waitFor(() => expect(persist).toHaveBeenCalledTimes(1));
    vi.unstubAllGlobals();
  });
});
