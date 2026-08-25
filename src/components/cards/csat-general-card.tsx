import { Badge } from "@/components/ui/badge";
import { formatDecimal, formatPorcentaje } from "@/lib/format";
import type { CsatMetric } from "@/types/metrics";

export function CsatGeneralCard({ data }: { data: CsatMetric }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-4xl font-semibold tabular-nums text-foreground">
        {formatDecimal(data.promedio, 1)}
        <span className="text-lg font-normal text-muted-foreground">/5</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="bg-[var(--sage-light)] text-foreground">
          {formatPorcentaje(data.csatPorcentaje)} satisfechos
        </Badge>
        <span className="text-xs text-muted-foreground">
          {data.respuestas.toLocaleString("es-CO")} respuestas
        </span>
      </div>
    </div>
  );
}
