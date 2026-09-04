"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNumero } from "@/lib/format";
import type { DateRange } from "@/lib/date-ranges";
import type { MotivoDetalleItem } from "@/types/metrics-agentes";

const LOCATION_ID = "Za8gp9YSfx5AFbf4OOgb";

function linkConversacion(contactId: string): string {
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

async function fetchMotivoDetalle(range: DateRange, motivos: string[]): Promise<MotivoDetalleItem[]> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  for (const motivo of motivos) params.append("motivo", motivo);
  const res = await fetch(`/api/metrics/motivos-escalamiento-detalle?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudo cargar el detalle del motivo de escalamiento.");
  const body = await res.json();
  return body.items;
}

export function MotivoEscalamientoDetalleDialog({
  range,
  seleccion,
  onOpenChange,
}: {
  range: DateRange;
  seleccion: { titulo: string; motivos: string[] } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = seleccion != null;

  const query = useQuery({
    queryKey: ["motivo-escalamiento-detalle", range.from, range.to, seleccion?.motivos.join("|") ?? ""],
    queryFn: () => fetchMotivoDetalle(range, seleccion!.motivos),
    enabled: open,
  });

  const items = query.data ?? [];
  const isLoading = query.isLoading;
  const isUpdating = query.isFetching && !query.isLoading;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seleccion?.titulo}</DialogTitle>
          <DialogDescription>
            {isLoading ? "Cargando conversaciones…" : `${formatNumero(items.length)} conversación(es) con este motivo`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Sin conversaciones en este período</p>
          ) : (
            <div className={cn("overflow-x-auto rounded-lg border border-border", isUpdating && "opacity-60")}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Motivo de escalamiento</th>
                    <th className="px-3 py-2 font-medium">Link de la conversación</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={`${item.contactId}-${item.fecha}-${i}`} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums text-foreground">{formatFecha(item.fecha)}</td>
                      <td className="px-3 py-2 text-foreground">{item.motivo}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <a
                          href={linkConversacion(item.contactId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          Ver conversación
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
