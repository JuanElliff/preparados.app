import type { Dominio, Logro } from "@preparados/dominio";
import { describe, expect, it } from "vitest";
import { calcularCamino } from "../src/camino/layout";

const DOMINIOS: Dominio[] = [
  { id: "agua", nombre: "Agua", orden: 1 },
  { id: "comida", nombre: "Comida", orden: 2 },
];

const logro = (id: string, dominio: string, profundidad: number, prerrequisitos: string[] = []): Logro => ({
  id,
  dominio,
  tipo: "habilidad",
  titulo: id,
  descripcion: "",
  profundidad,
  prerrequisitos,
  itemsRequeridos: [],
  metodosPermitidos: ["autodeclaracion"],
});

const equipo = (id: string, dominio: string, profundidad: number): Logro => ({
  ...logro(id, dominio, profundidad),
  tipo: "equipo",
  metodosPermitidos: [],
  itemsRequeridos: [{ item: "algo", cantidad: 1 }],
});

const columnaDe = (camino: ReturnType<typeof calcularCamino>, id: string) =>
  camino.nodos.find((n) => n.logro.id === id)?.columna;
const capaDe = (camino: ReturnType<typeof calcularCamino>, id: string) =>
  camino.nodos.find((n) => n.logro.id === id)?.capa;

describe("layout del camino", () => {
  it("deja afuera los logros de equipo: esos van en Inventario", () => {
    const camino = calcularCamino([logro("a1", "agua", 1), equipo("bidones", "agua", 1)], DOMINIOS);
    expect(camino.nodos.map((n) => n.logro.id)).toEqual(["a1"]);
    expect(camino.aristas).toEqual([]);
  });

  it("un prerrequisito de equipo no dibuja rama, pero el logro sigue en el árbol", () => {
    const camino = calcularCamino(
      [equipo("anafe", "comida", 1), logro("cocinar", "comida", 1, ["anafe"])],
      DOMINIOS,
    );
    expect(camino.nodos.map((n) => n.logro.id)).toEqual(["cocinar"]);
    expect(camino.aristas).toEqual([]);
  });

  it("la capa nunca queda por debajo de la de sus prerrequisitos", () => {
    // El catálogo dice profundidad 1, pero depende de uno de profundidad 2.
    const camino = calcularCamino(
      [logro("a1", "agua", 1), logro("a2", "agua", 2, ["a1"]), logro("a3", "agua", 1, ["a2"])],
      DOMINIOS,
    );
    expect(capaDe(camino, "a1")).toBe(1);
    expect(capaDe(camino, "a2")).toBe(2);
    expect(capaDe(camino, "a3")).toBe(3);
    expect(camino.capas).toBe(3);
  });

  it("cada dominio ocupa su propia franja de columnas, en el orden del catálogo", () => {
    const camino = calcularCamino(
      [logro("a1", "agua", 1), logro("a2", "agua", 1), logro("c1", "comida", 1)],
      DOMINIOS,
    );
    expect(camino.ramas).toEqual([
      { dominio: "agua", desde: 0, hasta: 1 },
      { dominio: "comida", desde: 3, hasta: 3 },
    ]);
    expect(columnaDe(camino, "c1")).toBe(3);
    expect(camino.columnas).toBe(4);
  });

  it("una bifurcación separa a los hijos y un hijo con dos padres queda entre ellos", () => {
    const camino = calcularCamino(
      [
        logro("raiz", "agua", 1),
        logro("izq", "agua", 2, ["raiz"]),
        logro("der", "agua", 2, ["raiz"]),
        logro("junta", "agua", 3, ["izq", "der"]),
      ],
      DOMINIOS,
    );
    const izq = columnaDe(camino, "izq");
    const der = columnaDe(camino, "der");
    const junta = columnaDe(camino, "junta");
    expect(izq).not.toBe(der);
    expect(Math.min(izq ?? 0, der ?? 0)).toBeLessThanOrEqual(junta ?? 0);
    expect(Math.max(izq ?? 0, der ?? 0)).toBeGreaterThanOrEqual(junta ?? 0);
    expect(camino.aristas).toHaveLength(4);
  });

  it("ubica 100 logros sin pisar celdas y siempre igual", () => {
    const muchos = Array.from({ length: 100 }, (_, i) =>
      logro(`l${i}`, i % 2 === 0 ? "agua" : "comida", 1 + (i % 4), i > 1 ? [`l${i - 2}`] : []),
    );
    const camino = calcularCamino(muchos, DOMINIOS);
    expect(camino.nodos).toHaveLength(100);
    const celdas = new Set(camino.nodos.map((n) => `${n.capa}:${n.columna}`));
    expect(celdas.size).toBe(100);
    expect(calcularCamino(muchos, DOMINIOS)).toEqual(camino);
  });

  it("sin habilidades, el árbol queda vacío", () => {
    expect(calcularCamino([equipo("bidones", "agua", 1)], DOMINIOS)).toEqual({
      nodos: [],
      aristas: [],
      ramas: [],
      columnas: 0,
      capas: 0,
    });
  });
});
