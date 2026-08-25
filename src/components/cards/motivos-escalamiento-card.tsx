"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CATEGORICAL_THEME } from "@/lib/chart-colors";
import type { MotivoItem } from "@/types/metrics-agentes";

const chartConfig = {
  conteo: { label: "Escalamientos" },
} satisfies ChartConfig;

export function MotivosEscalamientoCard({ data }: { data: MotivoItem[] }) {
  const puntos = data.map((d, i) => ({
    motivo: d.motivo,
    conteo: d.conteo,
    color: CATEGORICAL_THEME[i % CATEGORICAL_THEME.length],
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
      <BarChart data={puntos} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="motivo"
          tickLine={false}
          axisLine={false}
          width={110}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="motivo" />} />
        <Bar dataKey="conteo" radius={[0, 4, 4, 0]}>
          {puntos.map((p) => (
            <Cell key={p.motivo} fill={p.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
