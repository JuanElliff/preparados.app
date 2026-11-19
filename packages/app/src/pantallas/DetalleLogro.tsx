import {
  CONFIG_POR_DEFECTO,
  type Cuestionario as CuestionarioCatalogo,
  type EstadoLogro,
  type Logro,
  xpBase,
  xpHabilidad,
} from "@preparados/dominio";
import { useEffect, useState } from "react";
import { useEstadoApp, useTienda } from "../estado/contexto";
import type { ResultadoAccion } from "../estado/tienda";
import { irA, RUTA_APRENDE, RUTA_CAMINO, rutaDeEntrada } from "../rutas";

const NOMBRE_ESTADO: Record<EstadoLogro, string> = {
  logrado: "Logrado",
  disponible: "Disponible",
  bloqueado: "Bloqueado",
};

const TEXTO_ERROR: Record<string, string> = {
  bloqueado: "Todavía no está disponible: te faltan prerrequisitos o equipo.",
  metodo_no_permitido: "Este logro no se puede verificar de esa manera.",
  sin_mejora: "Ya lo tenés con una verificación igual o mejor.",
  cuestionario_no_aprobado: "No llegaste al mínimo para aprobar.",
  logro_de_equipo: "Este logro se cumple solo, con lo que cargues en Inventario.",
  logro_inexistente: "Este logro ya no está en el catálogo.",
  usar_cuestionario: "Para este método hay que hacer el cuestionario.",
  sin_perfil: "Primero completá la bienvenida.",
};

export function DetalleLogro({ id }: { id: string }) {
  const tienda = useTienda();
  const estado = useEstadoApp();
  const [error, setError] = useState<string | null>(null);
  const [enCuestionario, setEnCuestionario] = useState(false);
  const [subida, setSubida] = useState<{ dominio: string; nivel: number } | null>(null);

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
  const dominio = catalogo.dominios.find((d) => d.id === logro.dominio);
  const registro = estado.guardado?.estado.logros.find((l) => l.logro === logro.id);
  const cuestionario = logro.cuestionario ? catalogo.cuestionarios.find((c) => c.id === logro.cuestionario) : undefined;
  const entradas = catalogo.biblioteca.filter((e) => e.logros.includes(logro.id));

  const puedeAutodeclarar = logro.metodosPermitidos.includes("autodeclaracion") && !registro;
  const puedeCuestionario =
    logro.metodosPermitidos.includes("cuestionario") &&
    cuestionario !== undefined &&
    (!registro || registro.metodo === "autodeclaracion");

  const atender = (r: ResultadoAccion) => {
    if (r.ok) {
      setError(null);
      if (r.subioNivel) {
        setSubida({
          dominio: catalogo.dominios.find((d) => d.id === r.subioNivel?.dominio)?.nombre ?? r.subioNivel.dominio,
          nivel: r.subioNivel.nivel,
        });
      }
      return true;
    }
    setError(TEXTO_ERROR[r.error] ?? "No se pudo registrar el logro.");
    return false;
  };

  if (enCuestionario && cuestionario) {
    return (
      <>
        <Cuestionario
          logro={logro}
          cuestionario={cuestionario}
          responder={async (respuestas) => {
            const r = await tienda.responderCuestionario(logro.id, respuestas);
            const ok = r.ok;
            if (ok) atender(r);
            return { ok, correccion: r.correccion };
          }}
          cerrar={() => setEnCuestionario(false)}
        />
        {subida && <SubidaDeNivel {...subida} cerrar={() => setSubida(null)} />}
      </>
    );
  }

  const xpPosible = xpBase(logro, CONFIG_POR_DEFECTO);
  const xpLogrado = registro ? xpHabilidad(logro, registro.metodo, CONFIG_POR_DEFECTO) : 0;

  return (
    <section className="seccion">
      <p className="rotulo">
        {dominio?.nombre ?? logro.dominio} · {registro ? `${xpLogrado} de ${xpPosible}` : xpPosible} XP ·{" "}
        {NOMBRE_ESTADO[estadoLogro]}
      </p>
      <h1>{logro.titulo}</h1>
      <p>{logro.descripcion}</p>

      {logro.prerrequisitos.length > 0 && (
        <ListaDeIds
          titulo="Antes de esto"
          ids={logro.prerrequisitos}
          nombre={(otro) => catalogo.logros.find((l) => l.id === otro)?.titulo ?? otro}
          estados={resumen?.estados}
        />
      )}

      {logro.itemsRequeridos.length > 0 && (
        <div className="tarjeta">
          <h2>Necesitás</h2>
          <ul className="lista-limpia">
            {logro.itemsRequeridos.map((r) => (
              <li key={r.item} className="nodo__dato">
                {catalogo.items.find((i) => i.id === r.item)?.nombre ?? r.item} × {r.cantidad}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="aviso error">{error}</p>}

      {registro && (
        <p className="por-ahora">
          {registro.metodo === "cuestionario"
            ? "Lo aprobaste con el cuestionario."
            : "Lo declaraste vos: el cuestionario te da el XP completo."}
        </p>
      )}

      <div className="fila">
        {puedeAutodeclarar && (
          <button
            type="button"
            className="boton boton--principal"
            disabled={estadoLogro === "bloqueado"}
            onClick={async () => atender(await tienda.declarar(logro.id, "autodeclaracion"))}
          >
            Lo sé hacer
          </button>
        )}
        {puedeCuestionario && (
          <button
            type="button"
            className={puedeAutodeclarar ? "boton" : "boton boton--principal"}
            disabled={estadoLogro === "bloqueado"}
            onClick={() => {
              setError(null);
              setEnCuestionario(true);
            }}
          >
            {registro ? "Mejorar con el cuestionario" : "Hacer el cuestionario"}
          </button>
        )}
      </div>

      {estadoLogro === "bloqueado" && !registro && (
        <p className="por-ahora">Se destraba cuando completes lo de arriba.</p>
      )}

      {entradas.length > 0 && (
        <div className="tarjeta">
          <h2>Para aprender</h2>
          <ul className="lista-limpia">
            {entradas.map((e) => (
              <li key={e.id}>
                <a href={`#${rutaDeEntrada(e.id)}`}>{e.titulo}</a>
                <span className="nodo__dato"> · {e.tipo === "video" ? "Video" : "Guía"}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {entradas.length === 0 && (
        <p className="por-ahora">
          Todavía no hay contenido para este logro en <a href={`#${RUTA_APRENDE}`}>Aprendé</a>.
        </p>
      )}

      <button type="button" className="boton" onClick={() => irA(RUTA_CAMINO)}>
        Volver al camino
      </button>

      {subida && <SubidaDeNivel {...subida} cerrar={() => setSubida(null)} />}
    </section>
  );
}

function ListaDeIds({
  titulo,
  ids,
  nombre,
  estados,
}: {
  titulo: string;
  ids: string[];
  nombre: (id: string) => string;
  estados: Map<string, EstadoLogro> | undefined;
}) {
  return (
    <div className="tarjeta">
      <h2>{titulo}</h2>
      <ul className="lista-limpia">
        {ids.map((id) => (
          <li key={id} className="nodo__dato">
            {nombre(id)}
            {estados?.get(id) === "logrado" ? " · listo" : " · pendiente"}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Una pregunta por pantalla y, al final, cuántas acertaste. */
function Cuestionario({
  logro,
  cuestionario,
  responder,
  cerrar,
}: {
  logro: Logro;
  cuestionario: CuestionarioCatalogo;
  responder: (
    respuestas: number[],
  ) => Promise<{ ok: boolean; correccion?: { correctas: number; total: number } | undefined }>;
  cerrar: () => void;
}) {
  const [respuestas, setRespuestas] = useState<number[]>([]);
  const [indice, setIndice] = useState(0);
  const [resultado, setResultado] = useState<{ ok: boolean; correctas: number; total: number } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const reiniciar = () => {
    setRespuestas([]);
    setIndice(0);
    setResultado(null);
  };

  if (resultado) {
    return (
      <section className="seccion">
        <p className="rotulo">Cuestionario</p>
        <h1>{resultado.ok ? "Aprobado" : "No alcanzó"}</h1>
        <p>
          Respondiste bien {resultado.correctas} de {resultado.total}.
        </p>
        <p className="por-ahora">
          {resultado.ok
            ? "El logro queda con el XP completo."
            : `Para aprobar necesitás al menos ${Math.ceil(cuestionario.umbralAprobacion * resultado.total)} de ${resultado.total}.`}
        </p>
        <div className="fila">
          {!resultado.ok && (
            <button type="button" className="boton boton--principal" onClick={reiniciar}>
              Reintentar
            </button>
          )}
          <button type="button" className="boton" onClick={cerrar}>
            Volver al logro
          </button>
        </div>
      </section>
    );
  }

  const pregunta = cuestionario.preguntas[indice];
  if (!pregunta) return null;
  const elegida = respuestas[indice];
  const ultima = indice === cuestionario.preguntas.length - 1;

  const elegir = (opcion: number) =>
    setRespuestas((previas) => {
      const copia = [...previas];
      copia[indice] = opcion;
      return copia;
    });

  const terminar = async () => {
    setEnviando(true);
    const r = await responder(respuestas);
    setEnviando(false);
    setResultado({
      ok: r.ok,
      correctas: r.correccion?.correctas ?? 0,
      total: r.correccion?.total ?? cuestionario.preguntas.length,
    });
  };

  return (
    <section className="seccion">
      <p className="rotulo">
        {logro.titulo} · Pregunta {indice + 1} de {cuestionario.preguntas.length}
      </p>
      <h1>{pregunta.enunciado}</h1>
      <fieldset className="opciones">
        <legend className="rotulo">Elegí una</legend>
        {pregunta.opciones.map((opcion, i) => (
          <label key={opcion} className="opcion">
            <input
              type="radio"
              name={`pregunta-${indice}`}
              checked={elegida === i}
              onChange={() => elegir(i)}
            />
            <span>{opcion}</span>
          </label>
        ))}
      </fieldset>

      <div className="fila">
        {indice > 0 && (
          <button type="button" className="boton" onClick={() => setIndice((i) => i - 1)}>
            Atrás
          </button>
        )}
        {ultima ? (
          <button
            type="button"
            className="boton boton--principal"
            disabled={elegida === undefined || enviando}
            onClick={() => void terminar()}
          >
            {enviando ? "Corrigiendo…" : "Terminar"}
          </button>
        ) : (
          <button
            type="button"
            className="boton boton--principal"
            disabled={elegida === undefined}
            onClick={() => setIndice((i) => i + 1)}
          >
            Siguiente
          </button>
        )}
        <button type="button" className="boton" onClick={cerrar}>
          Salir
        </button>
      </div>
    </section>
  );
}

/** Cartel de subida de nivel. Con prefers-reduced-motion la animación queda neutralizada por el tema. */
function SubidaDeNivel({ dominio, nivel, cerrar }: { dominio: string; nivel: number; cerrar: () => void }) {
  useEffect(() => {
    const t = setTimeout(cerrar, 3000);
    return () => clearTimeout(t);
  }, [cerrar]);

  return (
    <div className="subida" role="status" aria-live="polite">
      <div className="subida__cartel">
        <p className="rotulo">{dominio} subió de nivel</p>
        <p className="subida__numero">{nivel}</p>
        <button type="button" className="boton" onClick={cerrar}>
          Seguir
        </button>
      </div>
    </div>
  );
}
