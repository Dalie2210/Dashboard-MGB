"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CSAT_ORDINAL_STEPS } from "@/lib/chart-colors";
import type { CsatMetric } from "@/types/metrics";

const chartConfig = {
  conteo: { label: "Respuestas" },
} satisfies ChartConfig;

export function CsatDistribucionCard({ data }: { data: CsatMetric }) {
  const porScore = new Map(data.distribucion.map((d) => [d.score, d.conteo]));
  const puntos = [1, 2, 3, 4, 5].map((score) => ({
    score: `${score} ★`,
    conteo: porScore.get(score) ?? 0,
    color: CSAT_ORDINAL_STEPS[score - 1],
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
      <BarChart data={puntos} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="score" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="conteo" radius={[4, 4, 0, 0]}>
          {puntos.map((p) => (
            <Cell key={p.score} fill={p.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
