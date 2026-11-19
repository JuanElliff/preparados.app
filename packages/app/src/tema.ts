import { useState } from "react";

/** "sistema" sigue la preferencia del dispositivo; las otras dos la pisan desde Perfil. */
export type Tema = "sistema" | "claro" | "oscuro";

export const TEMAS: Array<{ id: Tema; titulo: string }> = [
  { id: "sistema", titulo: "Sistema" },
  { id: "claro", titulo: "Claro" },
  { id: "oscuro", titulo: "Oscuro" },
];

const CLAVE = "preparados:tema";

/** Es una preferencia del dispositivo, no del usuario: no va al respaldo. */
export function temaGuardado(): Tema {
  try {
    const v = globalThis.localStorage?.getItem(CLAVE);
    return v === "claro" || v === "oscuro" ? v : "sistema";
  } catch {
    return "sistema";
  }
}

/** id del <meta name="theme-color"> que agrega un tema elegido a mano. */
const ID_META_ELEGIDO = "theme-color-elegido";

/**
 * Marca el tema en el <html>. Sin marca, manda la preferencia del sistema: index.html ya trae un
 * <meta name="theme-color"> por cada modo (con media query), así la barra acierta desde el primer
 * pintado. Acá solo hace falta agregar un tercero cuando el tema se elige a mano, para que pise a
 * esos dos sea cual sea la preferencia del sistema; y sacarlo al volver a "sistema".
 */
export function aplicarTema(tema: Tema): void {
  const raiz = globalThis.document?.documentElement;
  if (!raiz) return;
  if (tema === "sistema") delete raiz.dataset.tema;
  else raiz.dataset.tema = tema;

  const doc = globalThis.document;
  if (!doc) return;
  if (tema === "sistema") {
    doc.getElementById(ID_META_ELEGIDO)?.remove();
    return;
  }

  const fondo = getComputedStyle(raiz).getPropertyValue("--fondo").trim();
  if (!fondo) return;
  let meta = doc.getElementById(ID_META_ELEGIDO);
  if (!meta) {
    meta = doc.createElement("meta");
    meta.id = ID_META_ELEGIDO;
    meta.setAttribute("name", "theme-color");
    doc.head.appendChild(meta);
  }
  meta.setAttribute("content", fondo);
}

export function elegirTema(tema: Tema): void {
  aplicarTema(tema);
  try {
    globalThis.localStorage?.setItem(CLAVE, tema);
  } catch {
    // Sin localStorage (modo privado viejo de iOS) el tema vale solo para esta sesión.
  }
}

export function useTema(): [Tema, (tema: Tema) => void] {
  const [tema, setTema] = useState(temaGuardado);
  return [
    tema,
    (nuevo: Tema) => {
      elegirTema(nuevo);
      setTema(nuevo);
    },
  ];
}
