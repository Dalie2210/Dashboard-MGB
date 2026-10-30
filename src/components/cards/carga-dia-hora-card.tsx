"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ACCENT_PRIMARY } from "@/lib/chart-colors";
import type { CargaMetric } from "@/types/metrics-agentes";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const chartConfig = {
  conteo: { label: "Conversaciones", color: ACCENT_PRIMARY },
} satisfies ChartConfig;

/** Horario laboral (hora de Colombia): `dias` 1=lunes … 7=domingo; `horaFin` es exclusiva. */
export type HorarioLaboral = { dias: number[]; horaInicio: number; horaFin: number };

const FUERA_DE_HORARIO = "var(--muted-foreground)";

export function CargaDiaHoraCard({ data, horario }: { data: CargaMetric; horario?: HorarioLaboral }) {
  const diaLaboral = (d: number) => !horario || horario.dias.includes(d);
  const horaLaboral = (h: number) => !horario || (h >= horario.horaInicio && h < horario.horaFin);
  const porDia = data.porDia.map((d) => ({ etiqueta: DIAS[d.clave - 1], conteo: d.conteo, laboral: diaLaboral(d.clave) }));
  const porHora = data.porHora.map((h) => ({ etiqueta: `${h.clave}h`, conteo: h.conteo, laboral: horaLaboral(h.clave) }));

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
            <Bar dataKey="conteo" fill={ACCENT_PRIMARY} radius={[4, 4, 0, 0]}>
              {porDia.map((d) => (
                <Cell key={d.etiqueta} fill={d.laboral ? ACCENT_PRIMARY : FUERA_DE_HORARIO} fillOpacity={d.laboral ? 1 : 0.35} />
              ))}
            </Bar>
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
            <Bar dataKey="conteo" fill={ACCENT_PRIMARY} radius={[4, 4, 0, 0]}>
              {porHora.map((h) => (
                <Cell key={h.etiqueta} fill={h.laboral ? ACCENT_PRIMARY : FUERA_DE_HORARIO} fillOpacity={h.laboral ? 1 : 0.35} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      {horario ? (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: ACCENT_PRIMARY }} />
            Horario laboral
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm opacity-35" style={{ backgroundColor: FUERA_DE_HORARIO }} />
            Fuera de horario
          </span>
        </div>
      ) : null}
    </div>
  );
}
