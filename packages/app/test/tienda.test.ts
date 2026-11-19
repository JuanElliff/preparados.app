import { AlmacenMemoria, nuevoGuardado } from "@preparados/datos";
import type { Catalogo, EstadoUsuario } from "@preparados/dominio";
import { describe, expect, it } from "vitest";
import ejemplo from "../../dominio/test/fixtures/catalogo-ejemplo.json";
import { crearTienda } from "../src/estado/tienda";

const catalogo = ejemplo as unknown as Catalogo;
const HOY = "2026-11-18";

const estado: EstadoUsuario = {
  perfil: { entorno: "ciudad", escenarios: ["corte-servicios"] },
  logros: [{ logro: "agua-potabilizar", metodo: "cuestionario", fecha: HOY }],
  inventario: [],
};

const tienda = (almacen = new AlmacenMemoria()) =>
  crearTienda({ almacen, cargarCatalogo: async () => catalogo, hoy: () => HOY });

describe("tienda", () => {
  it("sin nada guardado queda lista y sin resumen: falta el onboarding", async () => {
    const t = tienda();
    await t.iniciar();
    const e = t.obtener();
    if (e.fase !== "listo") throw new Error(e.fase);
    expect(e.guardado).toBeNull();
    expect(e.resumen).toBeNull();
  });

  it("guardar persiste el estado, recalcula el resumen y avisa a los suscriptores", async () => {
    const almacen = new AlmacenMemoria();
    const t = tienda(almacen);
    await t.iniciar();
    let avisos = 0;
    t.suscribir(() => avisos++);
    await t.guardar(estado);
    const e = t.obtener();
    if (e.fase !== "listo") throw new Error(e.fase);
    expect(avisos).toBe(1);
    expect(e.resumen?.estados.get("agua-potabilizar")).toBe("logrado");
    expect((await almacen.cargar())?.estado).toEqual(estado);
  });

  it("ajusta el guardado al catálogo vigente cuando cambió de versión", async () => {
    const almacen = new AlmacenMemoria();
    await almacen.guardar(
      nuevoGuardado({ ...estado, logros: [...estado.logros, { logro: "borrado", metodo: "cuestionario", fecha: HOY }] }, "vieja"),
    );
    const t = tienda(almacen);
    await t.iniciar();
    const e = t.obtener();
    if (e.fase !== "listo") throw new Error(e.fase);
    expect(e.avisos).toEqual(["logro descartado: borrado (ya no existe)"]);
    expect(e.guardado?.catalogoVersion).toBe(catalogo.version);
    expect((await almacen.cargar())?.estado.logros).toHaveLength(1);
  });

  it("si el catálogo no se puede leer, queda en error", async () => {
    const t = crearTienda({
      almacen: new AlmacenMemoria(),
      cargarCatalogo: async () => {
        throw new Error("sin conexión");
      },
    });
    await t.iniciar();
    expect(t.obtener()).toEqual({ fase: "error", mensaje: "sin conexión" });
  });
});
