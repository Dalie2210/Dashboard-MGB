"use client";

import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CATEGORICAL_THEME } from "@/lib/chart-colors";
import { formatNumero, formatPorcentaje } from "@/lib/format";
import type { ConversacionesMetric } from "@/types/metrics";

const chartConfig = {
  cerradas: { label: "Cerradas", color: CATEGORICAL_THEME[2] },
  abiertas: { label: "Abiertas", color: CATEGORICAL_THEME[3] },
} satisfies ChartConfig;

export function ResueltosAbiertosCard({ data }: { data: ConversacionesMetric }) {
  const segmentos = [
    { nombre: "Cerradas", valor: data.cerradas, color: CATEGORICAL_THEME[2] },
    { nombre: "Abiertas", valor: data.abiertas, color: CATEGORICAL_THEME[3] },
  ];
  const total = data.cerradas + data.abiertas;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 py-2">
      <div className="relative">
        <ChartContainer config={chartConfig} className="aspect-square h-44 w-44 shrink-0">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="nombre" />} />
            <Pie
              data={segmentos}
              dataKey="valor"
              nameKey="nombre"
              innerRadius={58}
              outerRadius={82}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {segmentos.map((s) => (
                <Cell key={s.nombre} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tabular-nums text-foreground">{formatNumero(total)}</span>
          <span className="text-xs text-muted-foreground">casos</span>
        </div>
      </div>
      <ul className="flex w-full max-w-xs flex-col gap-2 text-sm">
        {segmentos.map((s) => (
          <li key={s.nombre} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-foreground">{s.nombre}</span>
            <span className="ml-auto tabular-nums text-foreground">{formatNumero(s.valor)}</span>
            <span className="w-12 text-right tabular-nums text-muted-foreground">
              {formatPorcentaje(total > 0 ? (s.valor / total) * 100 : null)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
