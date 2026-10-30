import { Badge } from "@/components/ui/badge";
import { nombreAgente } from "@/lib/agentes";
import { formatDecimal, formatPorcentaje } from "@/lib/format";
import type { CsatMetric } from "@/types/metrics";

export function CsatGeneralCard({ data }: { data: CsatMetric }) {
  const solicitudes = data.respuestas + data.pendientesEnRango;

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
      <p className="text-xs text-muted-foreground">
        Tasa de respuesta: {data.respuestas.toLocaleString("es-CO")} de {solicitudes.toLocaleString("es-CO")} (
        {formatPorcentaje(data.tasaRespuesta)})
      </p>
      {data.porAgente && data.porAgente.length > 0 ? (
        <ul className="flex flex-col gap-1 border-t pt-2 text-xs">
          {data.porAgente.map((a) => (
            <li key={a.agenteId} className="flex items-center justify-between gap-2">
              <span className="text-foreground">{nombreAgente(a.agenteId)}</span>
              <span className="tabular-nums text-muted-foreground">
                <span className="font-medium text-foreground">
                  {a.promedio != null ? `${formatDecimal(a.promedio, 1)}/5` : "—"}
                </span>{" "}
                · {a.respuestas.toLocaleString("es-CO")} resp. · {formatPorcentaje(a.tasaRespuesta)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
