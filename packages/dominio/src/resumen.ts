import { CONFIG_POR_DEFECTO, type Config } from "./config";
import type { Indice } from "./catalogo";
import { estadosDeLogros } from "./estados";
import { type AlertaVencimiento, itemsPorVencer } from "./inventario";
import { pesosDominio, preparacionPorEscenario, type Recomendacion, recomendaciones, rutaInicial } from "./pesos";
import type { DominioId, EscenarioId, EstadoLogro, EstadoUsuario, FechaISO, LogroId } from "./tipos";
import { type ProgresoNivel, type XpDominio, progresoNivel, xpPorDominio } from "./xp";

export interface Resumen {
  estados: Map<LogroId, EstadoLogro>;
  xp: Map<DominioId, XpDominio>;
  niveles: Map<DominioId, ProgresoNivel>;
  pesos: Map<DominioId, number>;
  preparacion: Map<EscenarioId, number>;
  recomendaciones: Recomendacion[];
  rutaInicial: Recomendacion[];
  alertas: AlertaVencimiento[];
}

/** Todo lo que la pantalla de Inicio necesita, en un solo cálculo. */
export function resumir(
  idx: Indice,
  estado: EstadoUsuario,
  hoy: FechaISO,
  opciones: { config?: Config; diasAlerta?: number } = {},
): Resumen {
  const config = opciones.config ?? CONFIG_POR_DEFECTO;
  const estados = estadosDeLogros(idx, estado, hoy, config);
  const xp = xpPorDominio(idx, estado, estados, config);
  const niveles = new Map([...xp].map(([d, v]) => [d, progresoNivel(v.total, config)] as const));
  return {
    estados,
    xp,
    niveles,
    pesos: pesosDominio(idx, estado.perfil),
    preparacion: preparacionPorEscenario(idx, estado.perfil, xp, config),
    recomendaciones: recomendaciones(idx, estado, estados),
    rutaInicial: rutaInicial(idx, estado, estados),
    alertas: itemsPorVencer(idx, estado.inventario, hoy, opciones.diasAlerta ?? 30),
  };
}
