import { hayQueAvisarDeInstalacion } from "./instalacion";

/**
 * En iPhone/iPad sin instalar: lo muestra el onboarding al terminar, y también Perfil, por si
 * en ese momento no se instaló. Null en cualquier otro caso (ver instalacion.ts).
 */
export function AvisoInstalacion() {
  if (!hayQueAvisarDeInstalacion()) return null;
  return (
    <div className="tarjeta">
      <h2>Agregala a tu pantalla de inicio</h2>
      <p>
        En iPhone y iPad, Safari borra los datos de un sitio que no usás en 7 días. Instalada, la app
        se queda con todo lo tuyo.
      </p>
      <p className="por-ahora">
        Tocá <strong>Compartir</strong> (el cuadrito con la flecha) y después <strong>Agregar a inicio</strong>.
      </p>
    </div>
  );
}
