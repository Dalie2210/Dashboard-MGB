import type { ReactNode } from "react";

export function KpiCard({ valor, subtitulo, comparacion }: { valor: string; subtitulo?: string; comparacion?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-3xl font-semibold tabular-nums text-foreground">{valor}</p>
      {subtitulo ? <p className="text-xs text-muted-foreground">{subtitulo}</p> : null}
      {comparacion}
    </div>
  );
}
