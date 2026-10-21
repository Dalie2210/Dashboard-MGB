"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatNumero } from "@/lib/format";

export function EnlaceConversacion({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-primary underline-offset-4 hover:underline">
      Ver conversación
    </a>
  );
}

export type Columna<T> = {
  id: string;
  header: string;
  /** Valor para ordenar. Sin `valor`, la columna no se ordena ni entra en la búsqueda (p. ej. links). */
  valor?: (fila: T) => string | number | null;
  /** Texto visible/buscable; por defecto `String(valor)`. */
  texto?: (fila: T) => string;
  render?: (fila: T) => React.ReactNode;
  /** "opciones": agrega un selector con los valores distintos de la columna. */
  filtro?: "opciones";
};

type Orden = { id: string; dir: "asc" | "desc" } | null;

const CONTROL =
  "h-8 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

function comparar(a: string | number | null, b: string | number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1; // nulos siempre al final
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "es", { numeric: true, sensitivity: "base" });
}

/**
 * Tabla de detalle con búsqueda libre, filtros por columna (selector) y orden
 * por encabezado (clic alterna asc → desc → sin orden). Todo en el cliente.
 */
export function DetalleTable<T>({
  filas,
  columnas,
  ordenInicial = null,
  className,
}: {
  filas: T[];
  columnas: Columna<T>[];
  ordenInicial?: Orden;
  className?: string;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState<Record<string, string>>({});
  const [orden, setOrden] = useState<Orden>(ordenInicial);

  const textoDe = (col: Columna<T>, fila: T): string =>
    col.texto ? col.texto(fila) : col.valor ? String(col.valor(fila) ?? "") : "";

  const opciones = useMemo(() => {
    const resultado: Record<string, string[]> = {};
    for (const col of columnas) {
      if (col.filtro !== "opciones") continue;
      const distintos = new Set<string>();
      for (const fila of filas) {
        const t = col.texto ? col.texto(fila) : col.valor ? String(col.valor(fila) ?? "") : "";
        if (t) distintos.add(t);
      }
      resultado[col.id] = [...distintos].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
    }
    return resultado;
  }, [filas, columnas]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const buscables = columnas.filter((c) => c.valor);

    let resultado = filas.filter((fila) => {
      for (const col of columnas) {
        const f = filtros[col.id];
        if (f && textoDe(col, fila) !== f) return false;
      }
      if (!q) return true;
      return buscables.some((col) => textoDe(col, fila).toLowerCase().includes(q));
    });

    const colOrden = orden ? columnas.find((c) => c.id === orden.id) : undefined;
    if (colOrden?.valor && orden) {
      const valor = colOrden.valor;
      const signo = orden.dir === "asc" ? 1 : -1;
      resultado = [...resultado].sort((x, y) => {
        const vx = valor(x);
        const vy = valor(y);
        // Los nulos van al final sin importar la dirección.
        if (vx == null || vy == null) return comparar(vx, vy);
        return signo * comparar(vx, vy);
      });
    }
    return resultado;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filas, columnas, busqueda, filtros, orden]);

  const hayFiltros = busqueda !== "" || Object.values(filtros).some(Boolean);

  const alternarOrden = (id: string) =>
    setOrden((prev) => {
      if (prev?.id !== id) return { id, dir: "asc" };
      if (prev.dir === "asc") return { id, dir: "desc" };
      return null;
    });

  const limpiar = () => {
    setBusqueda("");
    setFiltros({});
  };

  const columnasConFiltro = columnas.filter((c) => c.filtro === "opciones");

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar…"
            aria-label="Buscar en la tabla"
            className={cn(CONTROL, "w-48 pl-8")}
          />
        </div>

        {columnasConFiltro.map((col) => (
          <select
            key={col.id}
            value={filtros[col.id] ?? ""}
            onChange={(e) => setFiltros((prev) => ({ ...prev, [col.id]: e.target.value }))}
            aria-label={`Filtrar por ${col.header}`}
            className={cn(CONTROL, "max-w-56", filtros[col.id] && "border-primary/60")}
          >
            <option value="">{col.header}: todos</option>
            {(opciones[col.id] ?? []).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ))}

        {hayFiltros ? (
          <Button type="button" variant="ghost" size="sm" onClick={limpiar}>
            <X className="size-3.5" />
            Limpiar
          </Button>
        ) : null}

        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {hayFiltros || visibles.length !== filas.length
            ? `${formatNumero(visibles.length)} de ${formatNumero(filas.length)}`
            : `${formatNumero(filas.length)} registro(s)`}
        </span>
      </div>

      {visibles.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Ningún registro coincide con los filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                {columnas.map((col) => {
                  const ordenable = col.valor != null;
                  const activo = orden?.id === col.id;
                  const Icono = !activo ? ArrowUpDown : orden.dir === "asc" ? ArrowUp : ArrowDown;
                  return (
                    <th
                      key={col.id}
                      className="px-3 py-2 font-medium"
                      aria-sort={activo ? (orden.dir === "asc" ? "ascending" : "descending") : undefined}
                    >
                      {ordenable ? (
                        <button
                          type="button"
                          onClick={() => alternarOrden(col.id)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary",
                            activo && "text-foreground"
                          )}
                        >
                          {col.header}
                          <Icono className={cn("size-3", !activo && "opacity-50")} />
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibles.map((fila, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columnas.map((col) => (
                    <td key={col.id} className="px-3 py-2 text-foreground">
                      {col.render ? col.render(fila) : textoDe(col, fila)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
