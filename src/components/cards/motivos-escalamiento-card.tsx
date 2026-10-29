"use client";

import { useState } from "react";
import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { MotivoEscalamientoDetalleDialog } from "@/components/cards/motivo-escalamiento-detalle-dialog";
import { CATEGORICAL_OTROS_COLOR, CATEGORICAL_THEME } from "@/lib/chart-colors";
import { formatNumero, formatPorcentaje } from "@/lib/format";
import { NOMBRES_TOPICO, etiquetaTopico } from "@/lib/topicos";
import type { DateRange } from "@/lib/date-ranges";
import type { MotivoItem } from "@/types/metrics-agentes";

const chartConfig = {
  conteo: { label: "Escalamientos" },
} satisfies ChartConfig;

/** Motivos fuera de T1–T5 (texto libre): los más frecuentes usan los slots restantes; el resto va a "Otros". */
const MAX_MOTIVOS_LIBRES = CATEGORICAL_THEME.length - Object.keys(NOMBRES_TOPICO).length;

type Punto = {
  motivo: string;
  etiqueta: string;
  conteo: number;
  color: string;
  esOtros: boolean;
  motivosOriginales: string[];
};

/** Cada tópico conserva siempre su color (T1 = slot 1, …) para que no cambie al variar el período. */
function colorTopico(motivo: string): string | null {
  const idx = Object.keys(NOMBRES_TOPICO).indexOf(motivo);
  return idx >= 0 ? CATEGORICAL_THEME[idx] : null;
}

function construirPuntos(data: MotivoItem[]): Punto[] {
  const ordenado = [...data].sort((a, b) => b.conteo - a.conteo);
  const topicos = ordenado.filter((d) => colorTopico(d.motivo) != null);
  const libres = ordenado.filter((d) => colorTopico(d.motivo) == null);
  const libresPrincipales = libres.slice(0, MAX_MOTIVOS_LIBRES);
  const resto = libres.slice(MAX_MOTIVOS_LIBRES);
  const otrosConteo = resto.reduce((acc, d) => acc + d.conteo, 0);
  const primerSlotLibre = Object.keys(NOMBRES_TOPICO).length;

  return [
    ...topicos.map((d) => ({
      motivo: d.motivo,
      etiqueta: etiquetaTopico(d.motivo),
      conteo: d.conteo,
      color: colorTopico(d.motivo)!,
      esOtros: false,
      motivosOriginales: [d.motivo],
    })),
    ...libresPrincipales.map((d, i) => ({
      motivo: d.motivo,
      etiqueta: d.motivo,
      conteo: d.conteo,
      color: CATEGORICAL_THEME[primerSlotLibre + i],
      esOtros: false,
      motivosOriginales: [d.motivo],
    })),
    ...(otrosConteo > 0
      ? [
          {
            motivo: `Otros (${resto.length} motivos)`,
            etiqueta: `Otros (${resto.length} motivos)`,
            conteo: otrosConteo,
            color: CATEGORICAL_OTROS_COLOR,
            esOtros: true,
            motivosOriginales: resto.map((d) => d.motivo),
          },
        ]
      : []),
  ].sort((a, b) => Number(a.esOtros) - Number(b.esOtros) || b.conteo - a.conteo);
}

export function MotivosEscalamientoCard({
  data,
  range,
  agenteOrigen,
}: {
  data: MotivoItem[];
  range: DateRange;
  /** Restringe el detalle a escalamientos que vienen de este agente. */
  agenteOrigen?: string;
}) {
  const [seleccion, setSeleccion] = useState<{ titulo: string; motivos: string[] } | null>(null);

  const puntos = construirPuntos(data);
  const total = puntos.reduce((acc, p) => acc + p.conteo, 0);
  const abrir = (p: Punto) => setSeleccion({ titulo: p.etiqueta, motivos: p.motivosOriginales });

  return (
    <>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative shrink-0">
          <ChartContainer config={chartConfig} className="aspect-square h-52 w-52">
            <PieChart>
              <ChartTooltip
                content={<ChartTooltipContent hideLabel formatter={(value, _name, item) => (
                  <span>
                    {item.payload.etiqueta}: <b className="tabular-nums">{formatNumero(Number(value))}</b>
                  </span>
                )} />}
              />
              <Pie
                data={puntos}
                dataKey="conteo"
                nameKey="etiqueta"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={2}
                strokeWidth={0}
              >
                {puntos.map((p) => (
                  <Cell key={p.motivo} fill={p.color} cursor="pointer" onClick={() => abrir(p)} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold tabular-nums">{formatNumero(total)}</span>
            <span className="text-xs text-muted-foreground">escalamientos</span>
          </div>
        </div>

        <ul className="flex w-full min-w-0 flex-1 flex-col divide-y divide-border">
          {puntos.map((p) => (
            <li key={p.motivo}>
              <button
                type="button"
                onClick={() => abrir(p)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted/60"
              >
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="min-w-0 flex-1 truncate" title={p.etiqueta}>
                  {p.etiqueta}
                </span>
                <span className="font-medium tabular-nums">{formatNumero(p.conteo)}</span>
                <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                  {formatPorcentaje((p.conteo / total) * 100)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">Haz clic en un motivo para ver las conversaciones y su detalle.</p>

      <MotivoEscalamientoDetalleDialog
        range={range}
        agenteOrigen={agenteOrigen}
        seleccion={seleccion}
        onOpenChange={(open) => !open && setSeleccion(null)}
      />
    </>
  );
}
