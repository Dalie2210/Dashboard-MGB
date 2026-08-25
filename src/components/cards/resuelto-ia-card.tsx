"use client";

import { PieChart, Pie, Cell } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatPorcentaje } from "@/lib/format";
import { ACCENT_PRIMARY } from "@/lib/chart-colors";
import type { ResueltoIaMetric } from "@/types/metrics";

const chartConfig = {
  ia: { label: "Resuelto por IA", color: ACCENT_PRIMARY },
} satisfies ChartConfig;

export function ResueltoIaCard({ data }: { data: ResueltoIaMetric }) {
  const porcentaje = data.porcentaje ?? 0;
  const gaugeData = [
    { name: "ia", value: porcentaje },
    { name: "resto", value: 100 - porcentaje },
  ];

  return (
    <div className="flex items-center gap-4">
      <ChartContainer config={chartConfig} className="aspect-square h-24 w-24 shrink-0">
        <PieChart>
          <Pie
            data={gaugeData}
            dataKey="value"
            nameKey="name"
            innerRadius={32}
            outerRadius={44}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill={ACCENT_PRIMARY} />
            <Cell fill="var(--muted)" />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-col gap-1">
        <p className="text-3xl font-semibold tabular-nums text-foreground">
          {formatPorcentaje(data.porcentaje)}
        </p>
        <p className="text-xs text-muted-foreground">
          {data.conversacionesIa.toLocaleString("es-CO")} de {data.totalConversaciones.toLocaleString("es-CO")} conversaciones
        </p>
      </div>
    </div>
  );
}
