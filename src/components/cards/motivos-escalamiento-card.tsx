"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { MotivoEscalamientoDetalleDialog } from "@/components/cards/motivo-escalamiento-detalle-dialog";
import { ACCENT_PRIMARY, CATEGORICAL_OTROS_COLOR } from "@/lib/chart-colors";
import type { DateRange } from "@/lib/date-ranges";
import type { MotivoItem } from "@/types/metrics-agentes";

const chartConfig = {
  conteo: { label: "Escalamientos", color: ACCENT_PRIMARY },
} satisfies ChartConfig;

/** Motivos son texto libre: con muchos únicos, se agrupan los menos frecuentes en "Otros". */
const MAX_MOTIVOS = 8;
const ROW_HEIGHT_PX = 32;
const MIN_HEIGHT_PX = 220;
const MAX_LABEL_CHARS = 26;

const LEYENDA_TOPICOS =
  "T1 — Sin acceso al programa | T2 — Pago o suscripción | T3 — Cancelación o reembolso | T4 — Consulta general del programa | T5 — Caso no clasificado";

function truncar(texto: string) {
  return texto.length > MAX_LABEL_CHARS ? `${texto.slice(0, MAX_LABEL_CHARS - 1)}…` : texto;
}

type Punto = { motivo: string; etiqueta: string; conteo: number; esOtros: boolean; motivosOriginales: string[] };

export function MotivosEscalamientoCard({ data, range }: { data: MotivoItem[]; range: DateRange }) {
  const [seleccion, setSeleccion] = useState<{ titulo: string; motivos: string[] } | null>(null);

  const ordenado = [...data].sort((a, b) => b.conteo - a.conteo);
  const principales = ordenado.slice(0, MAX_MOTIVOS);
  const resto = ordenado.slice(MAX_MOTIVOS);
  const otrosConteo = resto.reduce((acc, d) => acc + d.conteo, 0);

  const puntos: Punto[] = [
    ...principales.map((d) => ({
      motivo: d.motivo,
      etiqueta: truncar(d.motivo),
      conteo: d.conteo,
      esOtros: false,
      motivosOriginales: [d.motivo],
    })),
    ...(otrosConteo > 0
      ? [
          {
            motivo: `Otros (${resto.length} motivos)`,
            etiqueta: `Otros (${resto.length})`,
            conteo: otrosConteo,
            esOtros: true,
            motivosOriginales: resto.map((d) => d.motivo),
          },
        ]
      : []),
  ];

  const altura = Math.max(MIN_HEIGHT_PX, puntos.length * ROW_HEIGHT_PX + 40);

  return (
    <>
      <ChartContainer config={chartConfig} className="aspect-auto w-full" style={{ height: altura }}>
        <BarChart data={puntos} layout="vertical" margin={{ left: 0, right: 24, top: 4, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" />
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="etiqueta"
            tickLine={false}
            axisLine={false}
            width={170}
            interval={0}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <ChartTooltip
            content={<ChartTooltipContent labelFormatter={(_, payload) => payload?.[0]?.payload?.motivo ?? ""} />}
          />
          <Bar dataKey="conteo" radius={[0, 4, 4, 0]}>
            {puntos.map((p, i) => (
              <Cell
                key={i}
                fill={p.esOtros ? CATEGORICAL_OTROS_COLOR : ACCENT_PRIMARY}
                cursor="pointer"
                onClick={() => setSeleccion({ titulo: p.motivo, motivos: p.motivosOriginales })}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>

      <p className="mt-2 truncate text-xs text-muted-foreground" title={LEYENDA_TOPICOS}>
        {LEYENDA_TOPICOS}
      </p>

      <MotivoEscalamientoDetalleDialog range={range} seleccion={seleccion} onOpenChange={(open) => !open && setSeleccion(null)} />
    </>
  );
}
