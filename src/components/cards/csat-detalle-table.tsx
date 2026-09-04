"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CSAT_ORDINAL_STEPS } from "@/lib/chart-colors";
import type { DateRange } from "@/lib/date-ranges";
import type { CsatDetalleItem } from "@/types/metrics";

const LOCATION_ID = "Za8gp9YSfx5AFbf4OOgb";

function linkContacto(contactId: string): string {
  return `https://app.fanel.ai/v2/location/${LOCATION_ID}/contacts/detail/${contactId}`;
}

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const SCORES = [1, 2, 3, 4, 5] as const;
const SCORES_POR_DEFECTO = [1, 2, 3];

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
        <div className={cn("overflow-x-auto rounded-lg border border-border", isUpdating && "opacity-60")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Contacto</th>
                <th className="px-3 py-2 font-medium">Calificación</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={`${item.contactId}-${item.fecha}-${i}`} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 tabular-nums text-foreground">{formatFecha(item.fecha)}</td>
                  <td className="px-3 py-2">
                    <a
                      href={linkContacto(item.contactId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Ver detalle del contacto
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      variant="secondary"
                      style={{ backgroundColor: CSAT_ORDINAL_STEPS[item.score - 1], color: "white" }}
                    >
                      {item.score} ★
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
