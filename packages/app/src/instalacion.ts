/**
 * En iOS, los datos de un sitio en Safari se borran tras 7 días sin uso. Instalada en la pantalla
 * de inicio, la app los conserva. Por eso avisamos solo cuando hace falta: iOS y sin instalar.
 */

const esIOS = (): boolean => {
  const ua = globalThis.navigator?.userAgent ?? "";
  // iPadOS se presenta como Mac: se lo reconoce porque tiene pantalla táctil.
  const iPadComoMac = /Macintosh/.test(ua) && (globalThis.navigator?.maxTouchPoints ?? 0) > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadComoMac;
};

const estaInstalada = (): boolean =>
  globalThis.matchMedia?.("(display-mode: standalone)").matches === true ||
  (globalThis.navigator as { standalone?: boolean } | undefined)?.standalone === true;

export const hayQueAvisarDeInstalacion = (): boolean => esIOS() && !estaInstalada();
