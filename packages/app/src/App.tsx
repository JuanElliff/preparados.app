import { useEffect } from "react";
import { useEstadoApp } from "./estado/contexto";
import { NavegacionInferior } from "./NavegacionInferior";
import { Aprende } from "./pantallas/Aprende";
import { Camino } from "./pantallas/Camino";
import { Inicio } from "./pantallas/Inicio";
import { Inventario } from "./pantallas/Inventario";
import { Onboarding } from "./pantallas/Onboarding";
import { Perfil } from "./pantallas/Perfil";
import { PaginaTema } from "./pantallas/Tema";
import { irA, RUTA_BIENVENIDA, RUTA_TEMA, SECCIONES, type SeccionId, seccionDeRuta, useRuta } from "./rutas";

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
  const enTema = import.meta.env.DEV && ruta === RUTA_TEMA;
  const enBienvenida = ruta === RUTA_BIENVENIDA;
  const faltaPerfil = estado.fase === "listo" && estado.guardado === null;

  // Primera apertura: sin perfil no hay nada que mostrar, así que arranca el onboarding.
  useEffect(() => {
    if (faltaPerfil && !enBienvenida && !enTema) irA(RUTA_BIENVENIDA);
  }, [faltaPerfil, enBienvenida, enTema]);

  return (
    <div className="app">
      <main className="contenido">
        {enTema && <PaginaTema />}
        {!enTema && estado.fase === "cargando" && <p className="aviso">Cargando…</p>}
        {!enTema && estado.fase === "error" && (
          <p className="aviso error">No se pudo cargar la app: {estado.mensaje}</p>
        )}
        {!enTema && estado.fase === "listo" && (enBienvenida ? <Onboarding /> : <Pantalla />)}
      </main>
      {!enBienvenida && <NavegacionInferior activa={activa} />}
    </div>
  );
}
