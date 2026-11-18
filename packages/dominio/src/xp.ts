import type { Config } from "./config";
import type { Indice } from "./catalogo";
import type { DominioId, EstadoLogro, EstadoUsuario, Logro, LogroId, MetodoVerificacion } from "./tipos";

export function xpBase(logro: Logro, config: Config): number {
  if (logro.xpBase !== undefined) return logro.xpBase;
  const tabla = config.xpPorProfundidad;
  return tabla[Math.min(logro.profundidad, tabla.length) - 1] ?? 0;
}

/** XP de un logro de habilidad verificado con `metodo`. */
export function xpHabilidad(logro: Logro, metodo: MetodoVerificacion, config: Config): number {
  return xpBase(logro, config) * config.multiplicadores[metodo];
}

/** XP de un logro de equipo, antes del tope del dominio. */
export function xpEquipo(logro: Logro, config: Config): number {
  return xpBase(logro, config) * config.ratioEquipo;
}

/** Aplica el tope de equipo: cuánto XP de equipo cuenta, dado el XP de habilidad y de equipo. */
function equipoConTope(habilidad: number, equipo: number, config: Config): number {
  const { ratio, base } = config.topeEquipo;
  if (base === "catalogo") return Math.min(equipo, ratio * (habilidad + equipo));
  // base "usuario": el equipo contado no supera `ratio` del total contado.
  return ratio >= 1 ? equipo : Math.min(equipo, (habilidad * ratio) / (1 - ratio));
}

export interface XpDominio {
  habilidad: number;
  /** XP de equipo que cuenta, ya con tope. */
  equipo: number;
  total: number;
}

/**
 * Tope de equipo con base "catalogo": se calcula con el XP máximo del dominio en el catálogo.
 * Con base "usuario": con el XP que el usuario tiene en el dominio.
 */
export function xpPorDominio(
  idx: Indice,
  estado: EstadoUsuario,
  estados: Map<LogroId, EstadoLogro>,
  config: Config,
): Map<DominioId, XpDominio> {
  const habilidad = new Map<DominioId, number>();
  const equipo = new Map<DominioId, number>();
  const sumar = (m: Map<DominioId, number>, d: DominioId, v: number) => m.set(d, (m.get(d) ?? 0) + v);

  for (const ul of estado.logros) {
    const logro = idx.logros.get(ul.logro);
    if (!logro || logro.tipo !== "habilidad") continue;
    sumar(habilidad, logro.dominio, xpHabilidad(logro, ul.metodo, config));
  }
  for (const logro of idx.catalogo.logros) {
    if (logro.tipo === "equipo" && estados.get(logro.id) === "logrado") {
      sumar(equipo, logro.dominio, xpEquipo(logro, config));
    }
  }

  const maximos = xpMaximoPorDominio(idx, config);
  const resultado = new Map<DominioId, XpDominio>();
  for (const d of idx.catalogo.dominios) {
    const h = habilidad.get(d.id) ?? 0;
    const eq = equipo.get(d.id) ?? 0;
    const e =
      config.topeEquipo.base === "catalogo"
        ? Math.min(eq, config.topeEquipo.ratio * (maximos.get(d.id)?.sinTope ?? 0))
        : equipoConTope(h, eq, config);
    resultado.set(d.id, { habilidad: h, equipo: e, total: h + e });
  }
  return resultado;
}

export interface XpMaximo {
  /** XP máximo alcanzable, con el tope de equipo aplicado. */
  total: number;
  /** Habilidades al mejor método permitido + todo el equipo, sin tope. */
  sinTope: number;
}

/** XP máximo por dominio según el catálogo. Cada habilidad cuenta con el mejor método que permite. */
export function xpMaximoPorDominio(idx: Indice, config: Config): Map<DominioId, XpMaximo> {
  const resultado = new Map<DominioId, XpMaximo>();
  for (const d of idx.catalogo.dominios) {
    let h = 0;
    let e = 0;
    for (const l of idx.catalogo.logros) {
      if (l.dominio !== d.id) continue;
      if (l.tipo === "habilidad") {
        const mejor = Math.max(0, ...l.metodosPermitidos.map((m) => config.multiplicadores[m]));
        h += xpBase(l, config) * mejor;
      } else {
        e += xpEquipo(l, config);
      }
    }
    resultado.set(d.id, { total: h + equipoConTope(h, e, config), sinTope: h + e });
  }
  return resultado;
}

/** XP acumulado necesario para alcanzar el nivel n: factorCurva · n · (n − 1). Nivel 1 = 0 XP. */
export function xpParaNivel(n: number, config: Config): number {
  return config.factorCurva * n * (n - 1);
}

export function nivel(xp: number, config: Config): number {
  let n = 1;
  while (xpParaNivel(n + 1, config) <= xp) n++;
  return n;
}

export interface ProgresoNivel {
  nivel: number;
  xp: number;
  xpNivelActual: number;
  xpNivelSiguiente: number;
}

export function progresoNivel(xp: number, config: Config): ProgresoNivel {
  const n = nivel(xp, config);
  return { nivel: n, xp, xpNivelActual: xpParaNivel(n, config), xpNivelSiguiente: xpParaNivel(n + 1, config) };
}
