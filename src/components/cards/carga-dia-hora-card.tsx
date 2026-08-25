"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ACCENT_PRIMARY } from "@/lib/chart-colors";
import type { CargaMetric } from "@/types/metrics-agentes";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const chartConfig = {
  conteo: { label: "Conversaciones", color: ACCENT_PRIMARY },
} satisfies ChartConfig;

export function CargaDiaHoraCard({ data }: { data: CargaMetric }) {
  const porDia = data.porDia.map((d) => ({ etiqueta: DIAS[d.clave - 1], conteo: d.conteo }));
  const porHora = data.porHora.map((h) => ({ etiqueta: `${h.clave}h`, conteo: h.conteo }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Por día de la semana</p>
        <ChartContainer config={chartConfig} className="aspect-auto h-32 w-full">
          <BarChart data={porDia} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="etiqueta"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis hide allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="conteo" fill={ACCENT_PRIMARY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Por hora del día</p>
        <ChartContainer config={chartConfig} className="aspect-auto h-32 w-full">
          <BarChart data={porHora} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="etiqueta"
              tickLine={false}
              axisLine={false}
              interval={2}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            />
            <YAxis hide allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="conteo" fill={ACCENT_PRIMARY} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
