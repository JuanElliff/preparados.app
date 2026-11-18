import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative } from "node:path";
import {
  type Catalogo,
  type Cuestionario,
  type EntradaBiblioteca,
  type Logro,
  type MetodoVerificacion,
  validarCatalogo,
} from "@preparados/dominio";
import { parse } from "yaml";

export interface Compilacion {
  catalogo: Catalogo;
  /** Errores de lectura y de validación. Vacío = catálogo listo para publicar. */
  errores: string[];
}

const METODOS: MetodoVerificacion[] = ["autodeclaracion", "cuestionario", "foto_video", "certificado"];

const leer = (ruta: string) => readFileSync(ruta, "utf8").replace(/\r\n/g, "\n");

function leerYaml<T>(dir: string, archivo: string, errores: string[], vacio: T): T {
  try {
    return (parse(leer(join(dir, archivo))) as T) ?? vacio;
  } catch (e) {
    errores.push(`${archivo}: ${(e as Error).message}`);
    return vacio;
  }
}

function archivosMd(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (nombre.startsWith("_") || nombre.startsWith(".")) return [];
    if (statSync(ruta).isDirectory()) return archivosMd(ruta);
    return nombre.endsWith(".md") ? [ruta] : [];
  });
}

const esTexto = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const esListaDeTextos = (v: unknown): v is string[] => Array.isArray(v) && v.every(esTexto);

/** Separa el frontmatter YAML del cuerpo en Markdown. */
function leerArchivo(
  ruta: string,
  raiz: string,
  errores: string[],
): { nombre: string; d: Record<string, unknown>; cuerpo: string } | null {
  const nombre = relative(raiz, ruta);
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(leer(ruta));
  if (!m) {
    errores.push(`${nombre}: falta el bloque --- de datos al principio`);
    return null;
  }
  try {
    return { nombre, d: (parse(m[1] ?? "") ?? {}) as Record<string, unknown>, cuerpo: (m[2] ?? "").trim() };
  } catch (e) {
    errores.push(`${nombre}: ${(e as Error).message}`);
    return null;
  }
}

/** Lee un archivo de logro: solo datos. El contenido de "Aprendé" vive en biblioteca/. */
function leerLogro(ruta: string, raiz: string, errores: string[]): { logro: Logro; cuestionario?: Cuestionario } | null {
  const a = leerArchivo(ruta, raiz, errores);
  if (!a) return null;
  const { nombre, d, cuerpo } = a;

  const err = (msg: string) => errores.push(`${nombre}: ${msg}`);
  const antes = errores.length;
  if (!esTexto(d.id)) err("falta id");
  else if (basename(ruta, ".md") !== d.id) err(`el archivo tiene que llamarse ${d.id}.md`);
  if (!esTexto(d.dominio)) err("falta dominio");
  if (d.tipo !== "habilidad" && d.tipo !== "equipo") err("tipo tiene que ser habilidad o equipo");
  if (!esTexto(d.titulo)) err("falta titulo");
  if (!esTexto(d.descripcion)) err("falta descripcion");
  if (typeof d.profundidad !== "number") err("falta profundidad");
  if (d.xpBase !== undefined && typeof d.xpBase !== "number") err("xpBase tiene que ser un número");
  const prerrequisitos = d.prerrequisitos ?? [];
  if (!esListaDeTextos(prerrequisitos)) err("prerrequisitos tiene que ser una lista de ids");
  const metodos = d.metodosPermitidos ?? [];
  if (!Array.isArray(metodos) || !metodos.every((x) => METODOS.includes(x as MetodoVerificacion))) {
    err(`metodosPermitidos admite: ${METODOS.join(", ")}`);
  }
  const items = d.itemsRequeridos ?? [];
  const itemsOk =
    Array.isArray(items) &&
    items.every((i) => typeof i === "object" && i !== null && esTexto((i as { item?: unknown }).item) && typeof (i as { cantidad?: unknown }).cantidad === "number");
  if (!itemsOk) err("itemsRequeridos: cada uno lleva item y cantidad");
  if (d.video !== undefined) err("los videos ahora son entradas de biblioteca/");
  if (cuerpo) err("el texto de los logros se movió a biblioteca/: el archivo termina en el ---");
  if (errores.length > antes) return null;

  const id = d.id as string;
  const logro: Logro = {
    id,
    dominio: d.dominio as string,
    tipo: d.tipo as Logro["tipo"],
    titulo: d.titulo as string,
    descripcion: d.descripcion as string,
    profundidad: d.profundidad as number,
    prerrequisitos: prerrequisitos as string[],
    itemsRequeridos: items as Logro["itemsRequeridos"],
    metodosPermitidos: metodos as MetodoVerificacion[],
    ...(d.xpBase !== undefined && { xpBase: d.xpBase as number }),
  };

  if (d.cuestionario === undefined) return { logro };
  const q = d.cuestionario as { umbral?: unknown; preguntas?: unknown };
  if (typeof q !== "object" || q === null || typeof q.umbral !== "number" || !Array.isArray(q.preguntas)) {
    err("cuestionario lleva umbral y preguntas");
    return null;
  }
  const preguntas = q.preguntas as Array<Record<string, unknown>>;
  for (const [i, p] of preguntas.entries()) {
    if (!esTexto(p?.enunciado) || !esListaDeTextos(p?.opciones) || typeof p?.correcta !== "number") {
      err(`pregunta ${i + 1}: lleva enunciado, opciones y correcta`);
      return null;
    }
  }
  const cuestionario: Cuestionario = {
    id: `q-${id}`,
    logro: id,
    umbralAprobacion: q.umbral,
    preguntas: preguntas.map((p) => ({
      enunciado: p.enunciado as string,
      opciones: p.opciones as string[],
      correcta: p.correcta as number,
    })),
  };
  return { logro: { ...logro, cuestionario: cuestionario.id }, cuestionario };
}

/** Lee una entrada de la biblioteca (frontmatter YAML + cuerpo en Markdown). */
function leerEntrada(ruta: string, raiz: string, errores: string[]): EntradaBiblioteca | null {
  const a = leerArchivo(ruta, raiz, errores);
  if (!a) return null;
  const { nombre, d, cuerpo } = a;

  const err = (msg: string) => errores.push(`${nombre}: ${msg}`);
  const antes = errores.length;
  if (!esTexto(d.id)) err("falta id");
  else if (basename(ruta, ".md") !== d.id) err(`el archivo tiene que llamarse ${d.id}.md`);
  if (!esTexto(d.dominio)) err("falta dominio");
  if (d.tipo !== "guia" && d.tipo !== "video") err("tipo tiene que ser guia o video");
  if (!esTexto(d.titulo)) err("falta titulo");
  if (!esTexto(d.resumen)) err("falta resumen");
  const logros = d.logros ?? [];
  if (!Array.isArray(logros) || !logros.every(esTexto)) err("logros tiene que ser una lista de ids");
  if (d.video !== undefined && !esTexto(d.video)) err("video tiene que ser una URL");
  if (d.tipo === "guia" && !cuerpo) err("una guía lleva el texto en Markdown después del ---");
  if (d.tipo === "video" && d.video === undefined) err("un video lleva video con la URL");
  if (errores.length > antes) return null;

  return {
    id: d.id as string,
    dominio: d.dominio as string,
    tipo: d.tipo as EntradaBiblioteca["tipo"],
    titulo: d.titulo as string,
    resumen: d.resumen as string,
    logros: logros as string[],
    ...(cuerpo && { cuerpo }),
    ...(d.video !== undefined && { videoUrl: d.video as string }),
  };
}

/** Lee la carpeta de contenido, arma el catálogo y lo valida con las reglas del dominio. */
export function compilarCatalogo(dir: string): Compilacion {
  const errores: string[] = [];
  const meta = leerYaml<{ version?: unknown }>(dir, "catalogo.yaml", errores, {});
  if (!esTexto(meta.version)) errores.push("catalogo.yaml: falta version");

  const logros: Logro[] = [];
  const cuestionarios: Cuestionario[] = [];
  // Orden estable: por dominio y nombre de archivo. Es el desempate de las recomendaciones.
  for (const ruta of archivosMd(join(dir, "logros")).sort()) {
    const r = leerLogro(ruta, dir, errores);
    if (!r) continue;
    logros.push(r.logro);
    if (r.cuestionario) cuestionarios.push(r.cuestionario);
  }

  const biblioteca: EntradaBiblioteca[] = [];
  for (const ruta of archivosMd(join(dir, "biblioteca")).sort()) {
    const e = leerEntrada(ruta, dir, errores);
    if (e) biblioteca.push(e);
  }

  const catalogo: Catalogo = {
    version: esTexto(meta.version) ? meta.version : "",
    dominios: leerYaml(dir, "dominios.yaml", errores, []),
    items: leerYaml(dir, "items.yaml", errores, []),
    entornos: leerYaml(dir, "entornos.yaml", errores, []),
    escenarios: leerYaml(dir, "escenarios.yaml", errores, []),
    logros,
    cuestionarios,
    biblioteca,
  };
  if (errores.length === 0) errores.push(...validarCatalogo(catalogo));
  return { catalogo, errores };
}
