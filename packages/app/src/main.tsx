import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { ProveedorTienda, tiendaDelNavegador } from "./estado/contexto";
import { aplicarTema, temaGuardado } from "./tema";
import "./estilos.css";

aplicarTema(temaGuardado());

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("falta #raiz en index.html");

createRoot(raiz).render(
  <StrictMode>
    <ErrorBoundary>
      <ProveedorTienda tienda={tiendaDelNavegador()}>
        <App />
      </ProveedorTienda>
    </ErrorBoundary>
  </StrictMode>,
);
