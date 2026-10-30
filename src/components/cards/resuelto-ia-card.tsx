"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
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
  const delta =
    data.porcentaje != null && data.porcentajeAnterior != null ? data.porcentaje - data.porcentajeAnterior : null;
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
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-semibold tabular-nums text-foreground">
            {formatPorcentaje(data.porcentaje)}
          </p>
          {delta != null && delta !== 0 ? (
            <span
              className={`flex items-center text-sm font-medium tabular-nums ${delta > 0 ? "text-emerald-600" : "text-red-600"}`}
              title={`Periodo anterior: ${formatPorcentaje(data.porcentajeAnterior)}`}
            >
              {delta > 0 ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
              {Math.abs(delta).toFixed(1)} pp
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {data.conversacionesIa.toLocaleString("es-CO")} de {data.totalConversaciones.toLocaleString("es-CO")} conversaciones
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          Camila {formatPorcentaje(data.porcentajeCamila)} · Sami {formatPorcentaje(data.porcentajeSami)}
        </p>
      </div>
    </div>
  );
}
