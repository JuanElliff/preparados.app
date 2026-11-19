import { CONFIG_POR_DEFECTO, type EntornoId, type EscenarioId, type EstadoUsuario, xpBase } from "@preparados/dominio";
import { useState } from "react";
import { useEstadoApp, useTienda } from "../estado/contexto";
import { hayQueAvisarDeInstalacion } from "../instalacion";
import { irA } from "../rutas";

type Paso = 1 | 2 | 3 | 4;

const TOTAL_PASOS = 3;

/**
 * Primera apertura: entorno, vivienda y clima, escenarios. Al terminar guarda el perfil
 * y muestra por dónde empezar.
 */
export function Onboarding() {
  const tienda = useTienda();
  const estado = useEstadoApp();
  const perfilPrevio = estado.fase === "listo" ? estado.guardado?.estado.perfil : undefined;

  const [paso, setPaso] = useState<Paso>(1);
  const [entorno, setEntorno] = useState<EntornoId | null>(perfilPrevio?.entorno ?? null);
  const [vivienda, setVivienda] = useState(perfilPrevio?.vivienda ?? "");
  const [clima, setClima] = useState(perfilPrevio?.clima ?? "");
  const [escenarios, setEscenarios] = useState<EscenarioId[]>(perfilPrevio?.escenarios ?? []);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (estado.fase !== "listo") return null;
  const { catalogo, resumen } = estado;

  const alternarEscenario = (id: EscenarioId) =>
    setEscenarios((previos) => (previos.includes(id) ? previos.filter((e) => e !== id) : [...previos, id]));

  const terminar = async () => {
    if (!entorno) return;
    setGuardando(true);
    setError(null);
    const nuevo: EstadoUsuario = {
      perfil: {
        entorno,
        escenarios,
        ...(vivienda.trim() && { vivienda: vivienda.trim() }),
        ...(clima.trim() && { clima: clima.trim() }),
      },
      logros: estado.guardado?.estado.logros ?? [],
      inventario: estado.guardado?.estado.inventario ?? [],
    };
    try {
      await tienda.guardar(nuevo);
      setPaso(4);
    } catch (e) {
      setError(`No se pudo guardar el perfil: ${(e as Error).message}`);
    } finally {
      setGuardando(false);
    }
  };

  if (paso === 4) {
    const ruta = resumen?.rutaInicial ?? [];
    return (
      <section className="seccion">
        <p className="rotulo">Listo</p>
        <h1>Por acá se empieza</h1>
        <p className="por-ahora">
          Con tu entorno y tus escenarios, estos son los primeros logros que conviene encarar.
        </p>
        <ul className="lista-limpia">
          {ruta.map(({ logro }) => (
            <li key={logro.id} className="tarjeta">
              <span className="nodo__titulo">{logro.titulo}</span>
              <span className="nodo__dato">
                {catalogo.dominios.find((d) => d.id === logro.dominio)?.nombre ?? logro.dominio} ·{" "}
                {xpBase(logro, CONFIG_POR_DEFECTO)} XP
              </span>
            </li>
          ))}
          {ruta.length === 0 && <li className="por-ahora">Todavía no hay logros disponibles en el catálogo.</li>}
        </ul>

        {hayQueAvisarDeInstalacion() && (
          <div className="tarjeta">
            <h2>Agregala a tu pantalla de inicio</h2>
            <p>
              En iPhone y iPad, Safari borra los datos de un sitio que no usás en 7 días. Instalada, la app
              se queda con todo lo tuyo.
            </p>
            <p className="por-ahora">
              Tocá <strong>Compartir</strong> (el cuadrito con la flecha) y después{" "}
              <strong>Agregar a inicio</strong>.
            </p>
          </div>
        )}

        <button type="button" className="boton boton--principal" onClick={() => irA("/")}>
          Empezar
        </button>
      </section>
    );
  }

  return (
    <section className="seccion">
      <p className="rotulo">
        Paso {paso} de {TOTAL_PASOS}
      </p>

      {paso === 1 && (
        <>
          <h1>¿Dónde vivís?</h1>
          <p className="por-ahora">Define cuánto pesa cada dominio en tu preparación.</p>
          <fieldset className="opciones">
            <legend className="rotulo">Entorno</legend>
            {catalogo.entornos.map((e) => (
              <label key={e.id} className="opcion">
                <input
                  type="radio"
                  name="entorno"
                  value={e.id}
                  checked={entorno === e.id}
                  onChange={() => setEntorno(e.id)}
                />
                <span>{e.nombre}</span>
              </label>
            ))}
          </fieldset>
        </>
      )}

      {paso === 2 && (
        <>
          <h1>Tu casa y tu clima</h1>
          <p className="por-ahora">Opcional. Sirve para afinar las recomendaciones más adelante.</p>
          <label className="campo">
            <span className="rotulo">Tipo de vivienda</span>
            <input
              type="text"
              value={vivienda}
              onChange={(ev) => setVivienda(ev.target.value)}
              placeholder="Departamento, casa, casa con terreno…"
            />
          </label>
          <label className="campo">
            <span className="rotulo">Clima</span>
            <input
              type="text"
              value={clima}
              onChange={(ev) => setClima(ev.target.value)}
              placeholder="Templado, frío y seco, subtropical…"
            />
          </label>
        </>
      )}

      {paso === 3 && (
        <>
          <h1>¿Para qué te querés preparar?</h1>
          <p className="por-ahora">Elegí uno o más. Cada escenario tiene su propio % de preparación.</p>
          <fieldset className="opciones">
            <legend className="rotulo">Escenarios</legend>
            {catalogo.escenarios.map((e) => (
              <label key={e.id} className="opcion">
                <input type="checkbox" checked={escenarios.includes(e.id)} onChange={() => alternarEscenario(e.id)} />
                <span>{e.nombre}</span>
              </label>
            ))}
          </fieldset>
        </>
      )}

      {error && <p className="aviso error">{error}</p>}

      <div className="fila">
        {paso > 1 && (
          <button type="button" className="boton" onClick={() => setPaso((p) => (p - 1) as Paso)}>
            Atrás
          </button>
        )}
        {paso < 3 && (
          <button
            type="button"
            className="boton boton--principal"
            disabled={paso === 1 && !entorno}
            onClick={() => setPaso((p) => (p + 1) as Paso)}
          >
            Seguir
          </button>
        )}
        {paso === 3 && (
          <button
            type="button"
            className="boton boton--principal"
            disabled={escenarios.length === 0 || guardando}
            onClick={() => void terminar()}
          >
            {guardando ? "Guardando…" : "Terminar"}
          </button>
        )}
      </div>
    </section>
  );
}
