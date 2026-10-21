"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetalleTable, EnlaceConversacion, type Columna } from "@/components/cards/detalle-table";
import { formatFechaDia, formatNumero } from "@/lib/format";
import type { DateRange } from "@/lib/date-ranges";
import type { ObjecionCanal, ObjecionDetalleItem } from "@/types/metrics-agentes";

const LOCATION_ID = "Za8gp9YSfx5AFbf4OOgb";
const MANYCHAT_ACCOUNT_ID = "fb771336";

function linkConversacion(contactId: string, canal: ObjecionCanal): string {
  return canal === "ghl"
    ? `https://app.fanel.ai/v2/location/${LOCATION_ID}/contacts/detail/${contactId}`
    : `https://app.manychat.com/${MANYCHAT_ACCOUNT_ID}/chat/${contactId}`;
}

const ETIQUETA_CANAL: Record<ObjecionCanal, string> = { ghl: "GHL", manychat: "ManyChat" };

async function fetchObjecionDetalle(range: DateRange, categoria: string): Promise<ObjecionDetalleItem[]> {
  const params = new URLSearchParams({ from: range.from, to: range.to, categoria });
  const res = await fetch(`/api/metrics/objeciones-detalle?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudo cargar el detalle de la objeción.");
  const body = await res.json();
  return body.items;
}

export function ObjecionDetalleDialog({
  range,
  seleccion,
  onOpenChange,
}: {
  range: DateRange;
  seleccion: { titulo: string; categoria: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = seleccion != null;

  const query = useQuery({
    queryKey: ["objecion-detalle", range.from, range.to, seleccion?.categoria ?? ""],
    queryFn: () => fetchObjecionDetalle(range, seleccion!.categoria),
    enabled: open,
  });

  const items = query.data ?? [];

  const columnas: Columna<ObjecionDetalleItem>[] = [
    { id: "fecha", header: "Fecha", valor: (f) => f.fecha, texto: (f) => formatFechaDia(f.fecha) },
    {
      id: "objecion",
      header: "Objeción",
      valor: (f) => f.detalle ?? seleccion?.titulo ?? "",
    },
    { id: "canal", header: "Canal", valor: (f) => ETIQUETA_CANAL[f.canal], filtro: "opciones" },
    {
      id: "link",
      header: "Link de la conversación",
      render: (f) => <EnlaceConversacion href={linkConversacion(f.contactId, f.canal)} />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seleccion?.titulo}</DialogTitle>
          <DialogDescription>
            {query.isLoading ? "Cargando conversaciones…" : `${formatNumero(items.length)} conversación(es) con esta objeción`}
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
            <DetalleTable key={seleccion?.categoria} filas={items} columnas={columnas} />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
