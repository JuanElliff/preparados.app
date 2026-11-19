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

/** Marca el tema en el <html>. Sin marca, manda la preferencia del sistema. */
export function aplicarTema(tema: Tema): void {
  const raiz = globalThis.document?.documentElement;
  if (!raiz) return;
  if (tema === "sistema") delete raiz.dataset.tema;
  else raiz.dataset.tema = tema;

  // La barra del navegador y la pantalla de inicio usan theme-color: que siga al tema.
  const fondo = getComputedStyle(raiz).getPropertyValue("--fondo").trim();
  const meta = globalThis.document?.querySelector('meta[name="theme-color"]');
  if (fondo && meta) meta.setAttribute("content", fondo);
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
