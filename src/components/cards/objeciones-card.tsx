"use client";

import { useState } from "react";
import { ObjecionDetalleDialog } from "@/components/cards/objecion-detalle-dialog";
import { formatNumero } from "@/lib/format";
import type { DateRange } from "@/lib/date-ranges";
import type { ObjecionItem } from "@/types/metrics-agentes";

const ETIQUETAS_CATEGORIA: Record<string, string> = {
  precio: "Precio",
  personalizacion: "Personalización",
  adecuacion_clinica: "Adecuación clínica",
  medios_pago: "Medios de pago",
  hablar_con_humano: "Hablar con humano",
  friccion_checkout: "Fricción en el checkout",
  permanencia_confianza: "Permanencia / confianza",
  consultar_familia: "Consultar con familia",
  tiempo: "Tiempo",
  otro: "Otro",
};

function etiquetaCategoria(categoria: string): string {
  return ETIQUETAS_CATEGORIA[categoria] ?? categoria;
}

export function ObjecionesCard({ data, range }: { data: ObjecionItem[]; range: DateRange }) {
  const [seleccion, setSeleccion] = useState<{ titulo: string; categoria: string } | null>(null);

  const ordenado = [...data].sort((a, b) => b.conteo - a.conteo);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Objeción</th>
              <th className="px-3 py-2 font-medium">Cantidad</th>
              <th className="px-3 py-2 font-medium">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {ordenado.map((item) => (
              <tr key={item.categoria} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-foreground">{etiquetaCategoria(item.categoria)}</td>
                <td className="px-3 py-2 tabular-nums text-foreground">{formatNumero(item.conteo)}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setSeleccion({ titulo: etiquetaCategoria(item.categoria), categoria: item.categoria })}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ObjecionDetalleDialog range={range} seleccion={seleccion} onOpenChange={(open) => !open && setSeleccion(null)} />
    </>
  );
}
