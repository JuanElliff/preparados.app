# Contenido de Preparados.app

Todo el catálogo se escribe acá, en YAML y Markdown. La app no lee estos archivos directamente: se compilan a un JSON y se validan.

```bash
cd packages/catalogo
npm run compilar      # contenido/ → packages/catalogo/dist/catalogo.json
```

Si hay errores, el comando los lista con archivo y campo, y no genera el JSON.

## Archivos

| Archivo | Qué tiene |
| --- | --- |
| `catalogo.yaml` | Versión del catálogo. Subirla en cada cambio publicado |
| `dominios.yaml` | Dominios y su orden |
| `items.yaml` | Equipo que se puede registrar en el inventario |
| `entornos.yaml` | Entornos y el peso de cada dominio (0 a 1) |
| `escenarios.yaml` | Escenarios y el peso de cada dominio (0 a 1) |
| `logros/<dominio>/<id>.md` | Un archivo por logro: datos arriba, guía de "Aprendé" abajo |

Para un logro nuevo: copiar `logros/_plantilla.md`. Los archivos que empiezan con `_` se ignoran.

## Reglas

- **Los ids son permanentes.** No se renombran ni se borran una vez publicados: los usuarios tienen registros que apuntan a ellos. Para retirar algo, se deja de mostrar; no se borra.
- El archivo de un logro se llama igual que su id.
- **Equipo:** `metodosPermitidos: []`; se cumple solo, con el inventario (`itemsRequeridos`).
- **Habilidad:** puede pedir items para estar disponible (por ejemplo, un anafe para cocinar sin red).
- **Salud** (y Seguridad cuando entre): `metodosPermitidos: [cuestionario]`. Solo conocimiento, sin procedimientos de riesgo, y la guía deriva a un curso.
- Si un logro permite `cuestionario`, lleva el bloque `cuestionario` con `umbral` y `preguntas`.

Todo lo que dice "EJEMPLO" es de relleno para los tests: reemplazarlo.
