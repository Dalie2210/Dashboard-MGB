"use client";

import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CATEGORICAL_THEME, CATEGORICAL_MAX_SLOTS, CATEGORICAL_OTROS_COLOR } from "@/lib/chart-colors";
import { formatPorcentaje } from "@/lib/format";
import type { ChatsPorAgenteMetric } from "@/types/metrics";

export function ChatsPorAgenteCard({ data }: { data: ChatsPorAgenteMetric }) {
  const maxSeries = CATEGORICAL_MAX_SLOTS - 1; // reservamos un slot para "Otros" si hace falta
  const principales = data.items.slice(0, maxSeries);
  const resto = data.items.slice(maxSeries);
  const otrosChats = resto.reduce((acc, r) => acc + r.chats, 0);

  const segmentos = [
    ...principales.map((item, i) => ({
      nombre: item.nombre,
      chats: item.chats,
      porcentaje: item.porcentaje,
      color: CATEGORICAL_THEME[i],
    })),
    ...(otrosChats > 0
      ? [
          {
            nombre: "Otros",
            chats: otrosChats,
            porcentaje: (otrosChats / data.totalChats) * 100,
            color: CATEGORICAL_OTROS_COLOR,
          },
        ]
      : []),
  ];

  const chartConfig = Object.fromEntries(
    segmentos.map((s) => [s.nombre, { label: s.nombre, color: s.color }])
  ) satisfies ChartConfig;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ChartContainer config={chartConfig} className="aspect-square h-40 w-40 shrink-0">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="nombre" />} />
          <Pie data={segmentos} dataKey="chats" nameKey="nombre" innerRadius={44} outerRadius={68} stroke="var(--card)" strokeWidth={2}>
            {segmentos.map((s) => (
              <Cell key={s.nombre} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex w-full flex-col gap-1.5 text-sm">
        {segmentos.map((s) => (
          <li key={s.nombre} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 truncate">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="truncate text-foreground">{s.nombre}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatPorcentaje(s.porcentaje)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
