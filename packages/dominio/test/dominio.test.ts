import { describe, expect, it } from "vitest";
import ejemplo from "./fixtures/catalogo-ejemplo.json";
import {
  aprobarCuestionario,
  CONFIG_POR_DEFECTO as CFG,
  type Catalogo,
  type Config,
  declararLogro,
  type EstadoUsuario,
  estadosDeLogros,
  indexar,
  itemsPorVencer,
  nivel,
  pesosDominio,
  resumir,
  validarCatalogo,
  xpMaximoPorDominio,
  xpPorDominio,
} from "../src";

const catalogo = ejemplo as unknown as Catalogo;
const idx = indexar(catalogo);
const HOY = "2026-11-18";

const usuario = (parcial: Partial<EstadoUsuario> = {}): EstadoUsuario => ({
  perfil: { entorno: "ciudad", escenarios: ["corte-servicios", "pandemia"] },
  logros: [],
  inventario: [],
  ...parcial,
});

const ok = (r: ReturnType<typeof declararLogro>) => {
  if (!r.ok) throw new Error(r.error);
  return r.estado;
};

describe("catálogo", () => {
  it("el catálogo de ejemplo es válido", () => {
    expect(validarCatalogo(catalogo)).toEqual([]);
  });

  it("detecta ciclos, referencias rotas y equipo sin items", () => {
    const roto: Catalogo = structuredClone(catalogo);
    roto.logros.find((l) => l.id === "agua-potabilizar")!.prerrequisitos = ["agua-lluvia"];
    roto.logros.find((l) => l.id === "agua-reserva")!.itemsRequeridos = [];
    roto.logros.find((l) => l.id === "comida-conservar")!.prerrequisitos.push("no-existe");
    const errores = validarCatalogo(roto).join("\n");
    expect(errores).toMatch(/ciclo de prerrequisitos/);
    expect(errores).toMatch(/agua-reserva: un logro de equipo necesita itemsRequeridos/);
    expect(errores).toMatch(/prerrequisito inexistente no-existe/);
  });
});

describe("estados", () => {
  it("usuario nuevo: raíces disponibles, profundidad 2 bloqueada, habilidad sin su item bloqueada", () => {
    const e = estadosDeLogros(idx, usuario(), HOY, CFG);
    expect(e.get("agua-potabilizar")).toBe("disponible");
    expect(e.get("agua-reserva")).toBe("disponible");
    expect(e.get("agua-lluvia")).toBe("bloqueado");
    expect(e.get("agua-filtro")).toBe("bloqueado");
    expect(e.get("comida-cocinar-sin-red")).toBe("bloqueado");
  });

  it("el equipo se cumple con el inventario y respeta las cantidades", () => {
    const pocos = usuario({ inventario: [{ item: "bidon-agua", cantidad: 1 }] });
    expect(estadosDeLogros(idx, pocos, HOY, CFG).get("agua-reserva")).toBe("disponible");
    const suficientes = usuario({
      inventario: [
        { item: "bidon-agua", cantidad: 1 },
        { item: "bidon-agua", cantidad: 1 },
      ],
    });
    expect(estadosDeLogros(idx, suficientes, HOY, CFG).get("agua-reserva")).toBe("logrado");
  });

  it("un item vencido cuenta salvo que se active excluirItemsVencidos", () => {
    const u = usuario({ inventario: [{ item: "botiquin", cantidad: 1, vencimiento: "2026-01-01" }] });
    expect(estadosDeLogros(idx, u, HOY, CFG).get("salud-botiquin")).toBe("logrado");
    const estricta: Config = { ...CFG, excluirItemsVencidos: true };
    expect(estadosDeLogros(idx, u, HOY, estricta).get("salud-botiquin")).toBe("disponible");
  });

  it("el equipo con prerrequisitos pendientes queda bloqueado aunque se tenga el item", () => {
    const u = usuario({ inventario: [{ item: "filtro-agua", cantidad: 1 }] });
    expect(estadosDeLogros(idx, u, HOY, CFG).get("agua-filtro")).toBe("bloqueado");
  });
});

describe("declaración y verificación", () => {
  it("autodeclaración suma 50% y desbloquea los hijos", () => {
    const u = ok(declararLogro(idx, usuario(), "agua-potabilizar", "autodeclaracion", HOY, HOY, CFG));
    const e = estadosDeLogros(idx, u, HOY, CFG);
    expect(e.get("agua-potabilizar")).toBe("logrado");
    expect(e.get("agua-lluvia")).toBe("disponible");
    expect(xpPorDominio(idx, u, e, CFG).get("agua")?.habilidad).toBe(5);
  });

  it("no deja declarar un logro bloqueado, un logro de equipo ni un método no permitido", () => {
    expect(declararLogro(idx, usuario(), "agua-lluvia", "autodeclaracion", HOY, HOY, CFG)).toEqual({ ok: false, error: "bloqueado" });
    expect(declararLogro(idx, usuario(), "agua-reserva", "autodeclaracion", HOY, HOY, CFG)).toEqual({ ok: false, error: "logro_de_equipo" });
    expect(declararLogro(idx, usuario(), "salud-conocimiento-1", "autodeclaracion", HOY, HOY, CFG)).toEqual({ ok: false, error: "metodo_no_permitido" });
  });

  it("el cuestionario aprobado suma 100% y mejora una autodeclaración previa", () => {
    const auto = ok(declararLogro(idx, usuario(), "agua-potabilizar", "autodeclaracion", HOY, HOY, CFG));
    const r = aprobarCuestionario(idx, auto, "agua-potabilizar", [0, 1, 2], HOY, HOY, CFG);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.estado.logros).toHaveLength(1);
    expect(r.estado.logros[0]?.metodo).toBe("cuestionario");
    const e = estadosDeLogros(idx, r.estado, HOY, CFG);
    expect(xpPorDominio(idx, r.estado, e, CFG).get("agua")?.habilidad).toBe(10);
  });

  it("rechaza un cuestionario no aprobado y una 'mejora' que no mejora", () => {
    const fallo = aprobarCuestionario(idx, usuario(), "agua-potabilizar", [0, 0, 0], HOY, HOY, CFG);
    expect(fallo.ok).toBe(false);
    expect(fallo.correccion).toEqual({ correctas: 1, total: 3, aprobado: false });

    const r = aprobarCuestionario(idx, usuario(), "agua-potabilizar", [0, 1, 2], HOY, HOY, CFG);
    if (!r.ok) throw new Error(r.error);
    expect(declararLogro(idx, r.estado, "agua-potabilizar", "autodeclaracion", HOY, HOY, CFG)).toEqual({ ok: false, error: "sin_mejora" });
  });

  it("no modifica el estado recibido", () => {
    const original = usuario();
    const copia = structuredClone(original);
    declararLogro(idx, original, "agua-potabilizar", "autodeclaracion", HOY, HOY, CFG);
    expect(original).toEqual(copia);
  });
});

describe("XP, tope de equipo y niveles", () => {
  it("curva de niveles: 0, 50, 150, 300, 500", () => {
    expect([0, 49, 50, 149, 150, 299, 300, 500].map((x) => nivel(x, CFG))).toEqual([1, 1, 2, 2, 3, 3, 4, 5]);
  });

  it("XP máximo de Agua con tope de equipo sobre el catálogo", () => {
    // Habilidades: 10 (cuestionario) + 25 × 0,5 (solo autodeclaración) = 22,5
    // Equipo: 10 × 0,25 + 25 × 0,25 = 8,75 → tope 0,25 × 31,25 = 7,8125
    const max = xpMaximoPorDominio(idx, CFG).get("agua");
    expect(max?.sinTope).toBeCloseTo(31.25);
    expect(max?.total).toBeCloseTo(30.3125);
  });

  it("tope con base 'usuario': sin habilidades, el equipo no suma", () => {
    const cfg: Config = { ...CFG, topeEquipo: { ratio: 0.25, base: "usuario" } };
    const u = usuario({ inventario: [{ item: "bidon-agua", cantidad: 2 }] });
    const e = estadosDeLogros(idx, u, HOY, cfg);
    expect(e.get("agua-reserva")).toBe("logrado");
    expect(xpPorDominio(idx, u, e, cfg).get("agua")?.equipo).toBe(0);
  });
});

describe("pesos, preparación y recomendaciones", () => {
  it("peso = entorno × máximo de los escenarios elegidos", () => {
    const p = pesosDominio(idx, usuario().perfil);
    expect(p.get("agua")).toBeCloseTo(1);
    expect(p.get("comida")).toBeCloseTo(0.56);
    expect(p.get("salud")).toBeCloseTo(0.8);
  });

  it("sin escenarios se usa solo el peso del entorno", () => {
    const p = pesosDominio(idx, { entorno: "campo", escenarios: [] });
    expect(p.get("salud")).toBeCloseTo(1);
  });

  it("% de preparación: 0 al empezar; Agua completa pesa distinto según el escenario", () => {
    expect([...resumir(idx, usuario(), HOY).preparacion.values()]).toEqual([0, 0]);

    let u = usuario({
      inventario: [
        { item: "bidon-agua", cantidad: 2 },
        { item: "filtro-agua", cantidad: 1 },
      ],
    });
    const r = aprobarCuestionario(idx, u, "agua-potabilizar", [0, 1, 2], HOY, HOY, CFG);
    if (!r.ok) throw new Error(r.error);
    u = ok(declararLogro(idx, r.estado, "agua-lluvia", "autodeclaracion", HOY, HOY, CFG));

    const prep = resumir(idx, u, HOY).preparacion;
    // Corte de servicios: 1 / (1 + 0,48 + 0,32); pandemia: 0,3 / (0,3 + 0,56 + 0,8)
    expect(prep.get("corte-servicios")).toBeCloseTo(1 / 1.8);
    expect(prep.get("pandemia")).toBeCloseTo(0.3 / 1.66);
  });

  it("recomendaciones por peso de dominio; la ruta inicial solo trae profundidad 1", () => {
    const res = resumir(idx, usuario(), HOY);
    expect(res.recomendaciones.map((r) => r.logro.id)).toEqual([
      "agua-reserva",
      "agua-potabilizar",
      "salud-botiquin",
      "salud-conocimiento-1",
      "comida-despensa",
    ]);
    expect(res.rutaInicial.every((r) => r.logro.profundidad === 1)).toBe(true);
  });
});

describe("alertas de vencimiento", () => {
  it("lista lo vencido y lo que vence dentro del plazo, del más urgente al menos", () => {
    const alertas = itemsPorVencer(
      idx,
      [
        { item: "conserva", cantidad: 14, vencimiento: "2026-12-01" },
        { item: "botiquin", cantidad: 1, vencimiento: "2026-11-10" },
        { item: "bidon-agua", cantidad: 2, vencimiento: "2027-06-01" },
        { item: "anafe", cantidad: 1 },
      ],
      HOY,
      30,
    );
    expect(alertas.map((a) => [a.item, a.diasRestantes])).toEqual([
      ["botiquin", -8],
      ["conserva", 13],
    ]);
  });
});
