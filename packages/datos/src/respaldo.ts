import type { EstadoUsuario, Indice, MetodoVerificacion } from "@preparados/dominio";
import { type Guardado, VERSION_ESQUEMA } from "./guardado";
import { reconciliar } from "./reconciliar";

const MARCA = { app: "preparados", tipo: "respaldo" } as const;

/** Texto JSON del respaldo, para descargar como archivo. */
export function exportarRespaldo(guardado: Guardado): string {
  return JSON.stringify({ ...MARCA, ...guardado }, null, 2);
}

export type ErrorImportacion =
  | "json_invalido"
  | "no_es_respaldo"
  | "version_mas_nueva"
  | "formato_invalido"
  | "entorno_inexistente";

export type Importacion =
  | { ok: true; guardado: Guardado; avisos: string[] }
  | { ok: false; error: ErrorImportacion; detalle?: string };

/** Migraciones por versión de origen: cada una lleva el objeto a la versión siguiente. */
const MIGRACIONES: Record<number, (g: Record<string, unknown>) => Record<string, unknown>> = {
  // 1: (g) => ({ ...g, esquema: 2, ... }),
};

const METODOS: MetodoVerificacion[] = ["autodeclaracion", "cuestionario", "foto_video", "certificado"];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const esTexto = (v: unknown): v is string => typeof v === "string" && v.length > 0;

/** Valida la forma del estado. Devuelve el motivo del primer error, o null si es válido. */
function errorDeForma(v: unknown): string | null {
  if (!esObjeto(v)) return "estado no es un objeto";
  const { perfil, logros, inventario } = v;
  if (!esObjeto(perfil) || !esTexto(perfil.entorno)) return "perfil.entorno inválido";
  if (!Array.isArray(perfil.escenarios) || !perfil.escenarios.every(esTexto)) return "perfil.escenarios inválido";
  for (const k of ["vivienda", "clima"] as const) {
    if (perfil[k] !== undefined && typeof perfil[k] !== "string") return `perfil.${k} inválido`;
  }
  if (!Array.isArray(logros)) return "logros no es una lista";
  for (const [i, l] of logros.entries()) {
    if (!esObjeto(l) || !esTexto(l.logro)) return `logros[${i}].logro inválido`;
    if (!METODOS.includes(l.metodo as MetodoVerificacion)) return `logros[${i}].metodo inválido`;
    if (typeof l.fecha !== "string" || !FECHA.test(l.fecha)) return `logros[${i}].fecha inválida`;
  }
  if (!Array.isArray(inventario)) return "inventario no es una lista";
  for (const [i, e] of inventario.entries()) {
    if (!esObjeto(e) || !esTexto(e.item)) return `inventario[${i}].item inválido`;
    if (typeof e.cantidad !== "number" || !Number.isFinite(e.cantidad) || e.cantidad <= 0) return `inventario[${i}].cantidad inválida`;
    if (e.vencimiento !== undefined && (typeof e.vencimiento !== "string" || !FECHA.test(e.vencimiento))) {
      return `inventario[${i}].vencimiento inválido`;
    }
  }
  return null;
}

/**
 * Lee un respaldo: verifica que sea de Preparados, migra versiones viejas, valida la forma
 * y lo ajusta al catálogo vigente. No toca el almacenamiento: quien llama decide si lo guarda.
 */
export function importarRespaldo(texto: string, idx: Indice): Importacion {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return { ok: false, error: "json_invalido" };
  }
  if (!esObjeto(datos) || datos.app !== MARCA.app || datos.tipo !== MARCA.tipo) return { ok: false, error: "no_es_respaldo" };
  if (typeof datos.esquema !== "number" || !Number.isInteger(datos.esquema) || datos.esquema < 1) {
    return { ok: false, error: "formato_invalido", detalle: "esquema inválido" };
  }
  if (datos.esquema > VERSION_ESQUEMA) return { ok: false, error: "version_mas_nueva" };

  let g: Record<string, unknown> = datos;
  while ((g.esquema as number) < VERSION_ESQUEMA) {
    const migrar = MIGRACIONES[g.esquema as number];
    if (!migrar) return { ok: false, error: "formato_invalido", detalle: `sin migración desde el esquema ${String(g.esquema)}` };
    g = migrar(g);
  }

  const problema = errorDeForma(g.estado);
  if (problema) return { ok: false, error: "formato_invalido", detalle: problema };
  if (typeof g.catalogoVersion !== "string" || typeof g.actualizado !== "string") {
    return { ok: false, error: "formato_invalido", detalle: "catalogoVersion o actualizado inválido" };
  }

  const r = reconciliar(g.estado as EstadoUsuario, idx);
  if ("error" in r) return { ok: false, error: r.error };
  return {
    ok: true,
    guardado: { esquema: VERSION_ESQUEMA, catalogoVersion: g.catalogoVersion, actualizado: g.actualizado, estado: r.estado },
    avisos: r.avisos,
  };
}
