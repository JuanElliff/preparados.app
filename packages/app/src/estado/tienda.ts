import { type Almacen, type Guardado, nuevoGuardado, reconciliar } from "@preparados/datos";
import {
  type Catalogo,
  type EstadoUsuario,
  type FechaISO,
  type Indice,
  indexar,
  type Resumen,
  resumir,
} from "@preparados/dominio";

/**
 * Estado de la app. No usa librería de estado: una tienda con suscriptores alcanza y se puede
 * reusar tal cual en React Native.
 */
export type EstadoApp =
  | { fase: "cargando" }
  | { fase: "error"; mensaje: string }
  | {
      fase: "listo";
      catalogo: Catalogo;
      idx: Indice;
      /** null = falta el onboarding: todavía no hay perfil guardado. */
      guardado: Guardado | null;
      /** null mientras no haya perfil. */
      resumen: Resumen | null;
      /** Lo que se descartó al ajustar el estado guardado a un catálogo más nuevo. */
      avisos: string[];
    };

export interface Dependencias {
  almacen: Almacen;
  cargarCatalogo: () => Promise<Catalogo>;
  /** Inyectable para los tests y para recalcular al cambiar el día. */
  hoy?: () => FechaISO;
}

export interface Tienda {
  obtener: () => EstadoApp;
  suscribir: (oyente: () => void) => () => void;
  /** Carga el catálogo y el estado guardado. Se llama una vez al arrancar. */
  iniciar: () => Promise<void>;
  /** Persiste un estado nuevo del usuario y recalcula el resumen. */
  guardar: (estado: EstadoUsuario) => Promise<void>;
  /** Vuelve a calcular el resumen con la fecha de hoy. */
  recalcular: () => void;
}

const hoyISO = (): FechaISO => new Date().toISOString().slice(0, 10);

export function crearTienda(deps: Dependencias): Tienda {
  const hoy = deps.hoy ?? hoyISO;
  let estado: EstadoApp = { fase: "cargando" };
  const oyentes = new Set<() => void>();

  const emitir = (nuevo: EstadoApp) => {
    estado = nuevo;
    for (const f of [...oyentes]) f();
  };

  const componer = (catalogo: Catalogo, idx: Indice, guardado: Guardado | null, avisos: string[]): EstadoApp => ({
    fase: "listo",
    catalogo,
    idx,
    guardado,
    resumen: guardado ? resumir(idx, guardado.estado, hoy()) : null,
    avisos,
  });

  const iniciar = async () => {
    try {
      const [catalogo, guardado] = await Promise.all([deps.cargarCatalogo(), deps.almacen.cargar()]);
      const idx = indexar(catalogo);
      if (!guardado) return emitir(componer(catalogo, idx, null, []));
      if (guardado.catalogoVersion === catalogo.version) return emitir(componer(catalogo, idx, guardado, []));

      // El catálogo cambió desde el último guardado: puede haber ids que ya no existen.
      const r = reconciliar(guardado.estado, idx);
      if ("error" in r) {
        return emitir(componer(catalogo, idx, null, ["el entorno guardado ya no existe: hay que elegirlo de nuevo"]));
      }
      const ajustado = nuevoGuardado(r.estado, catalogo.version);
      await deps.almacen.guardar(ajustado);
      emitir(componer(catalogo, idx, ajustado, r.avisos));
    } catch (e) {
      emitir({ fase: "error", mensaje: (e as Error).message });
    }
  };

  const guardar = async (nuevo: EstadoUsuario) => {
    const actual = estado;
    if (actual.fase !== "listo") throw new Error("la app todavía no terminó de cargar");
    const guardado = nuevoGuardado(nuevo, actual.catalogo.version);
    await deps.almacen.guardar(guardado);
    emitir(componer(actual.catalogo, actual.idx, guardado, actual.avisos));
  };

  const recalcular = () => {
    const actual = estado;
    if (actual.fase !== "listo") return;
    emitir(componer(actual.catalogo, actual.idx, actual.guardado, actual.avisos));
  };

  return {
    obtener: () => estado,
    suscribir: (oyente) => {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    iniciar,
    guardar,
    recalcular,
  };
}
