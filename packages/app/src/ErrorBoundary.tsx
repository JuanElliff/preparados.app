import { Component, type ErrorInfo, type ReactNode } from "react";
import { irA } from "./rutas";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Si una pantalla explota, esto evita que la app quede en blanco. Al tocar el botón, vuelve a
 * montar lo de abajo (la tienda ya tiene el catálogo cargado, así que no hace falta recargar la
 * página entera) y manda a Inicio, lejos de lo que rompió.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Error sin atrapar:", error, info.componentStack);
  }

  private reintentar = (): void => {
    this.setState({ error: null });
    irA("/");
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="app">
        <main className="contenido">
          <section className="seccion">
            <h1>Algo salió mal</h1>
            <p className="aviso error">{error.message || "La app tuvo un error inesperado."}</p>
            <button type="button" className="boton boton--principal" onClick={this.reintentar}>
              Volver a Inicio
            </button>
          </section>
        </main>
      </div>
    );
  }
}
