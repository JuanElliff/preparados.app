import { IDBFactory } from "fake-indexeddb";
import { type Catalogo, type EstadoUsuario, indexar } from "@preparados/dominio";
import { describe, expect, it } from "vitest";
import ejemplo from "../../dominio/test/fixtures/catalogo-ejemplo.json";
import {
  AlmacenIndexedDB,
  AlmacenMemoria,
  exportarRespaldo,
  importarRespaldo,
  nuevoGuardado,
  reconciliar,
  VERSION_ESQUEMA,
} from "../src";

const catalogo = ejemplo as unknown as Catalogo;
const idx = indexar(catalogo);
const AHORA = new Date("2026-11-18T23:00:00Z");

const estado: EstadoUsuario = {
  perfil: { entorno: "ciudad", vivienda: "departamento", escenarios: ["corte-servicios"] },
  logros: [{ logro: "agua-potabilizar", metodo: "cuestionario", fecha: "2026-11-18" }],
  inventario: [{ item: "bidon-agua", cantidad: 2, vencimiento: "2027-05-01" }],
};

describe("respaldo", () => {
  it("exportar e importar devuelve el mismo estado", () => {
    const g = nuevoGuardado(estado, catalogo.version, AHORA);
    const r = importarRespaldo(exportarRespaldo(g), idx);
    expect(r).toEqual({ ok: true, guardado: g, avisos: [] });
  });

  it("rechaza lo que no es un respaldo de Preparados", () => {
    expect(importarRespaldo("no es json", idx)).toEqual({ ok: false, error: "json_invalido" });
    expect(importarRespaldo(JSON.stringify({ hola: 1 }), idx)).toEqual({ ok: false, error: "no_es_respaldo" });
  });

  it("rechaza un respaldo de una versión más nueva de la app", () => {
    const texto = exportarRespaldo({ ...nuevoGuardado(estado, "x", AHORA), esquema: VERSION_ESQUEMA + 1 });
    expect(importarRespaldo(texto, idx)).toEqual({ ok: false, error: "version_mas_nueva" });
  });

  it("rechaza un estado mal formado e indica dónde", () => {
    const malo = { ...estado, inventario: [{ item: "bidon-agua", cantidad: -1 }] };
    const r = importarRespaldo(exportarRespaldo(nuevoGuardado(malo, "x", AHORA)), idx);
    expect(r).toEqual({ ok: false, error: "formato_invalido", detalle: "inventario[0].cantidad inválida" });
  });

  it("ajusta el respaldo al catálogo vigente y avisa qué descartó", () => {
    const viejo: EstadoUsuario = {
      perfil: { entorno: "ciudad", escenarios: ["corte-servicios", "invasion-zombie"] },
      logros: [
        { logro: "agua-potabilizar", metodo: "autodeclaracion", fecha: "2026-11-01" },
        { logro: "agua-potabilizar", metodo: "cuestionario", fecha: "2026-11-02" },
        { logro: "agua-reserva", metodo: "autodeclaracion", fecha: "2026-11-01" },
        { logro: "salud-conocimiento-1", metodo: "autodeclaracion", fecha: "2026-11-01" },
        { logro: "borrado", metodo: "autodeclaracion", fecha: "2026-11-01" },
      ],
      inventario: [{ item: "item-viejo", cantidad: 1 }],
    };
    const r = importarRespaldo(exportarRespaldo(nuevoGuardado(viejo, "x", AHORA)), idx);
    if (!r.ok) throw new Error(r.error);
    expect(r.guardado.estado.perfil.escenarios).toEqual(["corte-servicios"]);
    expect(r.guardado.estado.logros).toEqual([{ logro: "agua-potabilizar", metodo: "cuestionario", fecha: "2026-11-02" }]);
    expect(r.guardado.estado.inventario).toEqual([]);
    expect(r.avisos).toHaveLength(6);
  });

  it("ante duplicados queda el de mejor verificación; a igual verificación, el más antiguo", () => {
    const conDuplicados: EstadoUsuario = {
      perfil: { entorno: "ciudad", escenarios: [] },
      logros: [
        { logro: "agua-potabilizar", metodo: "autodeclaracion", fecha: "2026-11-05" },
        { logro: "agua-potabilizar", metodo: "cuestionario", fecha: "2026-11-10" },
        { logro: "salud-conocimiento-1", metodo: "cuestionario", fecha: "2026-11-09" },
        { logro: "salud-conocimiento-1", metodo: "cuestionario", fecha: "2026-11-03" },
      ],
      inventario: [],
    };
    const r = reconciliar(conDuplicados, idx);
    if ("error" in r) throw new Error(r.error);
    expect(r.estado.logros).toEqual([
      { logro: "agua-potabilizar", metodo: "cuestionario", fecha: "2026-11-10" },
      { logro: "salud-conocimiento-1", metodo: "cuestionario", fecha: "2026-11-03" },
    ]);
    expect(r.avisos).toEqual([
      "logro descartado: agua-potabilizar (registro duplicado autodeclaracion del 2026-11-05; queda cuestionario del 2026-11-10)",
      "logro descartado: salud-conocimiento-1 (registro duplicado cuestionario del 2026-11-09; queda cuestionario del 2026-11-03)",
    ]);
  });

  it("falla si el entorno ya no existe", () => {
    const sinEntorno = { ...estado, perfil: { entorno: "luna", escenarios: [] } };
    expect(reconciliar(sinEntorno, idx)).toEqual({ error: "entorno_inexistente" });
  });
});

describe("almacenes", () => {
  const casos = [
    ["memoria", () => new AlmacenMemoria()],
    ["IndexedDB", () => new AlmacenIndexedDB("test", new IDBFactory())],
  ] as const;

  for (const [nombre, crear] of casos) {
    it(`${nombre}: vacío, guardar, cargar, reemplazar y borrar`, async () => {
      const a = crear();
      expect(await a.cargar()).toBeNull();
      const g1 = nuevoGuardado(estado, "v1", AHORA);
      await a.guardar(g1);
      expect(await a.cargar()).toEqual(g1);
      const g2 = nuevoGuardado({ ...estado, logros: [] }, "v2", AHORA);
      await a.guardar(g2);
      expect(await a.cargar()).toEqual(g2);
      await a.borrar();
      expect(await a.cargar()).toBeNull();
    });
  }

  it("IndexedDB: los datos sobreviven a cerrar y reabrir la base", async () => {
    const fabrica = new IDBFactory();
    const a = new AlmacenIndexedDB("persistencia", fabrica);
    const g = nuevoGuardado(estado, "v1", AHORA);
    await a.guardar(g);
    a.cerrar();
    expect(await new AlmacenIndexedDB("persistencia", fabrica).cargar()).toEqual(g);
  });
});
