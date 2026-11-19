import { CONFIG_POR_DEFECTO, xpBase } from "@preparados/dominio";
import { useEstadoApp } from "../estado/contexto";
import { irA, RUTA_INVENTARIO, rutaDeLogro } from "../rutas";
import { Seccion } from "./Seccion";

const porciento = (v: number) => `${Math.round(v * 100)}%`;

/** Barra de progreso: la misma forma para la preparación y para el XP. */
function Barra({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div
      className="barra"
      role="progressbar"
      aria-label={etiqueta}
      aria-valuenow={Math.round(valor * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className="barra__relleno" style={{ width: porciento(Math.min(1, Math.max(0, valor))) }} />
    </div>
  );
}

export function Inicio() {
  const estado = useEstadoApp();
  if (estado.fase !== "listo") return null;

  const { catalogo, resumen } = estado;
  if (!resumen) return null;

  const nombreEscenario = (id: string) => catalogo.escenarios.find((e) => e.id === id)?.nombre ?? id;
  const preparacion = [...resumen.preparacion];
  const recomendaciones = resumen.recomendaciones.slice(0, 3);
  const alertas = resumen.alertas;

  return (
    <Seccion titulo="Inicio">
      <div className="tarjeta">
        <h2>Preparación</h2>
        {preparacion.length === 0 ? (
          <p className="nodo__dato">Elegí un escenario en Perfil para ver tu porcentaje.</p>
        ) : (
          preparacion.map(([id, valor]) => (
            <div key={id} className="medida">
              <span className="medida__texto">
                <span>{nombreEscenario(id)}</span>
                <strong>{porciento(valor)}</strong>
              </span>
              <Barra valor={valor} etiqueta={nombreEscenario(id)} />
            </div>
          ))
        )}
      </div>

      <div className="tarjeta">
        <h2>Dominios</h2>
        {catalogo.dominios.map((d) => {
          const progreso = resumen.niveles.get(d.id);
          if (!progreso) return null;
          const falta = progreso.xpNivelSiguiente - progreso.xpNivelActual;
          const hecho = progreso.xp - progreso.xpNivelActual;
          return (
            <div key={d.id} className="medida">
              <span className="medida__texto">
                <span>
                  {d.nombre} · Nivel {progreso.nivel}
                </span>
                <span className="nodo__dato">
                  {hecho}/{falta} XP
                </span>
              </span>
              <Barra valor={falta === 0 ? 1 : hecho / falta} etiqueta={`${d.nombre}, nivel ${progreso.nivel}`} />
            </div>
          );
        })}
      </div>

      <div className="tarjeta">
        <h2>Seguí por acá</h2>
        {recomendaciones.length === 0 ? (
          <p className="nodo__dato">No hay logros disponibles: cargá equipo en Inventario para destrabar más.</p>
        ) : (
          <ul className="lista-limpia">
            {recomendaciones.map(({ logro }) => (
              <li key={logro.id}>
                <button type="button" className="nodo nodo--disponible" onClick={() => irA(rutaDeLogro(logro.id))}>
                  <span className="nodo__texto">
                    <span className="nodo__titulo">{logro.titulo}</span>
                    <span className="nodo__dato">
                      {catalogo.dominios.find((d) => d.id === logro.dominio)?.nombre ?? logro.dominio} ·{" "}
                      {xpBase(logro, CONFIG_POR_DEFECTO)} XP
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {alertas.length > 0 && (
        <div className="tarjeta">
          <h2>Vencimientos</h2>
          <ul className="lista-limpia">
            {alertas.slice(0, 3).map((a) => (
              <li key={`${a.item}-${a.vencimiento}`} className={a.diasRestantes < 0 ? "aviso error" : "alerta"}>
                {a.nombre}: {a.diasRestantes < 0 ? "vencido" : `en ${a.diasRestantes} días`}
              </li>
            ))}
          </ul>
          <button type="button" className="boton" onClick={() => irA(RUTA_INVENTARIO)}>
            Ver inventario
          </button>
        </div>
      )}
    </Seccion>
  );
}
