import type { Config } from "./config";
import type { Indice } from "./catalogo";
import type { DominioId, EscenarioId, EstadoLogro, EstadoUsuario, Logro, LogroId, Perfil } from "./tipos";
import { type XpDominio, xpMaximoPorDominio } from "./xp";

function pesosEntorno(idx: Indice, perfil: Perfil): Record<DominioId, number> {
  const entorno = idx.catalogo.entornos.find((e) => e.id === perfil.entorno);
  if (!entorno) throw new Error(`Entorno inexistente: ${perfil.entorno}`);
  return entorno.pesos;
}

function escenariosElegidos(idx: Indice, perfil: Perfil) {
  return perfil.escenarios.map((id) => {
    const e = idx.catalogo.escenarios.find((x) => x.id === id);
    if (!e) throw new Error(`Escenario inexistente: ${id}`);
    return e;
  });
}

/**
 * Peso de cada dominio: w_d = entorno_d × max(escenario_e,d) sobre los escenarios elegidos.
 * Sin escenarios elegidos se usa solo el peso del entorno (provisorio).
 */
export function pesosDominio(idx: Indice, perfil: Perfil): Map<DominioId, number> {
  const entorno = pesosEntorno(idx, perfil);
  const escenarios = escenariosElegidos(idx, perfil);
  const resultado = new Map<DominioId, number>();
  for (const d of idx.catalogo.dominios) {
    const we = entorno[d.id] ?? 0;
    const ws = escenarios.length === 0 ? 1 : Math.max(...escenarios.map((e) => e.pesos[d.id] ?? 0));
    resultado.set(d.id, we * ws);
  }
  return resultado;
}

/**
 * % de preparación de cada escenario elegido, 0..1 (propuesta v0.1):
 * P_e = Σ_d entorno_d · escenario_e,d · (XP_d / XP_d^max) / Σ_d entorno_d · escenario_e,d
 */
export function preparacionPorEscenario(
  idx: Indice,
  perfil: Perfil,
  xp: Map<DominioId, XpDominio>,
  config: Config,
): Map<EscenarioId, number> {
  const entorno = pesosEntorno(idx, perfil);
  const maximos = xpMaximoPorDominio(idx, config);
  const resultado = new Map<EscenarioId, number>();
  for (const esc of escenariosElegidos(idx, perfil)) {
    let numerador = 0;
    let denominador = 0;
    for (const d of idx.catalogo.dominios) {
      const w = (entorno[d.id] ?? 0) * (esc.pesos[d.id] ?? 0);
      const max = maximos.get(d.id)?.total ?? 0;
      if (w === 0 || max === 0) continue;
      numerador += w * Math.min(1, (xp.get(d.id)?.total ?? 0) / max);
      denominador += w;
    }
    resultado.set(esc.id, denominador === 0 ? 0 : numerador / denominador);
  }
  return resultado;
}

export interface Recomendacion {
  logro: Logro;
  peso: number;
}

/**
 * Logros disponibles, ordenados por el peso de su dominio (mayor primero).
 * Desempate provisorio: orden del catálogo. Dominios con peso 0 quedan afuera.
 */
export function recomendaciones(
  idx: Indice,
  estado: EstadoUsuario,
  estados: Map<LogroId, EstadoLogro>,
): Recomendacion[] {
  const pesos = pesosDominio(idx, estado.perfil);
  return idx.catalogo.logros
    .filter((l) => estados.get(l.id) === "disponible")
    .map((logro) => ({ logro, peso: pesos.get(logro.dominio) ?? 0 }))
    .filter((r) => r.peso > 0)
    .sort((a, b) => b.peso - a.peso || (idx.orden.get(a.logro.id) ?? 0) - (idx.orden.get(b.logro.id) ?? 0));
}

/** Ruta inicial: los logros de profundidad 1 disponibles, ordenados por el peso de su dominio. */
export function rutaInicial(
  idx: Indice,
  estado: EstadoUsuario,
  estados: Map<LogroId, EstadoLogro>,
): Recomendacion[] {
  return recomendaciones(idx, estado, estados).filter((r) => r.logro.profundidad === 1);
}
