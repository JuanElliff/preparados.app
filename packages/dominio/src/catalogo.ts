import type { Catalogo, Cuestionario, Dominio, EntradaBiblioteca, Item, Logro } from "./tipos";

/** Acceso por id al catálogo. Se arma una vez por catálogo. */
export interface Indice {
  catalogo: Catalogo;
  dominios: Map<string, Dominio>;
  logros: Map<string, Logro>;
  items: Map<string, Item>;
  cuestionarios: Map<string, Cuestionario>;
  biblioteca: Map<string, EntradaBiblioteca>;
  /** Posición de cada logro en el catálogo: desempate provisorio de las recomendaciones. */
  orden: Map<string, number>;
}

export function indexar(catalogo: Catalogo): Indice {
  return {
    catalogo,
    dominios: new Map(catalogo.dominios.map((d) => [d.id, d])),
    logros: new Map(catalogo.logros.map((l) => [l.id, l])),
    items: new Map(catalogo.items.map((i) => [i.id, i])),
    cuestionarios: new Map(catalogo.cuestionarios.map((c) => [c.id, c])),
    biblioteca: new Map(catalogo.biblioteca.map((e) => [e.id, e])),
    orden: new Map(catalogo.logros.map((l, i) => [l.id, i])),
  };
}

/** Devuelve la lista de errores del catálogo. Vacía = catálogo válido. */
export function validarCatalogo(catalogo: Catalogo): string[] {
  const errores: string[] = [];
  const idx = indexar(catalogo);

  const duplicados = (nombre: string, ids: string[]) => {
    const vistos = new Set<string>();
    for (const id of ids) {
      if (vistos.has(id)) errores.push(`${nombre} duplicado: ${id}`);
      vistos.add(id);
    }
  };
  duplicados("dominio", catalogo.dominios.map((d) => d.id));
  duplicados("logro", catalogo.logros.map((l) => l.id));
  duplicados("item", catalogo.items.map((i) => i.id));
  duplicados("entorno", catalogo.entornos.map((e) => e.id));
  duplicados("escenario", catalogo.escenarios.map((e) => e.id));
  duplicados("cuestionario", catalogo.cuestionarios.map((c) => c.id));
  duplicados("id de biblioteca", catalogo.biblioteca.map((e) => e.id));

  for (const l of catalogo.logros) {
    const p = `logro ${l.id}`;
    if (!idx.dominios.has(l.dominio)) errores.push(`${p}: dominio inexistente ${l.dominio}`);
    if (!Number.isInteger(l.profundidad) || l.profundidad < 1) errores.push(`${p}: profundidad inválida`);
    for (const pre of l.prerrequisitos) {
      if (!idx.logros.has(pre)) errores.push(`${p}: prerrequisito inexistente ${pre}`);
    }
    for (const r of l.itemsRequeridos) {
      if (!idx.items.has(r.item)) errores.push(`${p}: item inexistente ${r.item}`);
      if (r.cantidad <= 0) errores.push(`${p}: cantidad inválida para ${r.item}`);
    }
    if (l.tipo === "equipo") {
      if (l.itemsRequeridos.length === 0) errores.push(`${p}: un logro de equipo necesita itemsRequeridos`);
      if (l.metodosPermitidos.length > 0) errores.push(`${p}: un logro de equipo no lleva métodos de verificación`);
    } else {
      if (l.metodosPermitidos.length === 0) errores.push(`${p}: sin métodos de verificación`);
      if (l.metodosPermitidos.includes("cuestionario")) {
        const c = l.cuestionario ? idx.cuestionarios.get(l.cuestionario) : undefined;
        if (!c) errores.push(`${p}: permite cuestionario pero no tiene uno válido`);
        else if (c.logro !== l.id) errores.push(`${p}: el cuestionario ${c.id} apunta a otro logro`);
      }
    }
  }

  for (const c of catalogo.cuestionarios) {
    const p = `cuestionario ${c.id}`;
    if (c.preguntas.length === 0) errores.push(`${p}: sin preguntas`);
    if (!(c.umbralAprobacion > 0 && c.umbralAprobacion <= 1)) errores.push(`${p}: umbral fuera de (0, 1]`);
    c.preguntas.forEach((q, i) => {
      if (!Number.isInteger(q.correcta) || q.correcta < 0 || q.correcta >= q.opciones.length) {
        errores.push(`${p}: la pregunta ${i + 1} tiene un índice de respuesta correcta inválido`);
      }
    });
  }

  for (const e of catalogo.biblioteca) {
    const p = `entrada de biblioteca ${e.id}`;
    if (!idx.dominios.has(e.dominio)) errores.push(`${p}: dominio inexistente ${e.dominio}`);
    if (e.tipo === "guia") {
      if (!e.cuerpo?.trim()) errores.push(`${p}: una guía necesita cuerpo`);
    } else if (!e.videoUrl?.trim()) {
      errores.push(`${p}: un video necesita videoUrl`);
    }
    for (const l of e.logros) {
      if (!idx.logros.has(l)) errores.push(`${p}: logro relacionado inexistente ${l}`);
    }
  }

  for (const grupo of [catalogo.entornos, catalogo.escenarios]) {
    for (const g of grupo) {
      for (const [d, w] of Object.entries(g.pesos)) {
        if (!idx.dominios.has(d)) errores.push(`${g.id}: peso para dominio inexistente ${d}`);
        if (!(w >= 0 && w <= 1)) errores.push(`${g.id}: peso fuera de [0, 1] en ${d}`);
      }
    }
  }

  // El árbol de prerrequisitos tiene que ser acíclico.
  const estado = new Map<string, "visitando" | "listo">();
  const visitar = (id: string, camino: string[]): void => {
    const e = estado.get(id);
    if (e === "listo") return;
    if (e === "visitando") {
      errores.push(`ciclo de prerrequisitos: ${[...camino, id].join(" -> ")}`);
      return;
    }
    estado.set(id, "visitando");
    for (const pre of idx.logros.get(id)?.prerrequisitos ?? []) {
      if (idx.logros.has(pre)) visitar(pre, [...camino, id]);
    }
    estado.set(id, "listo");
  };
  for (const l of catalogo.logros) visitar(l.id, []);

  return errores;
}
