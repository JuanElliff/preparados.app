import {
  type Almacen,
  type Guardado,
  nuevoGuardado,
  pedirAlmacenamientoPersistente,
  reconciliar,
} from "@preparados/datos";
import {
  aprobarCuestionario,
  type Catalogo,
  CONFIG_POR_DEFECTO,
  type Correccion,
  declararLogro,
  type DominioId,
  type ErrorDeclaracion,
  type EstadoUsuario,
  type FechaISO,
  type Indice,
  indexar,
  type LogroId,
  type MetodoVerificacion,
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
      /** La fecha con la que se calculó el resumen: las pantallas usan la misma. */
      hoy: FechaISO;
    };

/** Lo que devuelve una acción sobre un logro, listo para que la pantalla muestre qué pasó. */
export type ResultadoAccion =
  | { ok: true; subioNivel: { dominio: DominioId; nivel: number } | null; correccion?: Correccion }
  | { ok: false; error: ErrorDeclaracion | "sin_perfil"; correccion?: Correccion };

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
  /** "Lo sé hacer": registra el logro con autodeclaración (la mitad del XP). */
  declarar: (logro: LogroId, metodo: Exclude<MetodoVerificacion, "cuestionario">) => Promise<ResultadoAccion>;
  /** Corrige el cuestionario y, si aprueba, registra el logro con el XP completo. */
  responderCuestionario: (logro: LogroId, respuestas: number[]) => Promise<ResultadoAccion>;
  /** Reemplaza todo lo guardado. Lo usa la importación de un respaldo. */
  reemplazar: (guardado: Guardado) => Promise<void>;
  /** Borra los datos del dispositivo y vuelve a la bienvenida. */
  borrarTodo: () => Promise<void>;
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
    hoy: hoy(),
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

  /**
   * Corre una acción del dominio sobre el estado guardado, la persiste si salió bien
   * y avisa si el dominio subió de nivel.
   */
  const aplicar = async (
    logro: LogroId,
    accion: (idx: Indice, estado: EstadoUsuario, fecha: FechaISO) => {
      ok: boolean;
      estado?: EstadoUsuario;
      error?: ErrorDeclaracion;
      correccion?: Correccion;
    },
  ): Promise<ResultadoAccion> => {
    const actual = estado;
    if (actual.fase !== "listo") throw new Error("la app todavía no terminó de cargar");
    const base = actual.guardado?.estado;
    if (!base) return { ok: false, error: "sin_perfil" };

    const fecha = hoy();
    const r = accion(actual.idx, base, fecha);
    if (!r.ok || !r.estado) {
      return { ok: false, error: r.error ?? "logro_inexistente", ...(r.correccion && { correccion: r.correccion }) };
    }

    // Con el primer logro ya hay algo que perder: se le pide al navegador que no lo borre.
    if (base.logros.length === 0 && r.estado.logros.length > 0) void pedirAlmacenamientoPersistente();

    const dominio = actual.idx.logros.get(logro)?.dominio;
    const nivelAntes = dominio ? (actual.resumen?.niveles.get(dominio)?.nivel ?? 0) : 0;

    const guardado = nuevoGuardado(r.estado, actual.catalogo.version);
    await deps.almacen.guardar(guardado);
    const nuevo = componer(actual.catalogo, actual.idx, guardado, actual.avisos);
    emitir(nuevo);

    const nivelDespues =
      dominio && nuevo.fase === "listo" ? (nuevo.resumen?.niveles.get(dominio)?.nivel ?? 0) : nivelAntes;
    return {
      ok: true,
      subioNivel: dominio && nivelDespues > nivelAntes ? { dominio, nivel: nivelDespues } : null,
      ...(r.correccion && { correccion: r.correccion }),
    };
  };

  const declarar = (logro: LogroId, metodo: Exclude<MetodoVerificacion, "cuestionario">) =>
    aplicar(logro, (idx, base, fecha) => declararLogro(idx, base, logro, metodo, fecha, fecha, CONFIG_POR_DEFECTO));

  const responderCuestionario = (logro: LogroId, respuestas: number[]) =>
    aplicar(logro, (idx, base, fecha) =>
      aprobarCuestionario(idx, base, logro, respuestas, fecha, fecha, CONFIG_POR_DEFECTO),
    );

  const reemplazar = async (guardado: Guardado) => {
    const actual = estado;
    if (actual.fase !== "listo") throw new Error("la app todavía no terminó de cargar");
    await deps.almacen.guardar(guardado);
    emitir(componer(actual.catalogo, actual.idx, guardado, []));
  };

  const borrarTodo = async () => {
    const actual = estado;
    if (actual.fase !== "listo") throw new Error("la app todavía no terminó de cargar");
    await deps.almacen.borrar();
    emitir(componer(actual.catalogo, actual.idx, null, []));
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
    declarar,
    responderCuestionario,
    reemplazar,
    borrarTodo,
    recalcular,
  };
}
