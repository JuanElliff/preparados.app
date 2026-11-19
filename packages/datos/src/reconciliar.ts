import { CONFIG_POR_DEFECTO, type EstadoUsuario, type Indice, type UsuarioLogro } from "@preparados/dominio";

/** Entre dos registros del mismo logro: el de mejor verificación; a igual multiplicador, el más antiguo. */
function mejorRegistro(a: UsuarioLogro, b: UsuarioLogro): UsuarioLogro {
  const m = CONFIG_POR_DEFECTO.multiplicadores;
  const ma = m[a.metodo] ?? 0;
  const mb = m[b.metodo] ?? 0;
  if (ma !== mb) return ma > mb ? a : b;
  return a.fecha <= b.fecha ? a : b;
}

export interface Reconciliacion {
  estado: EstadoUsuario;
  /** Lo que se descartó y por qué. Vacío = nada cambió. */
  avisos: string[];
}

/**
 * Ajusta el estado del usuario al catálogo vigente. Se usa al importar un respaldo y al cargar
 * la app después de una actualización del catálogo.
 *
 * Descarta, con aviso: escenarios, logros e items que ya no existen; registros de logros de equipo
 * (se derivan del inventario); métodos que el logro ya no permite; registros duplicados (queda el de mejor
 * verificación y, a igual verificación, el más antiguo).
 * Devuelve error si el entorno ya no existe: el usuario tiene que volver a elegirlo.
 */
export function reconciliar(estado: EstadoUsuario, idx: Indice): Reconciliacion | { error: "entorno_inexistente" } {
  if (!idx.catalogo.entornos.some((e) => e.id === estado.perfil.entorno)) return { error: "entorno_inexistente" };

  const avisos: string[] = [];
  const escenariosValidos = new Set(idx.catalogo.escenarios.map((e) => e.id));

  const escenarios = estado.perfil.escenarios.filter((id) => {
    if (escenariosValidos.has(id)) return true;
    avisos.push(`escenario descartado: ${id} (ya no existe)`);
    return false;
  });

  // Un logro puede venir repetido en un respaldo viejo. Queda el mejor registro, en la posición del primero.
  const posicion = new Map<string, number>();
  const logros: UsuarioLogro[] = [];
  for (const ul of estado.logros) {
    const logro = idx.logros.get(ul.logro);
    if (!logro) {
      avisos.push(`logro descartado: ${ul.logro} (ya no existe)`);
      continue;
    }
    if (logro.tipo === "equipo") {
      avisos.push(`logro descartado: ${ul.logro} (es de equipo, sale del inventario)`);
      continue;
    }
    if (!logro.metodosPermitidos.includes(ul.metodo)) {
      avisos.push(`logro descartado: ${ul.logro} (método ${ul.metodo} ya no permitido)`);
      continue;
    }
    const i = posicion.get(ul.logro);
    if (i === undefined) {
      posicion.set(ul.logro, logros.length);
      logros.push(ul);
      continue;
    }
    const previo = logros[i]!;
    const queda = mejorRegistro(previo, ul);
    const descartado = queda === previo ? ul : previo;
    logros[i] = queda;
    avisos.push(
      `logro descartado: ${ul.logro} (registro duplicado ${descartado.metodo} del ${descartado.fecha}; ` +
        `queda ${queda.metodo} del ${queda.fecha})`,
    );
  }

  const inventario = estado.inventario.filter((e) => {
    if (idx.items.has(e.item)) return true;
    avisos.push(`item descartado: ${e.item} (ya no existe)`);
    return false;
  });

  return { estado: { perfil: { ...estado.perfil, escenarios }, logros, inventario }, avisos };
}
