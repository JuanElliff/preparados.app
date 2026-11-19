import type { DominioId, EntradaBiblioteca } from "@preparados/dominio";
import { useEffect, useState } from "react";
import { idDeYouTube, leerMarkdown, type Trozo } from "../biblioteca/markdown";
import { useEstadoApp } from "../estado/contexto";
import { irA, RUTA_APRENDE, rutaDeEntrada, rutaDeLogro } from "../rutas";
import { Seccion } from "./Seccion";

const TIPO = { guia: "Guía", video: "Video" } as const;

export function Aprende({ entrada }: { entrada?: string }) {
  const estado = useEstadoApp();
  const [dominio, setDominio] = useState<DominioId | null>(null);

  if (estado.fase !== "listo") return null;
  const { catalogo } = estado;

  if (entrada !== undefined) {
    const encontrada = catalogo.biblioteca.find((e) => e.id === entrada);
    return encontrada ? <Entrada entrada={encontrada} /> : <SinEntrada />;
  }

  const entradas = dominio ? catalogo.biblioteca.filter((e) => e.dominio === dominio) : catalogo.biblioteca;
  const nombreDominio = (id: string) => catalogo.dominios.find((d) => d.id === id)?.nombre ?? id;

  return (
    <Seccion titulo="Aprendé">
      <p className="por-ahora">Guías y videos elegidos. No dan XP: los logros se verifican en el Camino.</p>

      <div className="fila" role="group" aria-label="Filtrar por dominio">
        <button type="button" className="boton" aria-pressed={dominio === null} onClick={() => setDominio(null)}>
          Todo
        </button>
        {catalogo.dominios.map((d) => (
          <button
            key={d.id}
            type="button"
            className="boton"
            aria-pressed={dominio === d.id}
            onClick={() => setDominio(d.id)}
          >
            {d.nombre}
          </button>
        ))}
      </div>

      {entradas.length === 0 ? (
        <p className="por-ahora">Todavía no hay contenido para este dominio.</p>
      ) : (
        <ul className="lista-limpia">
          {entradas.map((e) => (
            <li key={e.id}>
              <button type="button" className="nodo" onClick={() => irA(rutaDeEntrada(e.id))}>
                <span className="nodo__texto">
                  <span className="nodo__titulo">{e.titulo}</span>
                  <span className="nodo__dato">
                    {nombreDominio(e.dominio)} · {TIPO[e.tipo]}
                  </span>
                  <span className="nodo__dato">{e.resumen}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  );
}

function SinEntrada() {
  return (
    <Seccion titulo="No encontramos esa entrada">
      <p className="por-ahora">Puede que haya cambiado el catálogo.</p>
      <button type="button" className="boton" onClick={() => irA(RUTA_APRENDE)}>
        Volver a Aprendé
      </button>
    </Seccion>
  );
}

function Entrada({ entrada }: { entrada: EntradaBiblioteca }) {
  const estado = useEstadoApp();
  const catalogo = estado.fase === "listo" ? estado.catalogo : null;
  const relacionados = catalogo?.logros.filter((l) => entrada.logros.includes(l.id)) ?? [];

  return (
    <section className="seccion">
      <p className="rotulo">
        {catalogo?.dominios.find((d) => d.id === entrada.dominio)?.nombre ?? entrada.dominio} ·{" "}
        {TIPO[entrada.tipo]}
      </p>
      <h1>{entrada.titulo}</h1>
      <p>{entrada.resumen}</p>

      {entrada.tipo === "video" && entrada.videoUrl && <Video url={entrada.videoUrl} titulo={entrada.titulo} />}
      {entrada.cuerpo && <Markdown texto={entrada.cuerpo} />}

      {relacionados.length > 0 && (
        <div className="tarjeta">
          <h2>Logros relacionados</h2>
          <ul className="lista-limpia">
            {relacionados.map((l) => (
              <li key={l.id}>
                <a href={`#${rutaDeLogro(l.id)}`}>{l.titulo}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" className="boton" onClick={() => irA(RUTA_APRENDE)}>
        Volver a Aprendé
      </button>
    </section>
  );
}

/** Los videos son lo único que necesita internet: sin conexión se avisa y no se deja un marco roto. */
function Video({ url, titulo }: { url: string; titulo: string }) {
  const [enLinea, setEnLinea] = useState(() => globalThis.navigator?.onLine !== false);

  useEffect(() => {
    const actualizar = () => setEnLinea(globalThis.navigator?.onLine !== false);
    globalThis.addEventListener("online", actualizar);
    globalThis.addEventListener("offline", actualizar);
    return () => {
      globalThis.removeEventListener("online", actualizar);
      globalThis.removeEventListener("offline", actualizar);
    };
  }, []);

  const id = idDeYouTube(url);

  if (!enLinea) {
    return (
      <div className="tarjeta">
        <p className="alerta">Este video necesita internet. Las guías se leen igual sin conexión.</p>
        <p className="nodo__dato">{url}</p>
      </div>
    );
  }

  if (!id) {
    return (
      <p className="por-ahora">
        <a href={url}>Ver el video</a>
      </p>
    );
  }

  return (
    <div className="video">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={titulo}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

function Markdown({ texto }: { texto: string }) {
  return (
    <div className="guia">
      {leerMarkdown(texto).map((bloque, i) => {
        const clave = `${bloque.tipo}-${i}`;
        if (bloque.tipo === "titulo") {
          const Etiqueta = (["h2", "h3", "h4"] as const)[bloque.nivel - 1] ?? "h4";
          return (
            <Etiqueta key={clave}>
              <Trozos trozos={bloque.texto} />
            </Etiqueta>
          );
        }
        if (bloque.tipo === "lista") {
          const Etiqueta = bloque.ordenada ? "ol" : "ul";
          return (
            <Etiqueta key={clave}>
              {bloque.items.map((item, j) => (
                <li key={`${clave}-${j}`}>
                  <Trozos trozos={item} />
                </li>
              ))}
            </Etiqueta>
          );
        }
        return (
          <p key={clave}>
            <Trozos trozos={bloque.texto} />
          </p>
        );
      })}
    </div>
  );
}

function Trozos({ trozos }: { trozos: Trozo[] }) {
  return (
    <>
      {trozos.map((t, i) => {
        const clave = `${t.tipo}-${i}`;
        if (t.tipo === "fuerte") return <strong key={clave}>{t.texto}</strong>;
        if (t.tipo === "enfasis") return <em key={clave}>{t.texto}</em>;
        if (t.tipo === "codigo") return <code key={clave}>{t.texto}</code>;
        if (t.tipo === "link")
          return (
            <a key={clave} href={t.url} target="_blank" rel="noreferrer noopener">
              {t.texto}
            </a>
          );
        return <span key={clave}>{t.texto}</span>;
      })}
    </>
  );
}
