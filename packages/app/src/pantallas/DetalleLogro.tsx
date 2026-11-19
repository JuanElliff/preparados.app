import { CONFIG_POR_DEFECTO, type EstadoLogro, xpBase } from "@preparados/dominio";
import { useEstadoApp } from "../estado/contexto";
import { irA, RUTA_CAMINO } from "../rutas";

const NOMBRE_ESTADO: Record<EstadoLogro, string> = {
  logrado: "Logrado",
  disponible: "Disponible",
  bloqueado: "Bloqueado",
};

/** Detalle de un logro. Las acciones y el cuestionario entran en la orden 7. */
export function DetalleLogro({ id }: { id: string }) {
  const estado = useEstadoApp();
  if (estado.fase !== "listo") return null;

  const { catalogo, resumen } = estado;
  const logro = catalogo.logros.find((l) => l.id === id);
  if (!logro) {
    return (
      <section className="seccion">
        <h1>Logro no encontrado</h1>
        <p className="por-ahora">Puede que haya cambiado el catálogo.</p>
        <button type="button" className="boton" onClick={() => irA(RUTA_CAMINO)}>
          Volver al camino
        </button>
      </section>
    );
  }

  const estadoLogro = resumen?.estados.get(logro.id) ?? "bloqueado";
  const dominio = catalogo.dominios.find((d) => d.id === logro.dominio)?.nombre ?? logro.dominio;
  const nombreLogro = (otro: string) => catalogo.logros.find((l) => l.id === otro)?.titulo ?? otro;
  const nombreItem = (otro: string) => catalogo.items.find((i) => i.id === otro)?.nombre ?? otro;

  return (
    <section className="seccion">
      <p className="rotulo">
        {dominio} · {xpBase(logro, CONFIG_POR_DEFECTO)} XP · {NOMBRE_ESTADO[estadoLogro]}
      </p>
      <h1>{logro.titulo}</h1>
      <p>{logro.descripcion}</p>

      {logro.prerrequisitos.length > 0 && (
        <div className="tarjeta">
          <h2>Antes de esto</h2>
          <ul className="lista-limpia">
            {logro.prerrequisitos.map((p) => (
              <li key={p} className="nodo__dato">
                {nombreLogro(p)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {logro.itemsRequeridos.length > 0 && (
        <div className="tarjeta">
          <h2>Necesitás</h2>
          <ul className="lista-limpia">
            {logro.itemsRequeridos.map((r) => (
              <li key={r.item} className="nodo__dato">
                {nombreItem(r.item)} × {r.cantidad}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" className="boton" onClick={() => irA(RUTA_CAMINO)}>
        Volver al camino
      </button>
    </section>
  );
}
