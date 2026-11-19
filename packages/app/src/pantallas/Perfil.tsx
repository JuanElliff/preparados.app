import { exportarRespaldo, type Guardado, importarRespaldo } from "@preparados/datos";
import type { EscenarioId } from "@preparados/dominio";
import { useRef, useState } from "react";
import { useEstadoApp, useTienda } from "../estado/contexto";
import { TEMAS, useTema } from "../tema";
import { Seccion } from "./Seccion";

const ERROR_IMPORTACION: Record<string, string> = {
  json_invalido: "El archivo no es un JSON válido.",
  no_es_respaldo: "Ese archivo no es un respaldo de Preparados.",
  version_mas_nueva: "El respaldo viene de una versión más nueva de la app. Actualizala y probá de nuevo.",
  formato_invalido: "El respaldo está dañado.",
  entorno_inexistente: "El entorno del respaldo ya no existe en el catálogo.",
};

export function Perfil() {
  const tienda = useTienda();
  const estado = useEstadoApp();
  const [tema, cambiarTema] = useTema();
  const [guardado, setGuardado] = useState(false);
  const [aConfirmar, setAConfirmar] = useState<{ guardado: Guardado; avisos: string[] } | null>(null);
  const [errorImportar, setErrorImportar] = useState<string | null>(null);
  const [borrando, setBorrando] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  if (estado.fase !== "listo") return null;
  const { catalogo } = estado;
  const usuario = estado.guardado?.estado;
  if (!usuario) return null;

  const cambiarPerfil = async (cambio: Partial<typeof usuario.perfil>) => {
    await tienda.guardar({ ...usuario, perfil: { ...usuario.perfil, ...cambio } });
    setGuardado(true);
  };

  const alternarEscenario = (id: EscenarioId) => {
    const previos = usuario.perfil.escenarios;
    void cambiarPerfil({
      escenarios: previos.includes(id) ? previos.filter((e) => e !== id) : [...previos, id],
    });
  };

  const exportar = () => {
    if (!estado.guardado) return;
    const texto = exportarRespaldo(estado.guardado);
    const url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `preparados-${estado.hoy}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const leerArchivo = async (archivos: FileList | null) => {
    const elegido = archivos?.[0];
    if (!elegido) return;
    setErrorImportar(null);
    const r = importarRespaldo(await elegido.text(), estado.idx);
    if (!r.ok) {
      setErrorImportar(ERROR_IMPORTACION[r.error] ?? "No se pudo leer el respaldo.");
      return;
    }
    setAConfirmar({ guardado: r.guardado, avisos: r.avisos });
  };

  return (
    <Seccion titulo="Perfil">
      <div className="tarjeta">
        <h2>Tu situación</h2>
        <label className="campo">
          <span className="rotulo">Entorno</span>
          <select value={usuario.perfil.entorno} onChange={(ev) => void cambiarPerfil({ entorno: ev.target.value })}>
            {catalogo.entornos.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span className="rotulo">Tipo de vivienda</span>
          <input
            type="text"
            value={usuario.perfil.vivienda ?? ""}
            placeholder="Departamento, casa, casa con terreno…"
            onChange={(ev) => void cambiarPerfil({ vivienda: ev.target.value })}
          />
        </label>

        <label className="campo">
          <span className="rotulo">Clima</span>
          <input
            type="text"
            value={usuario.perfil.clima ?? ""}
            placeholder="Templado, frío y seco, subtropical…"
            onChange={(ev) => void cambiarPerfil({ clima: ev.target.value })}
          />
        </label>

        <fieldset className="opciones">
          <legend className="rotulo">Escenarios</legend>
          {catalogo.escenarios.map((e) => (
            <label key={e.id} className="opcion">
              <input
                type="checkbox"
                checked={usuario.perfil.escenarios.includes(e.id)}
                onChange={() => alternarEscenario(e.id)}
              />
              <span>{e.nombre}</span>
            </label>
          ))}
        </fieldset>

        {guardado && <p className="nodo__dato">Guardado.</p>}
      </div>

      <div className="tarjeta">
        <h2>Tema</h2>
        <p className="rotulo" id="rotulo-tema">
          Cómo se ve la app
        </p>
        <div className="fila" role="group" aria-labelledby="rotulo-tema">
          {TEMAS.map((t) => (
            <button
              key={t.id}
              type="button"
              className="boton"
              aria-pressed={tema === t.id}
              onClick={() => cambiarTema(t.id)}
            >
              {t.titulo}
            </button>
          ))}
        </div>
      </div>

      <div className="tarjeta">
        <h2>Respaldo</h2>
        <p className="nodo__dato">
          Tus datos viven solo en este dispositivo. El respaldo es un archivo: guardalo donde quieras.
        </p>
        <div className="fila">
          <button type="button" className="boton" onClick={exportar}>
            Exportar
          </button>
          <button type="button" className="boton" onClick={() => archivo.current?.click()}>
            Importar
          </button>
        </div>
        <input
          ref={archivo}
          type="file"
          accept="application/json,.json"
          className="archivo"
          aria-label="Archivo de respaldo"
          onChange={(ev) => void leerArchivo(ev.target.files)}
        />
        {errorImportar && <p className="aviso error">{errorImportar}</p>}

        {aConfirmar && (
          <div className="tarjeta">
            <h3>¿Reemplazamos lo que tenés?</h3>
            <p className="nodo__dato">
              El respaldo es del {aConfirmar.guardado.actualizado.slice(0, 10)} y trae{" "}
              {aConfirmar.guardado.estado.logros.length} logros y {aConfirmar.guardado.estado.inventario.length}{" "}
              items. Lo que está guardado ahora se pierde.
            </p>
            {aConfirmar.avisos.length > 0 && (
              <ul className="lista-limpia">
                {aConfirmar.avisos.map((a) => (
                  <li key={a} className="alerta">
                    {a}
                  </li>
                ))}
              </ul>
            )}
            <div className="fila">
              <button
                type="button"
                className="boton boton--principal"
                onClick={async () => {
                  await tienda.reemplazar(aConfirmar.guardado);
                  setAConfirmar(null);
                }}
              >
                Reemplazar
              </button>
              <button type="button" className="boton" onClick={() => setAConfirmar(null)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="tarjeta">
        <h2>Borrar todo</h2>
        <p className="nodo__dato">Se van tus logros, tu inventario y tu perfil de este dispositivo. No hay vuelta atrás.</p>
        {borrando ? (
          <div className="fila">
            <button type="button" className="boton boton--principal" onClick={() => void tienda.borrarTodo()}>
              Sí, borrar todo
            </button>
            <button type="button" className="boton" onClick={() => setBorrando(false)}>
              No
            </button>
          </div>
        ) : (
          <button type="button" className="boton" onClick={() => setBorrando(true)}>
            Borrar mis datos
          </button>
        )}
      </div>

      {import.meta.env.DEV && (
        <p className="por-ahora">
          Solo en desarrollo: <a href="#/tema">ver el sistema visual</a>.
        </p>
      )}
    </Seccion>
  );
}
