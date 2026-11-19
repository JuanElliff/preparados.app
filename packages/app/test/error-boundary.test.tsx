import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../src/ErrorBoundary";

function Explota(): null {
  throw new Error("boom de prueba");
}

afterEach(() => {
  globalThis.location.hash = "";
  vi.restoreAllMocks();
});

describe("ErrorBoundary", () => {
  it("atrapa el error, muestra el mensaje y vuelve a Inicio", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Explota />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("heading", { name: "Algo salió mal" })).toBeTruthy();
    expect(screen.getByText("boom de prueba")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Volver a Inicio" }));
    expect(globalThis.location.hash).toBe("#/");
  });

  it("sin error, muestra los hijos normalmente", () => {
    render(
      <ErrorBoundary>
        <p>todo bien</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("todo bien")).toBeTruthy();
  });
});
