import { CONFIG_POR_DEFECTO, type EstadoLogro, type LogroId, xpBase } from "@preparados/dominio";
import { useEffect, useMemo } from "react";
import { calcularCamino, type NodoCamino } from "../camino/layout";
import { useEstadoApp } from "../estado/contexto";
import { irA, rutaDeLogro } from "../rutas";

/** Tamaño de la celda de la grilla, en px. El layout trabaja en celdas; acá se vuelven píxeles. */
const CELDA = { ancho: 104, alto: 116 };
const ALTO_ROTULOS = 40;

const centroX = (columna: number) => columna * CELDA.ancho + CELDA.ancho / 2;
const centroY = (capa: number, capas: number) => (capas - capa) * CELDA.alto + CELDA.alto / 2;

const NOMBRE_ESTADO: Record<EstadoLogro, string> = {
  logrado: "logrado",
  disponible: "disponible",
  bloqueado: "bloqueado",
};

/**
 * Última posición de scroll dentro del camino. Vive fuera del componente porque se vuelve a montar
 * cada vez que se entra (incluso al volver del detalle de un logro): sin esto, siempre arrancaría
 * desde abajo y se perdería el lugar donde se estaba.
 */
let scrollRecordado: number | null = null;

export function Camino() {
  const estado = useEstadoApp();
  const catalogo = estado.fase === "listo" ? estado.catalogo : null;

  // El layout solo depende del catálogo: no se recalcula al cambiar el progreso.
  const camino = useMemo(
    () => (catalogo ? calcularCamino(catalogo.logros, catalogo.dominios) : null),
    [catalogo],
  );

  // La primera vez arranca abajo (el árbol se recorre de abajo hacia arriba); después, recuerda
  // dónde estabas.
  useEffect(() => {
    if (!camino) return;
    globalThis.scrollTo?.({
      top: scrollRecordado ?? document.body.scrollHeight,
      behavior: "instant",
    });
    const recordar = () => {
      scrollRecordado = globalThis.scrollY ?? 0;
    };
    globalThis.addEventListener("scroll", recordar);
    return () => {
      recordar();
      globalThis.removeEventListener("scroll", recordar);
    };
  }, [camino]);

  if (estado.fase !== "listo" || !catalogo || !camino) return null;

  const estados = estado.resumen?.estados ?? new Map<LogroId, EstadoLogro>();
  const ancho = camino.columnas * CELDA.ancho;
  const alto = camino.capas * CELDA.alto + ALTO_ROTULOS;
  const nombreDominio = (id: string) => catalogo.dominios.find((d) => d.id === id)?.nombre ?? id;

  const rama = (desde: NodoCamino, hasta: NodoCamino) => {
    const x1 = centroX(desde.columna);
    const y1 = centroY(desde.capa, camino.capas);
    const x2 = centroX(hasta.columna);
    const y2 = centroY(hasta.capa, camino.capas);
    const curva = CELDA.alto * 0.45;
    return `M ${x1} ${y1} C ${x1} ${y1 - curva}, ${x2} ${y2 + curva}, ${x2} ${y2}`;
  };

  const porId = new Map(camino.nodos.map((n) => [n.logro.id, n]));

  return (
    <section className="seccion">
      <h1>Camino</h1>
      <p className="por-ahora">Las habilidades de todos los dominios. El equipo se registra en Inventario.</p>

      <div className="camino">
        <div className="camino__lienzo" style={{ width: ancho, height: alto }}>
          <svg className="camino__ramas" width={ancho} height={alto} aria-hidden="true" focusable="false">
            {camino.aristas.map((a) => {
              const desde = porId.get(a.desde);
              const hasta = porId.get(a.hasta);
              if (!desde || !hasta) return null;
              const recorrida = estados.get(a.desde) === "logrado";
              return (
                <path
                  key={`${a.desde}-${a.hasta}`}
                  d={rama(desde, hasta)}
                  className={recorrida ? "camino__rama camino__rama--recorrida" : "camino__rama"}
                />
              );
            })}
          </svg>

          {camino.nodos.map((n) => {
            const estadoLogro = estados.get(n.logro.id) ?? "bloqueado";
            const xp = xpBase(n.logro, CONFIG_POR_DEFECTO);
            return (
              <button
                key={n.logro.id}
                type="button"
                className={`camino-nodo camino-nodo--${estadoLogro}`}
                style={{
                  left: centroX(n.columna) - CELDA.ancho / 2,
                  top: centroY(n.capa, camino.capas) - CELDA.alto / 2,
                  width: CELDA.ancho,
                }}
                aria-label={`${n.logro.titulo}. ${nombreDominio(n.logro.dominio)}, ${xp} XP, ${NOMBRE_ESTADO[estadoLogro]}.`}
                onClick={() => irA(rutaDeLogro(n.logro.id))}
              >
                <span className="camino-nodo__marca" aria-hidden="true">
                  {estadoLogro === "logrado" ? "✓" : xp}
                </span>
                <span className="camino-nodo__titulo">{n.logro.titulo}</span>
              </button>
            );
          })}

          {camino.ramas.map((r) => (
            <span
              key={r.dominio}
              className="camino__rotulo rotulo"
              style={{
                left: centroX(r.desde) - CELDA.ancho / 2,
                top: camino.capas * CELDA.alto,
                width: (r.hasta - r.desde + 1) * CELDA.ancho,
              }}
            >
              {nombreDominio(r.dominio)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
