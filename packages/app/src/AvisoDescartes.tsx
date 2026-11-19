import { useState } from "react";

/**
 * Cuando el catálogo cambió desde el último guardado, la tienda reconcilia el estado del usuario
 * y descarta lo que ya no existe (escenarios, logros, items). Esto es lo único que avisa de eso:
 * sin acá, el usuario nunca se entera de qué perdió.
 */
export function AvisoDescartes({ avisos }: { avisos: string[] }) {
  const [visto, setVisto] = useState(false);

  if (avisos.length === 0 || visto) return null;

  return (
    <div className="banner-aviso" role="status">
      <p>El catálogo cambió desde la última vez. Se ajustó lo que tenías guardado:</p>
      <ul className="lista-limpia">
        {avisos.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <button type="button" className="boton" onClick={() => setVisto(true)}>
        Entendido
      </button>
    </div>
  );
}
