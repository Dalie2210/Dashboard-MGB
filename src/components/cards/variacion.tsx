import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatPorcentaje } from "@/lib/format";

/**
 * Variación porcentual frente al período anterior. Si el anterior no tiene
 * base (0 o sin dato) no hay porcentaje que calcular, así que se avisa.
 */
export function Variacion({
  actual,
  anterior,
  formatear,
}: {
  actual: number | null;
  anterior: number | null;
  formatear: (valor: number | null) => string;
}) {
  if (actual == null || anterior == null || anterior === 0) {
    return <p className="text-xs text-muted-foreground">Sin datos en el período anterior</p>;
  }

  const cambio = ((actual - anterior) / anterior) * 100;
  const igual = Math.abs(cambio) < 0.05;
  const Icono = igual ? Minus : cambio > 0 ? ArrowUpRight : ArrowDownRight;
  const color = igual ? "text-muted-foreground" : cambio > 0 ? "text-emerald-600" : "text-red-600";

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
      <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${color}`}>
        <Icono className="size-3.5" aria-hidden />
        {igual ? "0%" : `${cambio > 0 ? "+" : ""}${formatPorcentaje(cambio, 1)}`}
      </span>
      <span>vs. período anterior ({formatear(anterior)})</span>
    </p>
  );
}
