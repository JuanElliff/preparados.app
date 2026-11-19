/**
 * Lector del subconjunto de Markdown que usan las guías de la biblioteca.
 * Devuelve bloques, que la pantalla dibuja con elementos de React: nunca se inyecta HTML.
 *
 * Soporta: títulos (#, ##, ###), párrafos, listas con "-" y con "1.", **negrita**,
 * *cursiva*, `código` y [texto](url). Lo que no entra en eso se lee como texto.
 */

export type Trozo =
  | { tipo: "texto"; texto: string }
  | { tipo: "fuerte"; texto: string }
  | { tipo: "enfasis"; texto: string }
  | { tipo: "codigo"; texto: string }
  | { tipo: "link"; texto: string; url: string };

export type Bloque =
  | { tipo: "titulo"; nivel: 1 | 2 | 3; texto: Trozo[] }
  | { tipo: "parrafo"; texto: Trozo[] }
  | { tipo: "lista"; ordenada: boolean; items: Trozo[][] };

const EN_LINEA = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Solo links http(s): el contenido es curado, pero un javascript: no entra nunca. */
const urlSegura = (url: string) => /^https?:\/\//i.test(url);

export function leerTrozos(linea: string): Trozo[] {
  const trozos: Trozo[] = [];
  let desde = 0;
  for (const m of linea.matchAll(EN_LINEA)) {
    const i = m.index ?? 0;
    if (i > desde) trozos.push({ tipo: "texto", texto: linea.slice(desde, i) });
    const [todo, fuerte, enfasis, codigo, textoLink, url] = m;
    if (fuerte !== undefined) trozos.push({ tipo: "fuerte", texto: fuerte });
    else if (enfasis !== undefined) trozos.push({ tipo: "enfasis", texto: enfasis });
    else if (codigo !== undefined) trozos.push({ tipo: "codigo", texto: codigo });
    else if (textoLink !== undefined && url !== undefined) {
      if (urlSegura(url)) trozos.push({ tipo: "link", texto: textoLink, url });
      else trozos.push({ tipo: "texto", texto: todo });
    }
    desde = i + todo.length;
  }
  if (desde < linea.length) trozos.push({ tipo: "texto", texto: linea.slice(desde) });

  // Dos textos seguidos (por ejemplo, lo que quedó de un link descartado) van como uno solo.
  return trozos.reduce<Trozo[]>((juntos, t) => {
    const previo = juntos.at(-1);
    if (t.tipo === "texto" && previo?.tipo === "texto") previo.texto += t.texto;
    else juntos.push({ ...t });
    return juntos;
  }, []);
}

const TITULO = /^(#{1,3})\s+(.*)$/;
const VINETA = /^[-*]\s+(.*)$/;
const NUMERADA = /^\d+[.)]\s+(.*)$/;

export function leerMarkdown(texto: string): Bloque[] {
  const lineas = texto.replace(/\r\n/g, "\n").split("\n");
  const bloques: Bloque[] = [];
  let i = 0;

  while (i < lineas.length) {
    const linea = lineas[i] ?? "";
    if (linea.trim() === "") {
      i++;
      continue;
    }

    const titulo = TITULO.exec(linea);
    if (titulo?.[1] && titulo[2] !== undefined) {
      bloques.push({ tipo: "titulo", nivel: titulo[1].length as 1 | 2 | 3, texto: leerTrozos(titulo[2]) });
      i++;
      continue;
    }

    const ordenada = NUMERADA.test(linea);
    if (ordenada || VINETA.test(linea)) {
      const items: Trozo[][] = [];
      while (i < lineas.length) {
        const actual = lineas[i] ?? "";
        const m = ordenada ? NUMERADA.exec(actual) : VINETA.exec(actual);
        if (!m?.[1]) break;
        items.push(leerTrozos(m[1]));
        i++;
      }
      bloques.push({ tipo: "lista", ordenada, items });
      continue;
    }

    // Párrafo: líneas seguidas hasta una vacía o hasta que empiece otro bloque.
    const juntas: string[] = [];
    while (i < lineas.length) {
      const actual = lineas[i] ?? "";
      if (actual.trim() === "" || TITULO.test(actual) || VINETA.test(actual) || NUMERADA.test(actual)) break;
      juntas.push(actual.trim());
      i++;
    }
    bloques.push({ tipo: "parrafo", texto: leerTrozos(juntas.join(" ")) });
  }

  return bloques;
}

/** Id del video de YouTube, de cualquiera de las formas en que se copia el link. */
export function idDeYouTube(url: string): string | null {
  const m =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(url) ?? null;
  return m?.[1] ?? null;
}
