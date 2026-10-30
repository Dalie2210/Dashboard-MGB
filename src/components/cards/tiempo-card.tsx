"use client";

import { LineChart, Line, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatDuracion } from "@/lib/format";
import type { TiempoMetric } from "@/types/metrics";

const chartConfig = {
  valor: { label: "Segundos" },
} satisfies ChartConfig;

export function TiempoCard({
  data,
  color,
  minMuestras = 0,
}: {
  data: TiempoMetric;
  color: string;
  minMuestras?: number;
}) {
  const insuficiente = data.muestras < minMuestras;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p
          className={`text-3xl font-semibold tabular-nums ${
            insuficiente ? "text-muted-foreground/60" : "text-foreground"
          }`}
        >
          {formatDuracion(data.medianaSegundos)}
        </p>
        <p className="text-xs text-muted-foreground">
          promedio {formatDuracion(data.promedioSegundos)} · {data.muestras.toLocaleString("es-CO")} muestras
        </p>
        {insuficiente ? (
          <p className="text-xs font-medium text-muted-foreground">
            Muestra insuficiente
            {data.muestras === 1 ? " · un solo dato no sirve como indicador" : ""}
          </p>
        ) : null}
      </div>
      {data.serieDiaria.length > 1 && !insuficiente ? (
        <ChartContainer config={chartConfig} className="aspect-auto h-14 w-28 shrink-0">
          <LineChart data={data.serieDiaria} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Line dataKey="valor" type="monotone" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      ) : null}
    </div>
  );
}
