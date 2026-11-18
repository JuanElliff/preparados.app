import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { compilarCatalogo } from "../src/compilar";

const CONTENIDO = resolve(__dirname, "../../../contenido");

/** Copia la carpeta de contenido a un directorio temporal para romperla sin tocar la real. */
function copia(): string {
  const dir = mkdtempSync(join(tmpdir(), "contenido-"));
  cpSync(CONTENIDO, dir, { recursive: true });
  return dir;
}

describe("compilarCatalogo", () => {
  it("la carpeta contenido/ compila sin errores", () => {
    const { catalogo, errores } = compilarCatalogo(CONTENIDO);
    expect(errores).toEqual([]);
    expect(catalogo.dominios.map((d) => d.id)).toEqual(["agua", "comida", "salud"]);
    expect(catalogo.logros).toHaveLength(10);
  });

  it("arma el cuestionario con id q-<logro> y la guía desde el cuerpo del archivo", () => {
    const { catalogo } = compilarCatalogo(CONTENIDO);
    const logro = catalogo.logros.find((l) => l.id === "agua-potabilizar");
    expect(logro?.cuestionario).toBe("q-agua-potabilizar");
    expect(logro?.guia).toMatch(/Guía de EJEMPLO/);
    expect(catalogo.cuestionarios.find((q) => q.id === "q-agua-potabilizar")?.preguntas).toHaveLength(3);
  });

  it("ignora la plantilla", () => {
    const { catalogo } = compilarCatalogo(CONTENIDO);
    expect(catalogo.logros.some((l) => l.id === "dominio-nombre-corto")).toBe(false);
  });

  it("acepta archivos con saltos de línea de Windows", () => {
    const dir = copia();
    const ruta = join(dir, "logros/agua/agua-lluvia.md");
    writeFileSync(ruta, readFileSync(ruta, "utf8").replace(/\n/g, "\r\n"));
    expect(compilarCatalogo(dir).errores).toEqual([]);
  });

  it("señala el archivo y el campo con problemas", () => {
    const dir = copia();
    writeFileSync(join(dir, "logros/agua/agua-nuevo.md"), "---\nid: otro-id\ndominio: agua\ntipo: magia\n---\n");
    const errores = compilarCatalogo(dir).errores.join("\n");
    expect(errores).toMatch(/agua-nuevo\.md: el archivo tiene que llamarse otro-id\.md/);
    expect(errores).toMatch(/agua-nuevo\.md: tipo tiene que ser habilidad o equipo/);
    expect(errores).toMatch(/agua-nuevo\.md: falta titulo/);
  });

  it("aplica las reglas del dominio: prerrequisito inexistente", () => {
    const dir = copia();
    const ruta = join(dir, "logros/agua/agua-lluvia.md");
    writeFileSync(ruta, readFileSync(ruta, "utf8").replace("- agua-potabilizar", "- agua-inexistente"));
    expect(compilarCatalogo(dir).errores.join("\n")).toMatch(/prerrequisito inexistente agua-inexistente/);
  });
});
