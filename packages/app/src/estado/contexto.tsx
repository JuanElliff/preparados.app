import { AlmacenIndexedDB } from "@preparados/datos";
import { createContext, type ReactNode, useContext, useEffect, useSyncExternalStore } from "react";
import { cargarCatalogo } from "./catalogo";
import { crearTienda, type EstadoApp, type Tienda } from "./tienda";

const Contexto = createContext<Tienda | null>(null);

/** La tienda real de la app: IndexedDB del dispositivo y el catálogo publicado. */
export const tiendaDelNavegador = (): Tienda => crearTienda({ almacen: new AlmacenIndexedDB(), cargarCatalogo });

export function ProveedorTienda({ tienda, children }: { tienda: Tienda; children: ReactNode }) {
  useEffect(() => {
    void tienda.iniciar();
  }, [tienda]);
  return <Contexto.Provider value={tienda}>{children}</Contexto.Provider>;
}

export function useTienda(): Tienda {
  const t = useContext(Contexto);
  if (!t) throw new Error("falta ProveedorTienda");
  return t;
}

export function useEstadoApp(): EstadoApp {
  const t = useTienda();
  return useSyncExternalStore(t.suscribir, t.obtener);
}
