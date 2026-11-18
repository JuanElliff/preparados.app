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
    expect(catalogo.biblioteca).toHaveLength(3);
  });

  it("arma el cuestionario con id q-<logro>", () => {
    const { catalogo } = compilarCatalogo(CONTENIDO);
    const logro = catalogo.logros.find((l) => l.id === "agua-potabilizar");
    expect(logro?.cuestionario).toBe("q-agua-potabilizar");
    expect(catalogo.cuestionarios.find((q) => q.id === "q-agua-potabilizar")?.preguntas).toHaveLength(3);
  });

  it("lee la biblioteca: la guía toma el cuerpo del archivo y el video su URL", () => {
    const { catalogo } = compilarCatalogo(CONTENIDO);
    const guia = catalogo.biblioteca.find((e) => e.id === "agua-potabilizar-guia");
    expect(guia?.tipo).toBe("guia");
    expect(guia?.cuerpo).toMatch(/Guía de EJEMPLO/);
    expect(guia?.logros).toEqual(["agua-potabilizar"]);
    const video = catalogo.biblioteca.find((e) => e.id === "salud-botiquin-video");
    expect(video?.videoUrl).toMatch(/youtube\.com/);
  });

  it("ignora la plantilla de la biblioteca", () => {
    const { catalogo } = compilarCatalogo(CONTENIDO);
    expect(catalogo.biblioteca.some((e) => e.id === "dominio-tema-corto")).toBe(false);
  });

  it("el texto de un logro ahora es un error: va en biblioteca/", () => {
    const dir = copia();
    const ruta = join(dir, "logros/agua/agua-lluvia.md");
    writeFileSync(ruta, readFileSync(ruta, "utf8") + "\nUna guía que quedó en el logro.\n");
    expect(compilarCatalogo(dir).errores.join("\n")).toMatch(/agua-lluvia\.md: el texto de los logros se movió a biblioteca\//);
  });

  it("señala los campos que faltan en una entrada de biblioteca", () => {
    const dir = copia();
    writeFileSync(join(dir, "biblioteca/agua/agua-vacia.md"), "---\nid: agua-vacia\ndominio: agua\ntipo: guia\ntitulo: Sin cuerpo\n---\n");
    writeFileSync(join(dir, "biblioteca/agua/agua-video.md"), "---\nid: agua-video\ndominio: agua\ntipo: video\ntitulo: Sin URL\nresumen: Falta la URL.\n---\n");
    const errores = compilarCatalogo(dir).errores.join("\n");
    expect(errores).toMatch(/agua-vacia\.md: falta resumen/);
    expect(errores).toMatch(/agua-vacia\.md: una guía lleva el texto en Markdown después del ---/);
    expect(errores).toMatch(/agua-video\.md: un video lleva video con la URL/);
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
