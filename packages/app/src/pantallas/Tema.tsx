import { TEMAS, useTema } from "../tema";

/** Página de referencia del sistema visual. Solo se monta en desarrollo (ver App.tsx). */

const COLORES = [
  ["--fondo", "Fondo de la app"],
  ["--superficie", "Tarjetas y barra inferior"],
  ["--superficie-alta", "Lo que queda por encima"],
  ["--borde", "Bordes y separadores"],
  ["--borde-suave", "Bordes de poco peso"],
  ["--texto", "Texto principal"],
  ["--texto-suave", "Texto secundario"],
  ["--acento", "Acento: lo disponible y lo logrado"],
  ["--acento-texto", "Texto sobre el acento"],
  ["--apagado", "Lo bloqueado"],
  ["--alerta", "Vencimientos"],
  ["--error", "Errores"],
  ["--exito", "Confirmaciones"],
] as const;

const ESTADOS = [
  { clase: "nodo--logrado", marca: "✓", titulo: "Potabilizar agua", dato: "Agua · 25 XP · logrado" },
  { clase: "nodo--disponible", marca: "II", titulo: "Juntar agua de lluvia", dato: "Agua · 25 XP · disponible" },
  { clase: "nodo--bloqueado", marca: "III", titulo: "Filtrar agua turbia", dato: "Agua · 50 XP · bloqueado" },
] as const;

export function PaginaTema() {
  const [tema, cambiarTema] = useTema();

  return (
    <section className="seccion">
      <h1>Sistema visual</h1>
      <p className="por-ahora">Referencia de desarrollo: colores, tipografías, botones y el nodo de logro.</p>

      <div className="tarjeta">
        <h2>Modo</h2>
        <div className="fila" role="group" aria-label="Modo del tema">
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
        <h2>Tipografía</h2>
        <p className="muestra-titulo">Preparados</p>
        <p className="rotulo">Rye · títulos. Nunca en tamaños chicos: se empasta.</p>
        <p>
          Bitter para el texto: descripciones, guías y cuestionarios. Acentos y eñes: áéíóú üñ ¿? ¡! 0123456789
        </p>
        <p className="rotulo">Rótulo en Bitter, mayúsculas y espaciado</p>
      </div>

      <div className="tarjeta">
        <h2>Colores</h2>
        <ul className="colores">
          {COLORES.map(([token, para]) => (
            <li key={token}>
              <span className="colores__muestra" style={{ background: `var(${token})` }} />
              <span className="colores__texto">
                <code>{token}</code>
                <span className="nodo__dato">{para}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="tarjeta">
        <h2>Botones</h2>
        <div className="fila">
          <button type="button" className="boton boton--principal">
            Lo sé hacer
          </button>
          <button type="button" className="boton">
            Hacer el cuestionario
          </button>
          <button type="button" className="boton" disabled>
            Bloqueado
          </button>
        </div>
      </div>

      <div className="tarjeta">
        <h2>Nodo de logro</h2>
        {ESTADOS.map((e) => (
          <button key={e.clase} type="button" className={`nodo ${e.clase}`}>
            <span className="nodo__marca">{e.marca}</span>
            <span className="nodo__texto">
              <span className="nodo__titulo">{e.titulo}</span>
              <span className="nodo__dato">{e.dato}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
