// Compila contenido/ y deja el catálogo en public/, para que el build lo publique
// y el service worker lo precachee. Lo corren los scripts dev y build.
import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, "../../..");

execSync("npm run compilar --workspace @preparados/catalogo", { cwd: raiz, stdio: "inherit" });

const origen = resolve(raiz, "packages/catalogo/dist/catalogo.json");
const destino = resolve(aqui, "../public/catalogo.json");
mkdirSync(dirname(destino), { recursive: true });
copyFileSync(origen, destino);
console.log(`catálogo copiado a ${destino}`);
