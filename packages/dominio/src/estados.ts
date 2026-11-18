import type { Config } from "./config";
import type { Indice } from "./catalogo";
import { inventarioCumple } from "./inventario";
import type { EstadoLogro, EstadoUsuario, FechaISO, LogroId } from "./tipos";

/**
 * Estado de cada logro del catálogo para un usuario.
 *
 * Habilidad: logrado si el usuario lo declaró; disponible si todos sus prerrequisitos
 * están logrados y el inventario tiene sus items requeridos; bloqueado en otro caso.
 *
 * Equipo: se deriva del inventario. Logrado si los prerrequisitos están logrados y el
 * inventario tiene los items; disponible si solo faltan los items; bloqueado en otro caso.
 */
export function estadosDeLogros(
  idx: Indice,
  estado: EstadoUsuario,
  hoy: FechaISO,
  config: Config,
): Map<LogroId, EstadoLogro> {
  const declarados = new Set(estado.logros.map((l) => l.logro));
  const resultado = new Map<LogroId, EstadoLogro>();

  const calcular = (id: LogroId): EstadoLogro => {
    const previo = resultado.get(id);
    if (previo) return previo;
    const logro = idx.logros.get(id);
    if (!logro) throw new Error(`Logro inexistente: ${id}`);

    const prerrequisitosOk = logro.prerrequisitos.every((p) => calcular(p) === "logrado");
    const itemsOk = inventarioCumple(logro.itemsRequeridos, estado.inventario, hoy, config);

    let e: EstadoLogro;
    if (logro.tipo === "habilidad") {
      e = declarados.has(id) ? "logrado" : prerrequisitosOk && itemsOk ? "disponible" : "bloqueado";
    } else {
      e = !prerrequisitosOk ? "bloqueado" : itemsOk ? "logrado" : "disponible";
    }
    resultado.set(id, e);
    return e;
  };

  for (const l of idx.catalogo.logros) calcular(l.id);
  return resultado;
}
