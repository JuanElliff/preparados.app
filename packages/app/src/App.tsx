import { useEstadoApp } from "./estado/contexto";
import { NavegacionInferior } from "./NavegacionInferior";
import { Aprende } from "./pantallas/Aprende";
import { Camino } from "./pantallas/Camino";
import { Inicio } from "./pantallas/Inicio";
import { Inventario } from "./pantallas/Inventario";
import { Perfil } from "./pantallas/Perfil";
import { PaginaTema } from "./pantallas/Tema";
import { SECCIONES, type SeccionId, seccionDeRuta, useRuta } from "./rutas";

const PANTALLAS: Record<SeccionId, () => React.JSX.Element> = {
  inicio: Inicio,
  camino: Camino,
  inventario: Inventario,
  aprende: Aprende,
  perfil: Perfil,
};

export function App() {
  const ruta = useRuta();
  const estado = useEstadoApp();
  const Pantalla = PANTALLAS[seccionDeRuta(ruta).id];
  const activa = SECCIONES.find((s) => s.ruta === ruta)?.id ?? null;
  // La página del sistema visual existe solo en desarrollo y no depende del catálogo.
  const enTema = import.meta.env.DEV && ruta === "/tema";

  return (
    <div className="app">
      <main className="contenido">
        {enTema ? (
          <PaginaTema />
        ) : (
          <>
            {estado.fase === "cargando" && <p className="aviso">Cargando…</p>}
            {estado.fase === "error" && <p className="aviso error">No se pudo cargar la app: {estado.mensaje}</p>}
            {estado.fase === "listo" && <Pantalla />}
          </>
        )}
      </main>
      <NavegacionInferior activa={activa} />
    </div>
  );
}
