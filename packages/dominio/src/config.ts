import type { MetodoVerificacion } from "./tipos";

/**
 * Parámetros de las reglas. Todos los valores son iniciales (spec v0.1)
 * y se calibran cuando estén los logros reales.
 */
export interface Config {
  /** XP base por profundidad en el árbol. Índice 0 = profundidad 1. Más profundo que la tabla = último valor. */
  xpPorProfundidad: number[];
  /** XP de un logro de equipo = este ratio × XP de una habilidad de igual profundidad. */
  ratioEquipo: number;
  /**
   * Tope del XP de equipo dentro de un dominio.
   * base "catalogo": ratio × XP máximo del dominio según el catálogo.
   * base "usuario": ratio × XP total que el usuario tiene en ese dominio.
   */
  topeEquipo: { ratio: number; base: "catalogo" | "usuario" };
  /** Proporción del XP base que otorga cada método. */
  multiplicadores: Record<MetodoVerificacion, number>;
  /** Curva de niveles: XP(n) = factorCurva · n · (n − 1). */
  factorCurva: number;
  /** Si es true, un item vencido no cuenta para cumplir logros (mecánica "vencido", propuesta de fase 2). */
  excluirItemsVencidos: boolean;
}

export const CONFIG_POR_DEFECTO: Config = {
  xpPorProfundidad: [10, 25, 50, 100],
  ratioEquipo: 0.25,
  topeEquipo: { ratio: 0.25, base: "catalogo" },
  multiplicadores: {
    autodeclaracion: 0.5,
    cuestionario: 1,
    // Fase 2: foto o video suma 50% hasta que exista revisión.
    foto_video: 0.5,
    // Fase 2: 100% + insignia. En Salud y Seguridad no suma XP: se controla con metodosPermitidos del logro.
    certificado: 1,
  },
  factorCurva: 25,
  excluirItemsVencidos: false,
};
