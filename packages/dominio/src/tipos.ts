// Formato del catálogo (contenido curado, igual para todos) y del estado del usuario (local en el MVP).

export type DominioId = string;
export type LogroId = string;
export type ItemId = string;
export type EntornoId = string;
export type EscenarioId = string;
export type CuestionarioId = string;
export type EntradaBibliotecaId = string;

/** Fecha ISO "YYYY-MM-DD". */
export type FechaISO = string;

export type TipoLogro = "habilidad" | "equipo";

export type TipoEntradaBiblioteca = "guia" | "video";

/** Métodos del MVP: autodeclaracion y cuestionario. foto_video y certificado son de fase 2. */
export type MetodoVerificacion = "autodeclaracion" | "cuestionario" | "foto_video" | "certificado";

export type EstadoLogro = "logrado" | "disponible" | "bloqueado";

/** Peso por dominio, 0..1. Un dominio ausente pesa 0. */
export type PesosPorDominio = Record<DominioId, number>;

// ---------- Catálogo ----------

export interface Dominio {
  id: DominioId;
  nombre: string;
  orden: number;
}

export interface ItemRequerido {
  item: ItemId;
  cantidad: number;
}

export interface Logro {
  id: LogroId;
  dominio: DominioId;
  tipo: TipoLogro;
  titulo: string;
  descripcion: string;
  /** 1 = raíz del árbol. Define el XP base salvo que se indique xpBase. */
  profundidad: number;
  /** Opcional: reemplaza el XP base que sale de la profundidad. */
  xpBase?: number;
  prerrequisitos: LogroId[];
  /**
   * Equipo: el logro se cumple solo cuando el inventario tiene estos items.
   * Habilidad: los items son prerrequisito para que el logro esté disponible.
   */
  itemsRequeridos: ItemRequerido[];
  /** Solo para habilidades. Los logros de equipo se derivan del inventario. */
  metodosPermitidos: MetodoVerificacion[];
  cuestionario?: CuestionarioId;
}

export interface Item {
  id: ItemId;
  nombre: string;
  categoria: string;
  vence: boolean;
}

export interface Entorno {
  id: EntornoId;
  nombre: string;
  pesos: PesosPorDominio;
}

export interface Escenario {
  id: EscenarioId;
  nombre: string;
  pesos: PesosPorDominio;
}

export interface Pregunta {
  enunciado: string;
  opciones: string[];
  /** Índice de la opción correcta. */
  correcta: number;
}

export interface Cuestionario {
  id: CuestionarioId;
  logro: LogroId;
  preguntas: Pregunta[];
  /** Proporción mínima de respuestas correctas para aprobar, 0..1. */
  umbralAprobacion: number;
}

/**
 * Una entrada de la biblioteca "Aprendé". Es contenido aparte de los logros:
 * no se verifica ni da XP, solo se lee o se mira.
 */
export interface EntradaBiblioteca {
  id: EntradaBibliotecaId;
  dominio: DominioId;
  tipo: TipoEntradaBiblioteca;
  titulo: string;
  resumen: string;
  /** Markdown. Obligatorio si es guía. */
  cuerpo?: string;
  /** Obligatorio si es video. */
  videoUrl?: string;
  /** Logros relacionados, para ir y venir entre el camino y la biblioteca. */
  logros: LogroId[];
}

export interface Catalogo {
  version: string;
  dominios: Dominio[];
  logros: Logro[];
  items: Item[];
  entornos: Entorno[];
  escenarios: Escenario[];
  cuestionarios: Cuestionario[];
  biblioteca: EntradaBiblioteca[];
}

// ---------- Estado del usuario ----------

export interface Perfil {
  entorno: EntornoId;
  vivienda?: string;
  clima?: string;
  escenarios: EscenarioId[];
}

export interface UsuarioLogro {
  logro: LogroId;
  metodo: MetodoVerificacion;
  fecha: FechaISO;
}

export interface InventarioItem {
  item: ItemId;
  cantidad: number;
  vencimiento?: FechaISO;
}

export interface EstadoUsuario {
  perfil: Perfil;
  logros: UsuarioLogro[];
  inventario: InventarioItem[];
}
