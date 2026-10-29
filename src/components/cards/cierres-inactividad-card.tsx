"use client";

import { BarChart, Bar, XAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ACCENT_SECONDARY } from "@/lib/chart-colors";
import { formatNumero, formatPorcentaje } from "@/lib/format";
import type { CierresInactividadMetric } from "@/types/metrics";

const chartConfig = {
  valor: { label: "Cierres por inactividad", color: ACCENT_SECONDARY },
} satisfies ChartConfig;

export function CierresInactividadCard({ data }: { data: CierresInactividadMetric }) {
  const puntos = data.serieDiaria.map((p) => ({
    ...p,
    label: format(new Date(`${p.fecha}T00:00:00`), "d MMM", { locale: es }),
  }));

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
      <div className="flex shrink-0 flex-col gap-1 md:w-56">
        <p className="text-3xl font-semibold tabular-nums text-foreground">{formatNumero(data.inactividad)}</p>
        <p className="text-xs text-muted-foreground">
          {formatPorcentaje(data.porcentaje)} de los cierres del período · {formatNumero(data.resueltos)} resueltos
        </p>
        <p className="text-xs text-muted-foreground">Clic para ver el detalle</p>
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-40 w-full">
        <BarChart data={puntos} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="valor" fill={ACCENT_SECONDARY} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
