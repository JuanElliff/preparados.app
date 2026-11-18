import type { EstadoUsuario, Indice, UsuarioLogro } from "@preparados/dominio";

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
 * (se derivan del inventario); métodos que el logro ya no permite; registros duplicados (queda el primero).
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

  const vistos = new Set<string>();
  const logros: UsuarioLogro[] = [];
  for (const ul of estado.logros) {
    const logro = idx.logros.get(ul.logro);
    if (!logro) avisos.push(`logro descartado: ${ul.logro} (ya no existe)`);
    else if (logro.tipo === "equipo") avisos.push(`logro descartado: ${ul.logro} (es de equipo, sale del inventario)`);
    else if (!logro.metodosPermitidos.includes(ul.metodo)) avisos.push(`logro descartado: ${ul.logro} (método ${ul.metodo} ya no permitido)`);
    else if (vistos.has(ul.logro)) avisos.push(`logro descartado: ${ul.logro} (registro duplicado)`);
    else {
      vistos.add(ul.logro);
      logros.push(ul);
    }
  }

  const inventario = estado.inventario.filter((e) => {
    if (idx.items.has(e.item)) return true;
    avisos.push(`item descartado: ${e.item} (ya no existe)`);
    return false;
  });

  return { estado: { perfil: { ...estado.perfil, escenarios }, logros, inventario }, avisos };
}
