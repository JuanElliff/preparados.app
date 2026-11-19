import {
  cantidadDisponible,
  CONFIG_POR_DEFECTO,
  type EstadoLogro,
  type InventarioItem,
  type ItemId,
} from "@preparados/dominio";
import { useState } from "react";
import { useEstadoApp, useTienda } from "../estado/contexto";
import { Seccion } from "./Seccion";

interface Formulario {
  /** null = item nuevo. */
  indice: number | null;
  item: ItemId;
  cantidad: string;
  vencimiento: string;
}

const diasEnPalabras = (dias: number): string => {
  if (dias < 0) return `vencido hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "día" : "días"}`;
  if (dias === 0) return "vence hoy";
  return `vence en ${dias} ${dias === 1 ? "día" : "días"}`;
};

export function Inventario() {
  const tienda = useTienda();
  const estado = useEstadoApp();
  const [form, setForm] = useState<Formulario | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (estado.fase !== "listo") return null;
  const { catalogo, resumen, hoy } = estado;
  const usuario = estado.guardado?.estado;
  if (!usuario) return null;

  const inventario = usuario.inventario;
  const alertas = resumen?.alertas ?? [];
  const equipo = catalogo.logros.filter((l) => l.tipo === "equipo");
  const nombreItem = (id: string) => catalogo.items.find((i) => i.id === id)?.nombre ?? id;
  const vence = (id: string) => catalogo.items.find((i) => i.id === id)?.vence === true;

  const guardar = async (nuevo: InventarioItem[]) => {
    await tienda.guardar({ ...usuario, inventario: nuevo });
    setForm(null);
    setError(null);
  };

  const confirmar = async (f: Formulario) => {
    const cantidad = Number(f.cantidad);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      setError("La cantidad tiene que ser un número entero mayor que cero.");
      return;
    }
    const entrada: InventarioItem = {
      item: f.item,
      cantidad,
      ...(vence(f.item) && f.vencimiento ? { vencimiento: f.vencimiento } : {}),
    };
    const nuevo = [...inventario];
    if (f.indice === null) nuevo.push(entrada);
    else nuevo[f.indice] = entrada;
    await guardar(nuevo);
  };

  if (form) {
    const primero = catalogo.items[0]?.id ?? "";
    return (
      <Seccion titulo={form.indice === null ? "Agregar al inventario" : "Editar"}>
        <label className="campo">
          <span className="rotulo">Qué es</span>
          <select
            value={form.item || primero}
            onChange={(ev) => {
              const item = ev.target.value;
              setForm({ ...form, item, vencimiento: vence(item) ? form.vencimiento : "" });
            }}
          >
            {catalogo.items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span className="rotulo">Cantidad</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={form.cantidad}
            onChange={(ev) => setForm({ ...form, cantidad: ev.target.value })}
          />
        </label>

        {vence(form.item) && (
          <label className="campo">
            <span className="rotulo">Vence el</span>
            <input
              type="date"
              value={form.vencimiento}
              onChange={(ev) => setForm({ ...form, vencimiento: ev.target.value })}
            />
          </label>
        )}

        {error && <p className="aviso error">{error}</p>}

        <div className="fila">
          <button type="button" className="boton boton--principal" onClick={() => void confirmar(form)}>
            Guardar
          </button>
          <button
            type="button"
            className="boton"
            onClick={() => {
              setForm(null);
              setError(null);
            }}
          >
            Cancelar
          </button>
          {form.indice !== null && (
            <button
              type="button"
              className="boton"
              onClick={() => void guardar(inventario.filter((_, i) => i !== form.indice))}
            >
              Quitar
            </button>
          )}
        </div>
      </Seccion>
    );
  }

  return (
    <Seccion titulo="Inventario">
      {alertas.length > 0 && (
        <div className="tarjeta">
          <h2>Atención</h2>
          <ul className="lista-limpia">
            {alertas.map((a) => (
              <li key={`${a.item}-${a.vencimiento}`} className={a.diasRestantes < 0 ? "aviso error" : "alerta"}>
                {a.nombre}: {diasEnPalabras(a.diasRestantes)} ({a.vencimiento})
              </li>
            ))}
          </ul>
          <p className="nodo__dato">Las alertas se ven acá: el aviso en el celular llega en una versión futura.</p>
        </div>
      )}

      <button
        type="button"
        className="boton boton--principal"
        onClick={() =>
          setForm({ indice: null, item: catalogo.items[0]?.id ?? "", cantidad: "1", vencimiento: "" })
        }
      >
        Agregar
      </button>

      {inventario.length === 0 ? (
        <p className="por-ahora">Todavía no cargaste nada. Lo que agregues se queda en este dispositivo.</p>
      ) : (
        <ul className="lista-limpia">
          {inventario.map((e, i) => (
            <li key={`${e.item}-${i}`}>
              <button
                type="button"
                className="nodo"
                onClick={() =>
                  setForm({
                    indice: i,
                    item: e.item,
                    cantidad: String(e.cantidad),
                    vencimiento: e.vencimiento ?? "",
                  })
                }
              >
                <span className="nodo__texto">
                  <span className="nodo__titulo">{nombreItem(e.item)}</span>
                  <span className="nodo__dato">
                    {e.cantidad} {e.cantidad === 1 ? "unidad" : "unidades"}
                    {e.vencimiento ? ` · vence el ${e.vencimiento}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Equipo</h2>
      <p className="por-ahora">Estos logros se cumplen solos cuando tenés lo que piden.</p>
      <ul className="lista-limpia">
        {equipo.map((l) => {
          const estadoLogro: EstadoLogro = resumen?.estados.get(l.id) ?? "bloqueado";
          const faltan = l.itemsRequeridos
            .map((r) => ({
              nombre: nombreItem(r.item),
              falta: r.cantidad - cantidadDisponible(inventario, r.item, hoy, CONFIG_POR_DEFECTO),
            }))
            .filter((f) => f.falta > 0);
          const pendientes = l.prerrequisitos.filter((p) => resumen?.estados.get(p) !== "logrado");
          return (
            <li key={l.id} className={`nodo nodo--${estadoLogro}`}>
              <span className="nodo__marca" aria-hidden="true">
                {estadoLogro === "logrado" ? "✓" : "—"}
              </span>
              <span className="nodo__texto">
                <span className="nodo__titulo">{l.titulo}</span>
                <span className="nodo__dato">
                  {estadoLogro === "logrado"
                    ? "Lo tenés"
                    : [
                        pendientes.length > 0 &&
                          `Primero: ${pendientes
                            .map((p) => catalogo.logros.find((o) => o.id === p)?.titulo ?? p)
                            .join(", ")}`,
                        faltan.length > 0 &&
                          `Te falta: ${faltan.map((f) => `${f.falta} × ${f.nombre}`).join(", ")}`,
                      ]
                        .filter(Boolean)
                        .join(". ") || "Falta equipo"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </Seccion>
  );
}
