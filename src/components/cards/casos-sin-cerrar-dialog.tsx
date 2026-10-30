"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetalleTable, EnlaceConversacion, type Columna } from "@/components/cards/detalle-table";
import { formatNumero } from "@/lib/format";
import { linkConversacionGhl } from "@/lib/ghl-links";
import type { DateRange } from "@/lib/date-ranges";
import type { CasoSinCerrarItem } from "@/types/metrics-agentes";

export const MS_POR_DIA = 24 * 60 * 60 * 1000;

function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
}

export function diasAbierto(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / MS_POR_DIA);
}

const COLUMNAS: Columna<CasoSinCerrarItem>[] = [
  { id: "recibido", header: "Recibido", valor: (f) => f.recibidoAt, texto: (f) => formatFechaHora(f.recibidoAt) },
  {
    id: "dias",
    header: "Días abierto",
    valor: (f) => diasAbierto(f.recibidoAt),
    texto: (f) => formatNumero(diasAbierto(f.recibidoAt)),
  },
  {
    id: "motivo",
    header: "Motivo de escalamiento",
    valor: (f) => f.motivo,
    texto: (f) => f.motivo ?? "—",
    filtro: "opciones",
  },
  {
    id: "link",
    header: "Link de la conversación",
    render: (f) => <EnlaceConversacion href={linkConversacionGhl(f.contactId, f.conversationId)} />,
  },
];

export async function fetchCasosSinCerrar(range: DateRange): Promise<CasoSinCerrarItem[]> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  const res = await fetch(`/api/metrics/casos-sin-cerrar-detalle?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudo cargar el detalle de casos sin cerrar.");
  const body = await res.json();
  return body.items;
}

export function CasosSinCerrarDialog({
  range,
  open,
  onOpenChange,
}: {
  range: DateRange;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const query = useQuery({
    queryKey: ["casos-sin-cerrar-detalle", range.from, range.to],
    queryFn: () => fetchCasosSinCerrar(range),
    enabled: open,
  });

  const items = query.data ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Casos sin cerrar</DialogTitle>
          <DialogDescription>
            {query.isLoading
              ? "Cargando casos…"
              : `${formatNumero(items.length)} caso(s) recibidos sin conversación cerrada posterior`}
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
            <p className="py-6 text-sm text-muted-foreground">Sin casos abiertos en este período</p>
          ) : (
            <DetalleTable filas={items} columnas={COLUMNAS} ordenInicial={{ id: "recibido", dir: "asc" }} />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
