import { PorAhora, Seccion } from "./Seccion";

export function Inicio() {
  return (
    <Seccion titulo="Inicio">
      <PorAhora>
        Acá van el % de preparación por escenario, el nivel y el XP de cada dominio, tres recomendaciones y las
        alertas de vencimiento.
      </PorAhora>
    </Seccion>
  );
}
