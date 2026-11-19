// Genera los iconos provisorios de la PWA: una marca de rama sobre fondo oscuro.
// Se corre a mano (npm run iconos) y los PNG quedan versionados en public/.
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const FONDO = [0x14, 0x15, 0x0f];
const MARCA = [0xcb, 0xbf, 0x9a];

// Tronco y dos ramas, en coordenadas 0..1 (y hacia abajo): x1, y1, x2, y2, radio.
const RAMAS = [
  [0.5, 0.9, 0.5, 0.28, 0.045],
  [0.5, 0.66, 0.24, 0.42, 0.034],
  [0.5, 0.54, 0.78, 0.3, 0.034],
];

const distanciaASegmento = (x, y, x1, y1, x2, y2) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const largo = dx * dx + dy * dy;
  const t = largo === 0 ? 0 : Math.min(1, Math.max(0, ((x - x1) * dx + (y - y1) * dy) / largo));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
};

/** Cuánto de la marca cubre el pixel (0..1), con submuestreo para que el borde no quede dentado. */
function cobertura(x, y, lado, escala) {
  const muestras = 3;
  let dentro = 0;
  for (let i = 0; i < muestras; i++) {
    for (let j = 0; j < muestras; j++) {
      const u = 0.5 + ((x + (i + 0.5) / muestras) / lado - 0.5) / escala;
      const v = 0.5 + ((y + (j + 0.5) / muestras) / lado - 0.5) / escala;
      if (RAMAS.some(([x1, y1, x2, y2, r]) => distanciaASegmento(u, v, x1, y1, x2, y2) <= r)) dentro++;
    }
  }
  return dentro / (muestras * muestras);
}

const TABLA = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

function png(lado, escala) {
  const filas = [];
  for (let y = 0; y < lado; y++) {
    const fila = Buffer.alloc(1 + lado * 3); // byte 0 = filtro "ninguno"
    for (let x = 0; x < lado; x++) {
      const a = cobertura(x, y, lado, escala);
      for (let c = 0; c < 3; c++) fila[1 + x * 3 + c] = Math.round(FONDO[c] * (1 - a) + MARCA[c] * a);
    }
    filas.push(fila);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8; // 8 bits por canal
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo("IHDR", ihdr),
    trozo("IDAT", deflateSync(Buffer.concat(filas), { level: 9 })),
    trozo("IEND", Buffer.alloc(0)),
  ]);
}

const publico = resolve(dirname(fileURLToPath(import.meta.url)), "../public");
// escala 1 = la marca ocupa todo el icono; 0.7 deja el margen que pide un icono maskable.
const salidas = [
  ["icono-32.png", 32, 1],
  ["icono-180.png", 180, 1],
  ["icono-192.png", 192, 1],
  ["icono-512.png", 512, 1],
  ["icono-maskable-512.png", 512, 0.7],
];
for (const [nombre, lado, escala] of salidas) {
  writeFileSync(resolve(publico, nombre), png(lado, escala));
  console.log(`${nombre} (${lado}x${lado})`);
}
