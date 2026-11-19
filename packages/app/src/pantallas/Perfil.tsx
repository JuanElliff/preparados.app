import { TEMAS, useTema } from "../tema";
import { PorAhora, Seccion } from "./Seccion";

export function Perfil() {
  const [tema, cambiarTema] = useTema();

  return (
    <Seccion titulo="Perfil">
      <PorAhora>Acá van tu entorno, vivienda, clima y escenarios, y el respaldo exportable.</PorAhora>

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

      {import.meta.env.DEV && (
        <p className="por-ahora">
          Solo en desarrollo: <a href="#/tema">ver el sistema visual</a>.
        </p>
      )}
    </Seccion>
  );
}
