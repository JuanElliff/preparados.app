import { afterEach, describe, expect, it, vi } from "vitest";
import { hayQueAvisarDeInstalacion } from "../src/instalacion";

const navegador = (ua: string, extra: Record<string, unknown> = {}) =>
  vi.stubGlobal("navigator", { userAgent: ua, maxTouchPoints: 0, ...extra });

const instalada = (si: boolean) => vi.stubGlobal("matchMedia", () => ({ matches: si }));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("aviso de instalación", () => {
  it("en iPhone sin instalar, avisa", () => {
    navegador("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1");
    instalada(false);
    expect(hayQueAvisarDeInstalacion()).toBe(true);
  });

  it("en iPhone ya instalada, no avisa", () => {
    navegador("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1", {
      standalone: true,
    });
    instalada(false);
    expect(hayQueAvisarDeInstalacion()).toBe(false);
  });

  it("reconoce al iPad, que se presenta como Mac", () => {
    navegador("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15", {
      maxTouchPoints: 5,
    });
    instalada(false);
    expect(hayQueAvisarDeInstalacion()).toBe(true);
  });

  it("en Android no avisa: ahí los datos no se borran solos", () => {
    navegador("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36");
    instalada(false);
    expect(hayQueAvisarDeInstalacion()).toBe(false);
  });
});
