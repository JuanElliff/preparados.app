import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ProveedorTienda, tiendaDelNavegador } from "./estado/contexto";
import "./estilos.css";

const raiz = document.getElementById("raiz");
if (!raiz) throw new Error("falta #raiz en index.html");

createRoot(raiz).render(
  <StrictMode>
    <ProveedorTienda tienda={tiendaDelNavegador()}>
      <App />
    </ProveedorTienda>
  </StrictMode>,
);
