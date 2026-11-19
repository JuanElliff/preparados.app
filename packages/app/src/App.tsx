import { useEstadoApp } from "./estado/contexto";
import { NavegacionInferior } from "./NavegacionInferior";
import { Aprende } from "./pantallas/Aprende";
import { Camino } from "./pantallas/Camino";
import { Inicio } from "./pantallas/Inicio";
import { Inventario } from "./pantallas/Inventario";
import { Perfil } from "./pantallas/Perfil";
import { type SeccionId, seccionDeRuta, useRuta } from "./rutas";

const PANTALLAS: Record<SeccionId, () => React.JSX.Element> = {
  inicio: Inicio,
  camino: Camino,
  inventario: Inventario,
  aprende: Aprende,
  perfil: Perfil,
};

export function App() {
  const seccion = seccionDeRuta(useRuta());
  const estado = useEstadoApp();
  const Pantalla = PANTALLAS[seccion.id];

  return (
    <div className="app">
      <main className="contenido">
        {estado.fase === "cargando" && <p className="aviso">Cargando…</p>}
        {estado.fase === "error" && <p className="aviso error">No se pudo cargar la app: {estado.mensaje}</p>}
        {estado.fase === "listo" && <Pantalla />}
      </main>
      <NavegacionInferior activa={seccion.id} />
    </div>
  );
}
