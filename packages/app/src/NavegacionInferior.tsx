import { SECCIONES, type SeccionId } from "./rutas";

export function NavegacionInferior({ activa }: { activa: SeccionId | null }) {
  return (
    <nav className="navegacion" aria-label="Secciones">
      {SECCIONES.map((s) => (
        <a
          key={s.id}
          href={`#${s.ruta}`}
          className="tab"
          aria-current={s.id === activa ? "page" : undefined}
        >
          {s.titulo}
        </a>
      ))}
    </nav>
  );
}
