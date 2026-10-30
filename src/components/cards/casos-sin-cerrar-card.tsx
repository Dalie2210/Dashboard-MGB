"use client";

import { useQuery } from "@tanstack/react-query";
import { diasAbierto, fetchCasosSinCerrar } from "@/components/cards/casos-sin-cerrar-dialog";
import { formatNumero } from "@/lib/format";
import type { DateRange } from "@/lib/date-ranges";

const TRAMOS = [
  { nombre: "Menos de 1 día", max: 1, urgente: false },
  { nombre: "1 a 3 días", max: 3, urgente: false },
  { nombre: "3 a 7 días", max: 7, urgente: true },
  { nombre: "Más de 7 días", max: Infinity, urgente: true },
];

export function CasosSinCerrarCard({ range, sinCerrar }: { range: DateRange; sinCerrar: number }) {
  const query = useQuery({
    queryKey: ["casos-sin-cerrar-detalle", range.from, range.to],
    queryFn: () => fetchCasosSinCerrar(range),
  });

  const items = query.data;
  const total = items?.length ?? sinCerrar;
  const conteos = TRAMOS.map(() => 0);
  for (const f of items ?? []) {
    const dias = diasAbierto(f.recibidoAt);
    const i = TRAMOS.findIndex((t) => dias < t.max);
    conteos[i] += 1;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-4xl font-semibold tabular-nums text-foreground">{formatNumero(total)}</p>
      {items ? (
        <ul className="flex flex-col gap-1 border-t border-border pt-2 text-xs">
          {TRAMOS.map((t, i) => (
            <li key={t.nombre} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{t.nombre}</span>
              <span
                className={`font-medium tabular-nums ${t.urgente && conteos[i] > 0 ? "text-red-600" : "text-foreground"}`}
              >
                {formatNumero(conteos[i])}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">recibidos sin cierre posterior</p>
      )}
    </div>
  );
}
