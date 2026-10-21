"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetalleTable, EnlaceConversacion, type Columna } from "@/components/cards/detalle-table";
import { formatFechaDia, formatNumero } from "@/lib/format";
import { linkConversacionGhl } from "@/lib/ghl-links";
import type { DateRange } from "@/lib/date-ranges";
import type { ResolucionDetalleItem } from "@/types/metrics-agentes";

const COLUMNAS: Columna<ResolucionDetalleItem>[] = [
  { id: "fecha", header: "Fecha", valor: (f) => f.fecha, texto: (f) => formatFechaDia(f.fecha) },
  { id: "resultado", header: "Resultado", valor: (f) => f.resultado, filtro: "opciones" },
  {
    id: "link",
    header: "Link de la conversación",
    render: (f) => <EnlaceConversacion href={linkConversacionGhl(f.contactId)} />,
  },
];

async function fetchResolucionesDetalle(
  range: DateRange,
  agenteIa: string,
  topicos: string[]
): Promise<ResolucionDetalleItem[]> {
  const params = new URLSearchParams({ from: range.from, to: range.to, agente: agenteIa });
  for (const topico of topicos) params.append("topico", topico);
  const res = await fetch(`/api/metrics/resoluciones-ia-detalle?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudo cargar el detalle de resoluciones.");
  const body = await res.json();
  return body.items;
}

export function ResolucionesDetalleDialog({
  range,
  agenteIa,
  seleccion,
  onOpenChange,
}: {
  range: DateRange;
  agenteIa: string;
  seleccion: { titulo: string; topicos: string[] } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = seleccion != null;

  const query = useQuery({
    queryKey: ["resoluciones-ia-detalle", range.from, range.to, agenteIa, seleccion?.topicos.join("|") ?? ""],
    queryFn: () => fetchResolucionesDetalle(range, agenteIa, seleccion!.topicos),
    enabled: open,
  });

  const items = query.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seleccion?.titulo}</DialogTitle>
          <DialogDescription>
            {query.isLoading ? "Cargando conversaciones…" : `${formatNumero(items.length)} conversación(es) resueltas en este tópico`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {query.isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Sin conversaciones en este período</p>
          ) : (
            <DetalleTable key={seleccion?.topicos.join("|")} filas={items} columnas={COLUMNAS} />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
