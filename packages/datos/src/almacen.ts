import type { Guardado } from "./guardado";

/** Dónde vive el estado del usuario. En el MVP, el dispositivo. En fase 2 se suma la sincronización. */
export interface Almacen {
  cargar(): Promise<Guardado | null>;
  guardar(guardado: Guardado): Promise<void>;
  borrar(): Promise<void>;
}

/** Para tests y para correr sin navegador. */
export class AlmacenMemoria implements Almacen {
  private dato: Guardado | null = null;
  async cargar() {
    return this.dato === null ? null : structuredClone(this.dato);
  }
  async guardar(guardado: Guardado) {
    this.dato = structuredClone(guardado);
  }
  async borrar() {
    this.dato = null;
  }
}

const STORE = "estado";
const CLAVE = "actual";

const comoPromesa = <T>(req: IDBRequest<T>) =>
  new Promise<T>((ok, mal) => {
    req.onsuccess = () => ok(req.result);
    req.onerror = () => mal(req.error);
  });

/** Estado en IndexedDB del navegador: un solo registro, reemplazado en cada guardado. */
export class AlmacenIndexedDB implements Almacen {
  private db: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly nombre = "preparados",
    private readonly fabrica: IDBFactory = globalThis.indexedDB,
  ) {}

  private abrir(): Promise<IDBDatabase> {
    this.db ??= new Promise((ok, mal) => {
      const req = this.fabrica.open(this.nombre, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => ok(req.result);
      req.onerror = () => mal(req.error);
    });
    return this.db;
  }

  private async operar<T>(modo: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.abrir();
    const tx = db.transaction(STORE, modo);
    const terminada = new Promise<void>((ok, mal) => {
      tx.oncomplete = () => ok();
      tx.onerror = () => mal(tx.error);
      tx.onabort = () => mal(tx.error);
    });
    const [resultado] = await Promise.all([comoPromesa(f(tx.objectStore(STORE))), terminada]);
    return resultado;
  }

  async cargar(): Promise<Guardado | null> {
    const v = await this.operar("readonly", (s) => s.get(CLAVE) as IDBRequest<Guardado | undefined>);
    return v ?? null;
  }

  async guardar(guardado: Guardado): Promise<void> {
    await this.operar("readwrite", (s) => s.put(guardado, CLAVE));
  }

  async borrar(): Promise<void> {
    await this.operar("readwrite", (s) => s.delete(CLAVE));
  }

  cerrar(): void {
    void this.db?.then((db) => db.close());
    this.db = null;
  }
}

/**
 * Pide al navegador que no borre los datos del sitio por falta de espacio.
 * Devuelve undefined si el navegador no ofrece la API. No reemplaza el respaldo exportable.
 */
export async function pedirAlmacenamientoPersistente(): Promise<boolean | undefined> {
  const storage = (globalThis.navigator as Navigator | undefined)?.storage;
  return storage?.persist ? storage.persist() : undefined;
}
