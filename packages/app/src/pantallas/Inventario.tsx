import { PorAhora, Seccion } from "./Seccion";

export function Inventario() {
  return (
    <Seccion titulo="Inventario">
      <PorAhora>
        Acá van tus items con cantidad y vencimiento, las alertas y los logros de equipo con lo que les falta.
      </PorAhora>
    </Seccion>
  );
}
