"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { BentoGrid, BentoCard } from "@/components/bento-grid";
import { TotalConversacionesCard } from "@/components/cards/total-conversaciones-card";
import { TiempoCard } from "@/components/cards/tiempo-card";
import { KpiCard } from "@/components/cards/kpi-card";
import { VentasCamilaCard } from "@/components/cards/ventas-camila-card";
import { CargaDiaHoraCard } from "@/components/cards/carga-dia-hora-card";
import { ResueltosAbiertosCard } from "@/components/cards/resueltos-abiertos-card";
import { MotivosEscalamientoCard } from "@/components/cards/motivos-escalamiento-card";
import { ACCENT_PRIMARY, ACCENT_SECONDARY } from "@/lib/chart-colors";
import { formatNumero, formatPorcentaje, formatUsd } from "@/lib/format";
import { CAMILA_ID, MELISSA_ID } from "@/lib/agentes";
import type { DateRange } from "@/lib/date-ranges";
import type { AgenteMetricsResponse } from "@/types/metrics-agentes";

async function fetchAgenteMetrics(agenteId: string, range: DateRange): Promise<AgenteMetricsResponse> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  const res = await fetch(`/api/metrics/agente/${agenteId}?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudieron cargar las métricas del agente.");
  return res.json();
}

export function AgentePanel({
  agenteId,
  range,
  activo,
}: {
  agenteId: string;
  range: DateRange;
  activo: boolean;
}) {
  const query = useQuery({
    queryKey: ["metrics-agente", agenteId, range.from, range.to],
    queryFn: () => fetchAgenteMetrics(agenteId, range),
    enabled: activo,
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const isInitialLoading = query.isLoading;
  const isUpdating = query.isFetching && !query.isLoading;

  if (query.isError) {
    return (
      <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        No se pudieron cargar las métricas de este agente. Intenta de nuevo en unos segundos.
      </p>
    );
  }

  const atendidasVacio = data != null && data.atendidas.total === 0;

  return (
    <BentoGrid>
      <BentoCard span={4} title="Cantidad atendida" loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
        {data ? <TotalConversacionesCard data={data.atendidas} /> : null}
      </BentoCard>

      <BentoCard
        span={4}
        title="Tiempo promedio de respuesta"
        hint={
          data && data.tiempoRespuesta.sinSesion > 0
            ? `${formatNumero(data.tiempoRespuesta.sinSesion)} registros sin sesión asociada, excluidos`
            : undefined
        }
        loading={isInitialLoading}
        updating={isUpdating}
        empty={data != null && data.tiempoRespuesta.muestras === 0}
      >
        {data ? <TiempoCard data={data.tiempoRespuesta} color={ACCENT_PRIMARY} /> : null}
      </BentoCard>

      {agenteId === CAMILA_ID ? (
        <>
          <BentoCard span={4} title="% de cierre" loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data ? <KpiCard valor={formatPorcentaje(data.porcentajeCierre)} subtitulo="compradores únicos / atendidas" /> : null}
          </BentoCard>

          <BentoCard
            span={8}
            title="Ingresos (ventas)"
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.ventas != null && data.ventas.transacciones === 0}
          >
            {data?.ventas ? <VentasCamilaCard data={data.ventas} /> : null}
          </BentoCard>

          <BentoCard
            span={4}
            title="% escalado a Melissa"
            loading={isInitialLoading}
            updating={isUpdating}
            empty={atendidasVacio}
          >
            {data?.escaladoAMelissa ? (
              <KpiCard
                valor={formatPorcentaje(data.escaladoAMelissa.porcentaje)}
                subtitulo={`${formatNumero(data.escaladoAMelissa.escaladas)} contactos escalados`}
              />
            ) : null}
          </BentoCard>

          <BentoCard span={4} title="Transacciones" loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data?.ventas ? <KpiCard valor={formatNumero(data.ventas.transacciones)} /> : null}
          </BentoCard>

          <BentoCard span={4} title="Ticket promedio" loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data?.ventas ? <KpiCard valor={formatUsd(data.ventas.ticketPromedio)} /> : null}
          </BentoCard>

          <BentoCard span={4} title="Compradores únicos" loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data?.ventas ? <KpiCard valor={formatNumero(data.ventas.compradores)} /> : null}
          </BentoCard>
        </>
      ) : null}

      {agenteId !== CAMILA_ID && agenteId !== MELISSA_ID ? (
        <>
          <BentoCard
            span={4}
            title="% resuelto sin escalar"
            loading={isInitialLoading}
            updating={isUpdating}
            empty={atendidasVacio}
          >
            {data?.resueltoSinEscalar ? (
              <KpiCard valor={formatPorcentaje(data.resueltoSinEscalar.porcentaje)} subtitulo="atendidas / no escaladas a Melissa" />
            ) : null}
          </BentoCard>

          <BentoCard
            span={4}
            title="% escalado a Melissa"
            loading={isInitialLoading}
            updating={isUpdating}
            empty={atendidasVacio}
          >
            {data?.escaladoAMelissa ? (
              <KpiCard
                valor={formatPorcentaje(data.escaladoAMelissa.porcentaje)}
                subtitulo={`${formatNumero(data.escaladoAMelissa.escaladas)} contactos escalados`}
              />
            ) : null}
          </BentoCard>
        </>
      ) : null}

      {agenteId === MELISSA_ID ? (
        <>
          <BentoCard span={4} title="Volumen recibido (total)" loading={isInitialLoading} updating={isUpdating}>
            {data?.volumenRecibido ? (
              <KpiCard
                valor={formatNumero(data.volumenRecibido.contactos)}
                subtitulo={`${formatNumero(data.volumenRecibido.asignaciones)} asignaciones · desglose por escalamiento pendiente`}
              />
            ) : null}
          </BentoCard>

          <BentoCard
            span={4}
            title="Tiempo de resolución tras recibir el caso"
            hint={
              data && data.tiempoResolucion && data.tiempoResolucion.sinCerrar > 0
                ? `${formatNumero(data.tiempoResolucion.sinCerrar)} casos aún sin cerrar`
                : undefined
            }
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.tiempoResolucion != null && data.tiempoResolucion.muestras === 0}
          >
            {data?.tiempoResolucion ? <TiempoCard data={data.tiempoResolucion} color={ACCENT_SECONDARY} /> : null}
          </BentoCard>

          <BentoCard
            span={4}
            title="Motivos de escalamiento"
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.motivosEscalamiento != null && data.motivosEscalamiento.length === 0}
          >
            {data?.motivosEscalamiento ? <MotivosEscalamientoCard data={data.motivosEscalamiento} /> : null}
          </BentoCard>

          <BentoCard span={6} title="Casos resueltos vs. abiertos" loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data ? <ResueltosAbiertosCard data={data.atendidas} /> : null}
          </BentoCard>

          <BentoCard span={6} title="Carga por día / hora" loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data?.cargaDiaHora ? <CargaDiaHoraCard data={data.cargaDiaHora} /> : null}
          </BentoCard>
        </>
      ) : null}
    </BentoGrid>
  );
}
