"use client";

import { AreaChart, Area, XAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ACCENT_PRIMARY } from "@/lib/chart-colors";
import type { ConversacionesMetric } from "@/types/metrics";

const chartConfig = {
  valor: { label: "Conversaciones", color: ACCENT_PRIMARY },
} satisfies ChartConfig;

export function TendenciaConversacionesCard({ data }: { data: ConversacionesMetric }) {
  const puntos = data.serieDiaria.map((p) => ({
    ...p,
    label: format(new Date(`${p.fecha}T00:00:00`), "d MMM", { locale: es }),
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
      <AreaChart data={puntos} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fillConversaciones" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={ACCENT_PRIMARY} stopOpacity={0.35} />
            <stop offset="95%" stopColor={ACCENT_PRIMARY} stopOpacity={0.02} />
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
          stroke={ACCENT_PRIMARY}
          strokeWidth={2}
          fill="url(#fillConversaciones)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
