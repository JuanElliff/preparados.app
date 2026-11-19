import type { Dominio, DominioId, Logro, LogroId } from "@preparados/dominio";

/**
 * Layout del árbol del camino. Función pura: entra el catálogo, sale una grilla de celdas.
 * La pantalla solo multiplica por el tamaño de celda, así que esto se puede probar sin navegador.
 *
 * Solo entran los logros de habilidad: el equipo se cumple con el inventario y vive en Inventario.
 */

export interface NodoCamino {
  logro: Logro;
  /** 1 = base del árbol. Se dibuja de abajo hacia arriba. */
  capa: number;
  /** Columna de la grilla, 0 = izquierda. */
  columna: number;
}

/** Una rama del árbol: va del prerrequisito al logro que habilita. */
export interface AristaCamino {
  desde: LogroId;
  hasta: LogroId;
}

/** Las columnas que ocupa un dominio: todas sus ramas quedan juntas. */
export interface RamaCamino {
  dominio: DominioId;
  desde: number;
  hasta: number;
}

export interface Camino {
  nodos: NodoCamino[];
  aristas: AristaCamino[];
  ramas: RamaCamino[];
  /** Tamaño de la grilla, en celdas. */
  columnas: number;
  capas: number;
}

/** Columnas de aire entre las ramas de dos dominios. */
const SEPARACION = 1;

export function calcularCamino(logros: Logro[], dominios: Dominio[]): Camino {
  const habilidades = logros.filter((l) => l.tipo === "habilidad");
  const porId = new Map(habilidades.map((l) => [l.id, l]));
  if (habilidades.length === 0) return { nodos: [], aristas: [], ramas: [], columnas: 0, capas: 0 };

  // Prerrequisitos que están en el árbol. Los de equipo condicionan el estado, pero no se dibujan.
  const padres = new Map<LogroId, LogroId[]>(
    habilidades.map((l) => [l.id, l.prerrequisitos.filter((p) => porId.has(p))]),
  );

  // Capa: nunca por debajo de la profundidad del catálogo ni de la de sus prerrequisitos.
  const capas = new Map<LogroId, number>();
  const capaDe = (id: LogroId, enCamino: Set<LogroId>): number => {
    const memo = capas.get(id);
    if (memo !== undefined) return memo;
    // El catálogo se valida sin ciclos; por las dudas, un ciclo no cuelga el layout.
    if (enCamino.has(id)) return 1;
    enCamino.add(id);
    const logro = porId.get(id);
    const desdeArriba = (padres.get(id) ?? []).map((p) => capaDe(p, enCamino) + 1);
    const capa = Math.max(1, logro?.profundidad ?? 1, ...desdeArriba);
    enCamino.delete(id);
    capas.set(id, capa);
    return capa;
  };
  for (const l of habilidades) capaDe(l.id, new Set());

  const altura = Math.max(...habilidades.map((l) => capas.get(l.id) ?? 1));

  // Ancho de cada rama: lo más ancho que se pone ese dominio en una misma capa.
  const orden = new Map(dominios.map((d, i) => [d.id, d.orden ?? i]));
  const presentes = [...new Set(habilidades.map((l) => l.dominio))].sort(
    (a, b) => (orden.get(a) ?? Number.MAX_SAFE_INTEGER) - (orden.get(b) ?? Number.MAX_SAFE_INTEGER),
  );
  const ramas: RamaCamino[] = [];
  let inicio = 0;
  for (const dominio of presentes) {
    let ancho = 1;
    for (let capa = 1; capa <= altura; capa++) {
      const cuantos = habilidades.filter((l) => l.dominio === dominio && capas.get(l.id) === capa).length;
      ancho = Math.max(ancho, cuantos);
    }
    ramas.push({ dominio, desde: inicio, hasta: inicio + ancho - 1 });
    inicio += ancho + SEPARACION;
  }
  const columnas = inicio - SEPARACION;

  // Dentro de su rama, cada nodo busca quedar sobre sus prerrequisitos; el resto, centrado.
  const indiceCatalogo = new Map(habilidades.map((l, i) => [l.id, i]));
  const columnaDe = new Map<LogroId, number>();
  const deseada = (id: LogroId): number | null => {
    const arriba = (padres.get(id) ?? []).map((p) => columnaDe.get(p)).filter((c) => c !== undefined);
    return arriba.length === 0 ? null : arriba.reduce((a, b) => a + b, 0) / arriba.length;
  };

  const nodos: NodoCamino[] = [];
  for (let capa = 1; capa <= altura; capa++) {
    for (const rama of ramas) {
      const enCelda = habilidades.filter((l) => l.dominio === rama.dominio && capas.get(l.id) === capa);
      if (enCelda.length === 0) continue;
      const ancho = rama.hasta - rama.desde + 1;
      const desplazamiento = Math.floor((ancho - enCelda.length) / 2);
      enCelda
        .sort((a, b) => {
          const da = deseada(a.id);
          const db = deseada(b.id);
          if (da !== db) return (da ?? Number.MAX_SAFE_INTEGER) - (db ?? Number.MAX_SAFE_INTEGER);
          return (indiceCatalogo.get(a.id) ?? 0) - (indiceCatalogo.get(b.id) ?? 0);
        })
        .forEach((logro, i) => {
          const columna = rama.desde + desplazamiento + i;
          columnaDe.set(logro.id, columna);
          nodos.push({ logro, capa, columna });
        });
    }
  }

  const aristas: AristaCamino[] = [];
  for (const l of habilidades) {
    for (const p of padres.get(l.id) ?? []) aristas.push({ desde: p, hasta: l.id });
  }

  return { nodos, aristas, ramas, columnas, capas: altura };
}
