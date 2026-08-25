"use client";

import { AreaChart, Area, XAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ACCENT_SECONDARY } from "@/lib/chart-colors";
import { formatUsd } from "@/lib/format";
import type { VentasMetric } from "@/types/metrics-agentes";

const chartConfig = {
  valor: { label: "Ingresos", color: ACCENT_SECONDARY },
} satisfies ChartConfig;

export function VentasCamilaCard({ data }: { data: VentasMetric }) {
  const puntos = data.serieDiaria.map((p) => ({
    ...p,
    label: format(new Date(`${p.fecha}T00:00:00`), "d MMM", { locale: es }),
  }));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-3xl font-semibold tabular-nums text-foreground">
        {formatUsd(data.ingresos)}
      </p>
      <ChartContainer config={chartConfig} className="aspect-auto h-40 w-full">
        <AreaChart data={puntos} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="fillVentasCamila" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ACCENT_SECONDARY} stopOpacity={0.35} />
              <stop offset="95%" stopColor={ACCENT_SECONDARY} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            dataKey="valor"
            type="monotone"
            stroke={ACCENT_SECONDARY}
            strokeWidth={2}
            fill="url(#fillVentasCamila)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
