import { describe, expect, it } from "vitest";
import { idDeYouTube, leerMarkdown, leerTrozos } from "../src/biblioteca/markdown";

describe("markdown de las guías", () => {
  it("separa títulos, párrafos y listas", () => {
    const bloques = leerMarkdown(
      ["# Potabilizar", "", "Hervir el agua", "un minuto.", "", "- Olla", "- Fuego", "", "1. Filtrar", "2. Hervir"].join(
        "\n",
      ),
    );
    expect(bloques.map((b) => b.tipo)).toEqual(["titulo", "parrafo", "lista", "lista"]);
    expect(bloques[0]).toEqual({ tipo: "titulo", nivel: 1, texto: [{ tipo: "texto", texto: "Potabilizar" }] });
    // Las líneas seguidas son un solo párrafo.
    expect(bloques[1]).toEqual({ tipo: "parrafo", texto: [{ tipo: "texto", texto: "Hervir el agua un minuto." }] });
    expect(bloques[2]).toMatchObject({ tipo: "lista", ordenada: false });
    expect(bloques[3]).toMatchObject({ tipo: "lista", ordenada: true });
  });

  it("lee negrita, cursiva, código y links", () => {
    expect(leerTrozos("Hervir **un minuto**, *a borbotones*, con `agua` y [fuente](https://ar.gov)")).toEqual([
      { tipo: "texto", texto: "Hervir " },
      { tipo: "fuerte", texto: "un minuto" },
      { tipo: "texto", texto: ", " },
      { tipo: "enfasis", texto: "a borbotones" },
      { tipo: "texto", texto: ", con " },
      { tipo: "codigo", texto: "agua" },
      { tipo: "texto", texto: " y " },
      { tipo: "link", texto: "fuente", url: "https://ar.gov" },
    ]);
  });

  it("un link que no es http queda como texto", () => {
    expect(leerTrozos("[ojo](javascript:alert(1))")).toEqual([
      { tipo: "texto", texto: "[ojo](javascript:alert(1))" },
    ]);
  });

  it("acepta los saltos de línea de Windows y el texto vacío", () => {
    expect(leerMarkdown("## Uno\r\n\r\nDos")).toHaveLength(2);
    expect(leerMarkdown("")).toEqual([]);
  });
});

describe("videos de YouTube", () => {
  it("saca el id de las formas habituales del link", () => {
    expect(idDeYouTube("https://www.youtube.com/watch?v=abc123XYZ")).toBe("abc123XYZ");
    expect(idDeYouTube("https://youtu.be/abc123XYZ?t=10")).toBe("abc123XYZ");
    expect(idDeYouTube("https://www.youtube.com/embed/abc123XYZ")).toBe("abc123XYZ");
    expect(idDeYouTube("https://vimeo.com/12345")).toBeNull();
  });
});
