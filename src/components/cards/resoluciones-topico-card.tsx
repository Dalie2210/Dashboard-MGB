"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ResolucionesDetalleDialog } from "@/components/cards/resoluciones-detalle-dialog";
import { ACCENT_SECONDARY, CATEGORICAL_OTROS_COLOR } from "@/lib/chart-colors";
import { NOMBRES_TOPICO, etiquetaTopico } from "@/lib/topicos";
import type { DateRange } from "@/lib/date-ranges";
import type { TopicoItem } from "@/types/metrics-agentes";

const chartConfig = {
  conteo: { label: "Resoluciones", color: ACCENT_SECONDARY },
} satisfies ChartConfig;

const ROW_HEIGHT_PX = 36;
const MIN_HEIGHT_PX = 160;

export function ResolucionesTopicoCard({
  data,
  range,
  agenteIa,
}: {
  data: TopicoItem[];
  range: DateRange;
  agenteIa: string;
}) {
  const [seleccion, setSeleccion] = useState<{ titulo: string; topicos: string[] } | null>(null);

  const puntos = [...data]
    .sort((a, b) => b.conteo - a.conteo)
    .map((d) => ({ topico: d.topico, etiqueta: etiquetaTopico(d.topico), conteo: d.conteo }));

  const altura = Math.max(MIN_HEIGHT_PX, puntos.length * ROW_HEIGHT_PX + 40);

  return (
    <>
      <ChartContainer config={chartConfig} className="aspect-auto w-full" style={{ height: altura }}>
        <BarChart data={puntos} layout="vertical" margin={{ left: 0, right: 40, top: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="etiqueta"
            tickLine={false}
            axisLine={false}
            width={230}
            interval={0}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.etiqueta ?? ""} />} />
          <Bar dataKey="conteo" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="conteo" position="right" className="fill-foreground" fontSize={12} />
            {puntos.map((p) => (
              <Cell
                key={p.topico}
                fill={NOMBRES_TOPICO[p.topico] ? ACCENT_SECONDARY : CATEGORICAL_OTROS_COLOR}
                cursor="pointer"
                onClick={() => setSeleccion({ titulo: p.etiqueta, topicos: [p.topico] })}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <p className="mt-2 text-xs text-muted-foreground">Haz clic en una barra para ver las conversaciones.</p>

      <ResolucionesDetalleDialog
        range={range}
        agenteIa={agenteIa}
        seleccion={seleccion}
        onOpenChange={(open) => !open && setSeleccion(null)}
      />
    </>
  );
}
