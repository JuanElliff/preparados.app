import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { compilarCatalogo } from "./compilar";

const [entrada = "../../contenido", salida = "dist/catalogo.json"] = process.argv.slice(2);
const { catalogo, errores } = compilarCatalogo(resolve(entrada));

if (errores.length > 0) {
  console.error(`El catálogo tiene ${errores.length} error(es):`);
  for (const e of errores) console.error(`  - ${e}`);
  process.exit(1);
}

mkdirSync(dirname(resolve(salida)), { recursive: true });
writeFileSync(resolve(salida), JSON.stringify(catalogo, null, 2) + "\n");
console.log(
  `Catálogo ${catalogo.version}: ${catalogo.dominios.length} dominios, ${catalogo.logros.length} logros, ` +
    `${catalogo.cuestionarios.length} cuestionarios, ${catalogo.items.length} items → ${salida}`,
);
