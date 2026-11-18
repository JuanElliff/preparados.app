import type { Config } from "./config";
import type { Indice } from "./catalogo";
import type { FechaISO, InventarioItem, ItemRequerido } from "./tipos";

const MS_DIA = 86_400_000;

export function estaVencido(entrada: InventarioItem, hoy: FechaISO): boolean {
  return entrada.vencimiento !== undefined && entrada.vencimiento < hoy;
}

/** Cantidad disponible de un item, sumando todas las entradas del inventario. */
export function cantidadDisponible(
  inventario: InventarioItem[],
  item: string,
  hoy: FechaISO,
  config: Config,
): number {
  return inventario
    .filter((e) => e.item === item)
    .filter((e) => !(config.excluirItemsVencidos && estaVencido(e, hoy)))
    .reduce((s, e) => s + e.cantidad, 0);
}

export function inventarioCumple(
  requeridos: ItemRequerido[],
  inventario: InventarioItem[],
  hoy: FechaISO,
  config: Config,
): boolean {
  return requeridos.every((r) => cantidadDisponible(inventario, r.item, hoy, config) >= r.cantidad);
}

export interface AlertaVencimiento {
  item: string;
  nombre: string;
  vencimiento: FechaISO;
  /** Negativo = ya vencido. */
  diasRestantes: number;
}

/** Items que vencen dentro de `dias` días (o ya vencidos), del más urgente al menos urgente. */
export function itemsPorVencer(
  idx: Indice,
  inventario: InventarioItem[],
  hoy: FechaISO,
  dias: number,
): AlertaVencimiento[] {
  const base = Date.parse(hoy);
  return inventario
    .filter((e): e is InventarioItem & { vencimiento: FechaISO } => e.vencimiento !== undefined)
    .map((e) => ({
      item: e.item,
      nombre: idx.items.get(e.item)?.nombre ?? e.item,
      vencimiento: e.vencimiento,
      diasRestantes: Math.round((Date.parse(e.vencimiento) - base) / MS_DIA),
    }))
    .filter((a) => a.diasRestantes <= dias)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);
}
