import type { ReactNode } from "react";

/** Encabezado y cuerpo de una sección. Las pantallas se implementan en las órdenes siguientes. */
export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="seccion" aria-labelledby="titulo-seccion">
      <h1 id="titulo-seccion">{titulo}</h1>
      {children}
    </section>
  );
}

export function PorAhora({ children }: { children: ReactNode }) {
  return <p className="por-ahora">{children}</p>;
}
