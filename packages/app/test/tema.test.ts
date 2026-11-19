import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Se lee el archivo de tema tal cual: lo que importa es lo que termina en el navegador.
const css = readFileSync(resolve(process.cwd(), "src/tema.css"), "utf8");

/** Los valores de un bloque del archivo de tema, por ejemplo el de :root o el del modo oscuro. */
function tokens(desde: string): Record<string, string> {
  const i = css.indexOf(desde);
  if (i < 0) throw new Error(`no encontré el bloque ${desde}`);
  const bloque = css.slice(i, css.indexOf("}", i));
  const valores: Record<string, string> = {};
  for (const linea of bloque.split("\n")) {
    const m = /^\s*(--[a-z-]+):\s*(#[0-9a-f]{6});/.exec(linea);
    if (m?.[1] && m[2]) valores[m[1]] = m[2];
  }
  return valores;
}

const luminancia = (hex: string): number => {
  const canales = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, v = 0, a = 0] = canales.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * v + 0.0722 * a;
};

const contraste = (uno: string, otro: string): number => {
  const [a, b] = [luminancia(uno), luminancia(otro)].sort((x, y) => y - x);
  return ((a ?? 0) + 0.05) / ((b ?? 0) + 0.05);
};

/** Texto sobre la superficie donde se usa. El mínimo de la spec es 4,5:1. */
const PARES: Array<[string, string]> = [
  ["--texto", "--fondo"],
  ["--texto", "--superficie"],
  ["--texto", "--superficie-alta"],
  ["--texto-suave", "--fondo"],
  ["--texto-suave", "--superficie"],
  ["--texto-suave", "--superficie-alta"],
  ["--apagado", "--fondo"],
  ["--apagado", "--superficie"],
  ["--acento", "--fondo"],
  ["--acento", "--superficie"],
  ["--alerta", "--fondo"],
  ["--alerta", "--superficie"],
  ["--error", "--fondo"],
  ["--error", "--superficie"],
  ["--exito", "--fondo"],
  ["--exito", "--superficie"],
  ["--acento-texto", "--acento"],
];

const MODOS = {
  claro: tokens(":root {"),
  oscuro: tokens(':root[data-tema="oscuro"] {'),
};

describe("tema", () => {
  for (const [modo, valores] of Object.entries(MODOS)) {
    it(`modo ${modo}: todo el texto llega a 4,5:1`, () => {
      const flojos = PARES.filter(([frente, fondo]) => {
        const a = valores[frente];
        const b = valores[fondo];
        if (!a || !b) throw new Error(`falta ${frente} o ${fondo} en el modo ${modo}`);
        return contraste(a, b) < 4.5;
      }).map(([frente, fondo]) => {
        const r = contraste(valores[frente] as string, valores[fondo] as string);
        return `${frente} sobre ${fondo}: ${r.toFixed(2)}:1`;
      });
      expect(flojos).toEqual([]);
    });
  }

  it("el modo oscuro del sistema define los mismos colores que el elegido a mano", () => {
    const sistema = tokens(':root:not([data-tema="claro"]) {');
    expect(sistema).toEqual(MODOS.oscuro);
  });
});
