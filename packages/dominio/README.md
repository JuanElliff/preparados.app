# @preparados/dominio

Reglas de Preparados.app en TypeScript puro, sin dependencias de UI. Es la parte que se reutiliza al migrar de la PWA a React Native.

```bash
npm install          # desde la raíz del repo
npm test             # vitest
npm run typecheck    # tsc --noEmit
```

## Uso

```ts
import { indexar, validarCatalogo, resumir, declararLogro, aprobarCuestionario, CONFIG_POR_DEFECTO } from "@preparados/dominio";

const errores = validarCatalogo(catalogo);   // [] = válido
const idx = indexar(catalogo);
const r = resumir(idx, estadoUsuario, "2026-11-18");
// r.estados, r.xp, r.niveles, r.pesos, r.preparacion, r.recomendaciones, r.rutaInicial, r.alertas
```

Las acciones (`declararLogro`, `aprobarCuestionario`) devuelven un estado nuevo y no modifican el recibido.

## Formato del catálogo

Un JSON con `dominios`, `logros`, `items`, `entornos`, `escenarios` y `cuestionarios`. Los tipos están en `src/tipos.ts` y el ejemplo en `test/fixtures/catalogo-ejemplo.json` (contenido inventado, solo para tests).

- Un logro de **equipo** se cumple solo, con el inventario (`itemsRequeridos`), y no lleva `metodosPermitidos`.
- Un logro de **habilidad** puede pedir items como prerrequisito para estar disponible.
- Qué métodos acepta cada logro se define en el catálogo. Por ejemplo, Salud solo con `cuestionario`.

## Decisiones provisorias en el código

Todas están en `src/config.ts` o marcadas en el código:

| Tema | Valor actual |
| --- | --- |
| XP por profundidad | 10 / 25 / 50 / 100 |
| Equipo | 25% de una habilidad de igual profundidad |
| Tope de equipo | 25% del XP del dominio según el catálogo (`base: "catalogo"`; alternativa `"usuario"`) |
| Multiplicadores | autodeclaración 0,5 · cuestionario 1 · foto/video 0,5 · certificado 1 |
| Curva | XP(n) = 25 · n · (n − 1) |
| Items vencidos | cuentan (`excluirItemsVencidos: false`) |
| Sin escenarios elegidos | peso = solo el del entorno |
| Desempate de recomendaciones | orden del catálogo |
| Ruta inicial | logros disponibles de profundidad 1, por peso |
| Alertas de vencimiento | 30 días de anticipación |
| Equipo con prerrequisitos pendientes | bloqueado aunque se tenga el item |
