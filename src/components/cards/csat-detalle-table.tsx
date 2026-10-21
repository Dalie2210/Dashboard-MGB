"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DetalleTable, EnlaceConversacion, type Columna } from "@/components/cards/detalle-table";
import { cn } from "@/lib/utils";
import { CSAT_ORDINAL_STEPS } from "@/lib/chart-colors";
import { formatFechaDia } from "@/lib/format";
import { linkConversacionGhl } from "@/lib/ghl-links";
import type { DateRange } from "@/lib/date-ranges";
import type { CsatDetalleItem } from "@/types/metrics";

const SCORES = [1, 2, 3, 4, 5] as const;
const SCORES_POR_DEFECTO = [1, 2, 3];

const COLUMNAS: Columna<CsatDetalleItem>[] = [
  { id: "fecha", header: "Fecha", valor: (f) => f.fecha, texto: (f) => formatFechaDia(f.fecha) },
  {
    id: "contacto",
    header: "Contacto",
    render: (f) => <EnlaceConversacion href={linkConversacionGhl(f.contactId)} />,
  },
  {
    id: "score",
    header: "Calificación",
    valor: (f) => f.score,
    texto: (f) => `${f.score} ★`,
    render: (f) => (
      <Badge variant="secondary" style={{ backgroundColor: CSAT_ORDINAL_STEPS[f.score - 1], color: "white" }}>
        {f.score} ★
      </Badge>
    ),
  },
];

async function fetchCsatDetalle(range: DateRange, scores: number[]): Promise<CsatDetalleItem[]> {
  const params = new URLSearchParams({ from: range.from, to: range.to, scores: scores.join(",") });
  const res = await fetch(`/api/metrics/csat-detalle?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudo cargar el detalle de CSAT.");
  const body = await res.json();
  return body.items;
}

export function CsatDetalleTable({ range }: { range: DateRange }) {
  const [scores, setScores] = useState<number[]>(SCORES_POR_DEFECTO);

  const toggleScore = (score: number) => {
    setScores((prev) =>
      prev.includes(score) ? prev.filter((s) => s !== score) : [...prev, score].sort()
    );
  };

  const query = useQuery({
    queryKey: ["csat-detalle", range.from, range.to, scores.join(",")],
    queryFn: () => fetchCsatDetalle(range, scores),
    enabled: scores.length > 0,
    placeholderData: keepPreviousData,
  });

  const items = scores.length > 0 ? query.data ?? [] : [];
  const isLoading = scores.length > 0 && query.isLoading;
  const isUpdating = scores.length > 0 && query.isFetching && !query.isLoading;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {SCORES.map((score) => {
          const activo = scores.includes(score);
          return (
            <Button
              key={score}
              type="button"
              variant={activo ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleScore(score)}
              aria-pressed={activo}
              className={cn(!activo && "text-muted-foreground")}
              style={activo ? { borderColor: CSAT_ORDINAL_STEPS[score - 1] } : undefined}
            >
              {score} ★
            </Button>
          );
        })}
      </div>

      {scores.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Selecciona al menos una calificación.</p>
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">Sin calificaciones en este período</p>
      ) : (
        <DetalleTable
          className={cn(isUpdating && "opacity-60")}
          filas={items}
          columnas={COLUMNAS}
          ordenInicial={{ id: "fecha", dir: "desc" }}
        />
      )}
    </div>
  );
}
