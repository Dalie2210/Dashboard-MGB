import { formatNumero, formatPorcentaje } from "@/lib/format";
import { CATEGORICAL_THEME } from "@/lib/chart-colors";

type Etapa = { nombre: string; valor: number; color: string };

/** Embudo Recibidos → Atendidos → Cerrados; el ancho de cada barra es relativo a Recibidos. */
export function EmbudoAtencionCard({
  recibidos,
  atendidos,
  cerrados,
}: {
  recibidos: number;
  atendidos: number;
  cerrados: number;
}) {
  const etapas: Etapa[] = [
    { nombre: "Recibidos", valor: recibidos, color: CATEGORICAL_THEME[0] },
    { nombre: "Atendidos", valor: atendidos, color: CATEGORICAL_THEME[1] },
    { nombre: "Cerrados", valor: cerrados, color: CATEGORICAL_THEME[2] },
  ];
  const base = Math.max(recibidos, atendidos, cerrados, 1);

  return (
    <div className="flex flex-col gap-3">
      {etapas.map((e, i) => {
        const ancho = (e.valor / base) * 100;
        return (
          <div key={e.nombre} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{e.nombre}</span>
              <span className="tabular-nums">
                <span className="font-semibold text-foreground">{formatNumero(e.valor)}</span>
                {i > 0 ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatPorcentaje(recibidos > 0 ? (e.valor / recibidos) * 100 : null)} de recibidos
                  </span>
                ) : null}
              </span>
            </div>
            <div className="h-6 w-full rounded-md bg-muted">
              <div
                className="h-full rounded-md"
                style={{ width: `${e.valor > 0 ? Math.max(ancho, 2) : 0}%`, backgroundColor: e.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
