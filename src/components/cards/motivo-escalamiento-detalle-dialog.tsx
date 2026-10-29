"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetalleTable, EnlaceConversacion, type Columna } from "@/components/cards/detalle-table";
import { formatFechaDia, formatNumero } from "@/lib/format";
import { linkConversacionGhl } from "@/lib/ghl-links";
import { etiquetaTopico } from "@/lib/topicos";
import type { DateRange } from "@/lib/date-ranges";
import type { MotivoDetalleItem } from "@/types/metrics-agentes";

const COLUMNAS: Columna<MotivoDetalleItem>[] = [
  { id: "fecha", header: "Fecha", valor: (f) => f.fecha, texto: (f) => formatFechaDia(f.fecha) },
  {
    id: "motivo",
    header: "Motivo de escalamiento",
    valor: (f) => f.motivo,
    texto: (f) => etiquetaTopico(f.motivo),
    filtro: "opciones",
  },
  { id: "detalle", header: "Detalle", valor: (f) => f.detalle, texto: (f) => f.detalle ?? "—" },
  {
    id: "link",
    header: "Link de la conversación",
    render: (f) => <EnlaceConversacion href={linkConversacionGhl(f.contactId)} />,
  },
];

async function fetchMotivoDetalle(
  range: DateRange,
  motivos: string[],
  agenteOrigen: string | undefined
): Promise<MotivoDetalleItem[]> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  for (const motivo of motivos) params.append("motivo", motivo);
  if (agenteOrigen) params.set("origen", agenteOrigen);
  const res = await fetch(`/api/metrics/motivos-escalamiento-detalle?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudo cargar el detalle del motivo de escalamiento.");
  const body = await res.json();
  return body.items;
}

export function MotivoEscalamientoDetalleDialog({
  range,
  agenteOrigen,
  seleccion,
  onOpenChange,
}: {
  range: DateRange;
  agenteOrigen?: string;
  seleccion: { titulo: string; motivos: string[] } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = seleccion != null;

  const query = useQuery({
    queryKey: ["motivo-escalamiento-detalle", range.from, range.to, agenteOrigen ?? "", seleccion?.motivos.join("|") ?? ""],
    queryFn: () => fetchMotivoDetalle(range, seleccion!.motivos, agenteOrigen),
    enabled: open,
  });

  const items = query.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seleccion?.titulo}</DialogTitle>
          <DialogDescription>
            {query.isLoading ? "Cargando conversaciones…" : `${formatNumero(items.length)} conversación(es) con este motivo`}
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
            <DetalleTable key={seleccion?.motivos.join("|")} filas={items} columnas={COLUMNAS} />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
