"use client";

import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CATEGORICAL_THEME } from "@/lib/chart-colors";
import { formatNumero } from "@/lib/format";
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

  return (
    <div className="flex items-center gap-4">
      <ChartContainer config={chartConfig} className="aspect-square h-24 w-24 shrink-0">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="nombre" />} />
          <Pie
            data={segmentos}
            dataKey="valor"
            nameKey="nombre"
            innerRadius={32}
            outerRadius={44}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {segmentos.map((s) => (
              <Cell key={s.nombre} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex flex-col gap-1.5 text-sm">
        {segmentos.map((s) => (
          <li key={s.nombre} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-foreground">{s.nombre}</span>
            <span className="tabular-nums text-muted-foreground">{formatNumero(s.valor)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
