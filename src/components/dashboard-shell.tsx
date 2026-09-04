"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/date-range-picker";
import { BentoGrid, BentoCard } from "@/components/bento-grid";
import { TotalConversacionesCard } from "@/components/cards/total-conversaciones-card";
import { ResueltoIaCard } from "@/components/cards/resuelto-ia-card";
import { CsatGeneralCard } from "@/components/cards/csat-general-card";
import { TendenciaConversacionesCard } from "@/components/cards/tendencia-conversaciones-card";
import { ChatsPorAgenteCard } from "@/components/cards/chats-por-agente-card";
import { TiempoCard } from "@/components/cards/tiempo-card";
import { CsatDistribucionCard } from "@/components/cards/csat-distribucion-card";
import { CsatDetalleTable } from "@/components/cards/csat-detalle-table";
import { AgentePanel } from "@/components/agente-panel";
import { ACCENT_PRIMARY, ACCENT_SECONDARY } from "@/lib/chart-colors";
import { esRangoValido, rangoPorDefecto, type DateRange } from "@/lib/date-ranges";
import { AGENTES_CON_PANEL, nombreAgente } from "@/lib/agentes";
import type { MetricsResponse } from "@/types/metrics";

const TAB_POR_DEFECTO = "resumen";

async function fetchMetrics(range: DateRange): Promise<MetricsResponse> {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  const res = await fetch(`/api/metrics?${params.toString()}`);
  if (!res.ok) throw new Error("No se pudieron cargar las métricas.");
  return res.json();
}

export function DashboardShell() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const range: DateRange =
    esRangoValido(searchParams.get("from"), searchParams.get("to")) ?? rangoPorDefecto();

  const tabParam = searchParams.get("tab");
  const tabActiva = tabParam && [TAB_POR_DEFECTO, ...AGENTES_CON_PANEL].includes(tabParam) ? tabParam : TAB_POR_DEFECTO;

  const setRange = useCallback(
    (next: DateRange) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", next.from);
      params.set("to", next.to);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const setTab = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const query = useQuery({
    queryKey: ["metrics", range.from, range.to],
    queryFn: () => fetchMetrics(range),
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const isInitialLoading = query.isLoading;
  const isUpdating = query.isFetching && !query.isLoading;

  const conversacionesVacio = useMemo(() => data != null && data.conversaciones.total === 0, [data]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard SAC</h1>
          <p className="text-sm text-muted-foreground">Be Welly · Soporte y Atención al Cliente</p>
        </div>
        <DateRangePicker value={range} onChange={setRange} />
      </header>

      <Tabs value={tabActiva} onValueChange={(v) => setTab(v as string)}>
        <TabsList>
          <TabsTrigger value={TAB_POR_DEFECTO}>Resumen general</TabsTrigger>
          {AGENTES_CON_PANEL.map((id) => (
            <TabsTrigger key={id} value={id}>
              {nombreAgente(id)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={TAB_POR_DEFECTO}>
          {query.isError ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              No se pudieron cargar las métricas. Intenta de nuevo en unos segundos.
            </p>
          ) : null}

          <BentoGrid>
            <BentoCard span={4} title="Total de conversaciones" loading={isInitialLoading} updating={isUpdating} empty={conversacionesVacio}>
              {data ? <TotalConversacionesCard data={data.conversaciones} /> : null}
            </BentoCard>

            <BentoCard
              span={4}
              title="% resuelto por IA"
              loading={isInitialLoading}
              updating={isUpdating}
              empty={data != null && data.resueltoIa.totalConversaciones === 0}
            >
              {data ? <ResueltoIaCard data={data.resueltoIa} /> : null}
            </BentoCard>

            <BentoCard
              span={4}
              title="CSAT general"
              loading={isInitialLoading}
              updating={isUpdating}
              empty={data != null && data.csat.respuestas === 0}
            >
              {data ? <CsatGeneralCard data={data.csat} /> : null}
            </BentoCard>

            <BentoCard
              span={7}
              title="Tendencia diaria de conversaciones"
              loading={isInitialLoading}
              updating={isUpdating}
              empty={conversacionesVacio}
            >
              {data ? <TendenciaConversacionesCard data={data.conversaciones} /> : null}
            </BentoCard>

            <BentoCard
              span={5}
              title="Chats por agente"
              loading={isInitialLoading}
              updating={isUpdating}
              empty={data != null && data.chatsPorAgente.totalChats === 0}
            >
              {data ? <ChatsPorAgenteCard data={data.chatsPorAgente} /> : null}
            </BentoCard>

            <BentoCard
              span={6}
              title="Tiempo de primera respuesta (mediana)"
              loading={isInitialLoading}
              updating={isUpdating}
              empty={data != null && data.primeraRespuesta.muestras === 0}
            >
              {data ? <TiempoCard data={data.primeraRespuesta} color={ACCENT_PRIMARY} /> : null}
            </BentoCard>

            <BentoCard
              span={6}
              title="Tiempo de resolución (mediana)"
              loading={isInitialLoading}
              updating={isUpdating}
              empty={data != null && data.tiempoResolucion.muestras === 0}
            >
              {data ? <TiempoCard data={data.tiempoResolucion} color={ACCENT_SECONDARY} /> : null}
            </BentoCard>

            <BentoCard
              span={12}
              title="Distribución CSAT (1–5)"
              loading={isInitialLoading}
              updating={isUpdating}
              empty={data != null && data.csat.respuestas === 0}
            >
              {data ? <CsatDistribucionCard data={data.csat} /> : null}
            </BentoCard>

            <BentoCard span={12} title="Detalle de calificaciones" loading={isInitialLoading} updating={isUpdating}>
              {data ? <CsatDetalleTable range={range} /> : null}
            </BentoCard>
          </BentoGrid>
        </TabsContent>

        {AGENTES_CON_PANEL.map((id) => (
          <TabsContent key={id} value={id}>
            <AgentePanel agenteId={id} range={range} activo={tabActiva === id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
