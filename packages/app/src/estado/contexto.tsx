import { AlmacenIndexedDB } from "@preparados/datos";
import { createContext, type ReactNode, useContext, useEffect, useSyncExternalStore } from "react";
import { cargarCatalogo } from "./catalogo";
import { crearTienda, type EstadoApp, type Tienda } from "./tienda";

const Contexto = createContext<Tienda | null>(null);

/** La tienda real de la app: IndexedDB del dispositivo y el catálogo publicado. */
export const tiendaDelNavegador = (): Tienda => crearTienda({ almacen: new AlmacenIndexedDB(), cargarCatalogo });

/**
 * Cada cuánto recalcular por las dudas, para no quedar con alertas o estados de un día viejo si la
 * app queda abierta mucho tiempo. Al volver a la pestaña se recalcula al toque, sin esperar esto.
 */
const RECALCULAR_CADA_MS = 5 * 60 * 1000;

export function ProveedorTienda({ tienda, children }: { tienda: Tienda; children: ReactNode }) {
  useEffect(() => {
    void tienda.iniciar();
  }, [tienda]);

  // La fecha se fija al cargar: sin esto, si la app queda abierta y pasa la medianoche, las
  // alertas de vencimiento y los estados de los logros quedan calculados con el día viejo.
  useEffect(() => {
    const intervalo = globalThis.setInterval(() => tienda.recalcular(), RECALCULAR_CADA_MS);
    const alVolverVisible = () => {
      if (globalThis.document?.visibilityState === "visible") tienda.recalcular();
    };
    globalThis.document?.addEventListener("visibilitychange", alVolverVisible);
    return () => {
      globalThis.clearInterval(intervalo);
      globalThis.document?.removeEventListener("visibilitychange", alVolverVisible);
    };
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
