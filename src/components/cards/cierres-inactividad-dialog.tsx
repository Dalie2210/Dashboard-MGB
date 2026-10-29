"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetalleTable, EnlaceConversacion, type Columna } from "@/components/cards/detalle-table";
import { formatDuracion, formatFechaDia, formatNumero } from "@/lib/format";
import { linkConversacionGhl } from "@/lib/ghl-links";
import type { DateRange } from "@/lib/date-ranges";
import type { CierreInactividadItem } from "@/types/metrics";

const COLUMNAS: Columna<CierreInactividadItem>[] = [
  { id: "fecha", header: "Fecha", valor: (f) => f.fecha, texto: (f) => formatFechaDia(f.fecha) },
  {
    id: "duracion",
    header: "Duración de la conversación",
    valor: (f) => f.duracionSegundos,
    texto: (f) => formatDuracion(f.duracionSegundos),
  },
  {
    id: "link",
    header: "Link de la conversación",
    render: (f) => <EnlaceConversacion href={linkConversacionGhl(f.contactId, f.conversationId)} />,
  },
];

async function fetchCierresInactividad(range: DateRange): Promise<CierreInactividadItem[]> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  const res = await fetch(`/api/metrics/cierres-inactividad-detalle?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudo cargar el detalle de cierres por inactividad.");
  const body = await res.json();
  return body.items;
}

export function CierresInactividadDialog({
  range,
  open,
  onOpenChange,
}: {
  range: DateRange;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const query = useQuery({
    queryKey: ["cierres-inactividad-detalle", range.from, range.to],
    queryFn: () => fetchCierresInactividad(range),
    enabled: open,
  });

  const items = query.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cierres por inactividad</DialogTitle>
          <DialogDescription>
            {query.isLoading
              ? "Cargando conversaciones…"
              : `${formatNumero(items.length)} conversación(es) cerradas automáticamente tras 24 h sin respuesta de la clienta`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {query.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : query.isError ? (
            <p className="py-6 text-sm text-destructive">No se pudo cargar el detalle. Intenta de nuevo.</p>
          ) : items.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Sin cierres por inactividad en este período</p>
          ) : (
            <DetalleTable filas={items} columnas={COLUMNAS} ordenInicial={{ id: "fecha", dir: "desc" }} />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
