import type { EstadoUsuario } from "@preparados/dominio";

/** Versión del formato guardado. Subirla cuando cambie EstadoUsuario y agregar su migración. */
export const VERSION_ESQUEMA = 1;

/** Lo que se persiste en el dispositivo y lo que contiene un respaldo. */
export interface Guardado {
  esquema: number;
  /** Versión del catálogo con la que se guardó. */
  catalogoVersion: string;
  /** Fecha y hora ISO de la última escritura. */
  actualizado: string;
  estado: EstadoUsuario;
}

export function nuevoGuardado(estado: EstadoUsuario, catalogoVersion: string, ahora: Date = new Date()): Guardado {
  return { esquema: VERSION_ESQUEMA, catalogoVersion, actualizado: ahora.toISOString(), estado };
}
