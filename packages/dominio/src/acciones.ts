import type { Config } from "./config";
import type { Indice } from "./catalogo";
import { estadosDeLogros } from "./estados";
import type { Cuestionario, EstadoUsuario, FechaISO, LogroId, MetodoVerificacion } from "./tipos";

export type ErrorDeclaracion =
  | "logro_inexistente"
  | "logro_de_equipo"
  | "metodo_no_permitido"
  | "usar_cuestionario"
  | "bloqueado"
  | "sin_mejora"
  | "cuestionario_no_aprobado";

export type Resultado =
  | { ok: true; estado: EstadoUsuario }
  | { ok: false; error: ErrorDeclaracion };

export interface Correccion {
  correctas: number;
  total: number;
  aprobado: boolean;
}

export function corregirCuestionario(c: Cuestionario, respuestas: number[]): Correccion {
  const total = c.preguntas.length;
  const correctas = c.preguntas.filter((p, i) => respuestas[i] === p.correcta).length;
  return { correctas, total, aprobado: total > 0 && correctas / total >= c.umbralAprobacion };
}

function registrar(
  idx: Indice,
  estado: EstadoUsuario,
  logroId: LogroId,
  metodo: MetodoVerificacion,
  fecha: FechaISO,
  hoy: FechaISO,
  config: Config,
): Resultado {
  const logro = idx.logros.get(logroId);
  if (!logro) return { ok: false, error: "logro_inexistente" };
  if (logro.tipo === "equipo") return { ok: false, error: "logro_de_equipo" };
  if (!logro.metodosPermitidos.includes(metodo)) return { ok: false, error: "metodo_no_permitido" };

  const previo = estado.logros.find((l) => l.logro === logroId);
  if (previo) {
    // Mejorar la verificación reemplaza el registro: el XP pasa al del método nuevo.
    if (config.multiplicadores[metodo] <= config.multiplicadores[previo.metodo]) {
      return { ok: false, error: "sin_mejora" };
    }
  } else if (estadosDeLogros(idx, estado, hoy, config).get(logroId) !== "disponible") {
    return { ok: false, error: "bloqueado" };
  }

  return {
    ok: true,
    estado: {
      ...estado,
      logros: [...estado.logros.filter((l) => l.logro !== logroId), { logro: logroId, metodo, fecha }],
    },
  };
}

/**
 * Declara un logro de habilidad. El cuestionario no se declara: pasa por aprobarCuestionario.
 * Devuelve un estado nuevo; no modifica el recibido.
 */
export function declararLogro(
  idx: Indice,
  estado: EstadoUsuario,
  logroId: LogroId,
  metodo: Exclude<MetodoVerificacion, "cuestionario">,
  fecha: FechaISO,
  hoy: FechaISO,
  config: Config,
): Resultado {
  if ((metodo as MetodoVerificacion) === "cuestionario") return { ok: false, error: "usar_cuestionario" };
  return registrar(idx, estado, logroId, metodo, fecha, hoy, config);
}

/** Corrige el cuestionario del logro y, si aprueba, registra el logro con método "cuestionario". */
export function aprobarCuestionario(
  idx: Indice,
  estado: EstadoUsuario,
  logroId: LogroId,
  respuestas: number[],
  fecha: FechaISO,
  hoy: FechaISO,
  config: Config,
): Resultado & { correccion?: Correccion } {
  const logro = idx.logros.get(logroId);
  if (!logro) return { ok: false, error: "logro_inexistente" };
  if (!logro.metodosPermitidos.includes("cuestionario")) return { ok: false, error: "metodo_no_permitido" };
  const c = logro.cuestionario ? idx.cuestionarios.get(logro.cuestionario) : undefined;
  if (!c) return { ok: false, error: "metodo_no_permitido" };

  const correccion = corregirCuestionario(c, respuestas);
  if (!correccion.aprobado) return { ok: false, error: "cuestionario_no_aprobado", correccion };
  return { ...registrar(idx, estado, logroId, "cuestionario", fecha, hoy, config), correccion };
}
