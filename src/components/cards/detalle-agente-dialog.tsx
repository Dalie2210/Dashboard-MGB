"use client";

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DetalleTable, EnlaceConversacion, type Columna } from "@/components/cards/detalle-table";
import { formatFechaDia, formatNumero } from "@/lib/format";
import { linkConversacionGhl } from "@/lib/ghl-links";
import type { DateRange } from "@/lib/date-ranges";
import type { DetalleItem, DetalleResponse, DetalleTipo } from "@/types/metrics-agentes";

export type DetalleSeleccion = { tipo: DetalleTipo; titulo: string };

/** Columnas con valores categóricos reciben selector de filtro; las numéricas se ordenan por su valor crudo. */
const CELDA_CATEGORICA: DetalleTipo[] = ["atendidas", "escaladas", "csat"];

async function fetchDetalle(agenteId: string, range: DateRange, tipo: DetalleTipo): Promise<DetalleResponse> {
  const params = new URLSearchParams({ from: range.from, to: range.to, tipo });
  const res = await fetch(`/api/metrics/agente/${agenteId}/detalle?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudo cargar el detalle.");
  return res.json();
}

export function DetalleAgenteDialog({
  agenteId,
  range,
  seleccion,
  onClose,
}: {
  agenteId: string;
  range: DateRange;
  seleccion: DetalleSeleccion | null;
  onClose: () => void;
}) {
  const open = seleccion != null;

  const query = useQuery({
    queryKey: ["detalle-agente", agenteId, range.from, range.to, seleccion?.tipo ?? ""],
    queryFn: () => fetchDetalle(agenteId, range, seleccion!.tipo),
    enabled: open,
  });

  const items = query.data?.items ?? [];

  const columnas: Columna<DetalleItem>[] = [
    { id: "fecha", header: "Fecha", valor: (f) => f.fecha, texto: (f) => formatFechaDia(f.fecha) },
    {
      id: "celda",
      header: query.data?.columna ?? "",
      valor: (f) => f.valor ?? f.celda,
      texto: (f) => f.celda,
      filtro: seleccion && CELDA_CATEGORICA.includes(seleccion.tipo) ? "opciones" : undefined,
    },
    {
      id: "link",
      header: "Link de la conversación",
      render: (f) => <EnlaceConversacion href={linkConversacionGhl(f.contactId, f.conversationId)} />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{seleccion?.titulo}</DialogTitle>
          <DialogDescription>
            {query.isLoading
              ? "Cargando conversaciones…"
              : query.isError
                ? "No se pudo cargar el detalle."
                : `${formatNumero(items.length)}${query.data?.truncado ? "+" : ""} registro(s) en el período`}
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
            <p className="py-6 text-sm text-muted-foreground">Sin registros en este período</p>
          ) : (
            <DetalleTable key={seleccion?.tipo} filas={items} columnas={columnas} />
          )}
          {query.data?.truncado ? (
            <p className="mt-2 text-xs text-muted-foreground">Se muestran los primeros 2.000 registros.</p>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
