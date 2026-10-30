"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { BentoGrid, BentoCard } from "@/components/bento-grid";
import { TotalConversacionesCard } from "@/components/cards/total-conversaciones-card";
import { TiempoCard } from "@/components/cards/tiempo-card";
import { KpiCard } from "@/components/cards/kpi-card";
import { Variacion } from "@/components/cards/variacion";
import { VentasCamilaCard } from "@/components/cards/ventas-camila-card";
import { CargaDiaHoraCard } from "@/components/cards/carga-dia-hora-card";
import { ResueltosAbiertosCard } from "@/components/cards/resueltos-abiertos-card";
import { MotivosEscalamientoCard } from "@/components/cards/motivos-escalamiento-card";
import { ObjecionesCard } from "@/components/cards/objeciones-card";
import { DetalleAgenteDialog, type DetalleSeleccion } from "@/components/cards/detalle-agente-dialog";
import { CasosSinCerrarDialog } from "@/components/cards/casos-sin-cerrar-dialog";
import { CsatGeneralCard } from "@/components/cards/csat-general-card";
import { CsatDistribucionCard } from "@/components/cards/csat-distribucion-card";
import { ResolucionesTopicoCard } from "@/components/cards/resoluciones-topico-card";
import { ACCENT_PRIMARY, ACCENT_SECONDARY } from "@/lib/chart-colors";
import { formatNumero, formatPorcentaje, formatUsd } from "@/lib/format";
import { AGENTES, CAMILA_ID, MELISSA_ID, SAMI_ID, nombreAgente } from "@/lib/agentes";
import type { DateRange } from "@/lib/date-ranges";
import type { AgenteMetricsResponse, DetalleTipo } from "@/types/metrics-agentes";

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
  const [casosSinCerrarAbierto, setCasosSinCerrarAbierto] = useState(false);
  const [detalle, setDetalle] = useState<DetalleSeleccion | null>(null);
  const abrirDetalle = (tipo: DetalleTipo, titulo: string) => () => setDetalle({ tipo, titulo });

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
      <DetalleAgenteDialog
        agenteId={agenteId}
        range={range}
        seleccion={detalle}
        onClose={() => setDetalle(null)}
      />

      <BentoCard
        span={4}
        title="Cantidad atendida"
        nota="Conversaciones (chats) que tuvo este agente en el período, abiertas o cerradas. Una misma persona puede tener varias. No es lo mismo que contactos asignados: a un contacto se le puede asignar el agente sin que llegue a haber conversación."
        loading={isInitialLoading}
        updating={isUpdating}
        empty={atendidasVacio}
        onClick={abrirDetalle("atendidas", "Conversaciones atendidas")}
      >
        {data ? <TotalConversacionesCard data={data.atendidas} /> : null}
      </BentoCard>

      <BentoCard
        span={4}
        title="Tiempo de primera respuesta (mediana)"
        nota="Cuánto tarda el agente en contestar el primer mensaje de cada conversación. Se muestra la mediana (el valor del medio, menos sensible a casos extremos); el promedio aparece debajo."
        hint={
          data && data.tiempoRespuesta.sinSesion > 0
            ? `${formatNumero(data.tiempoRespuesta.sinSesion)} registros sin sesión asociada, excluidos`
            : undefined
        }
        loading={isInitialLoading}
        updating={isUpdating}
        empty={data != null && data.tiempoRespuesta.muestras === 0}
        onClick={abrirDetalle("tiempo-respuesta", "Tiempo de primera respuesta · más lentas primero")}
      >
        {data ? <TiempoCard data={data.tiempoRespuesta} color={ACCENT_PRIMARY} /> : null}
      </BentoCard>

      {agenteId === CAMILA_ID ? (
        <>
          <BentoCard span={4} title="% conversión a venta" nota="Compradores únicos (personas distintas con al menos una venta) dividido entre las conversaciones atendidas. No es lo mismo que las conversaciones cerradas." loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data ? <KpiCard valor={formatPorcentaje(data.porcentajeCierre)} subtitulo="compradores únicos / atendidas" /> : null}
          </BentoCard>

          <BentoCard
            span={8}
            title="Ingresos (ventas)"
            nota="Suma del valor de las ventas registradas en el período, con su evolución diaria."
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.ventas != null && data.ventas.transacciones === 0}
          >
            {data?.ventas ? <VentasCamilaCard data={data.ventas} /> : null}
          </BentoCard>

          <BentoCard
            span={4}
            title="% escalado a Melissa"
            nota="Contactos distintos que este agente pasó a Melissa, como porcentaje de las conversaciones atendidas. Haz clic para ver cuáles."
            loading={isInitialLoading}
            updating={isUpdating}
            empty={atendidasVacio}
            onClick={abrirDetalle("escaladas", "Contactos escalados a Melissa")}
          >
            {data?.escaladoAMelissa ? (
              <KpiCard
                valor={formatPorcentaje(data.escaladoAMelissa.porcentaje)}
                subtitulo={`${formatNumero(data.escaladoAMelissa.escaladas)} contactos escalados`}
              />
            ) : null}
          </BentoCard>

          <BentoCard span={4} title="Transacciones" nota="Número de ventas registradas en el período. Una persona puede tener más de una." loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data?.ventas ? <KpiCard
                valor={formatNumero(data.ventas.transacciones)}
                comparacion={<Variacion actual={data.ventas.transacciones} anterior={(data.ventas.anterior?.transacciones ?? null)} formatear={formatNumero} />}
              /> : null}
          </BentoCard>

          <BentoCard span={4} title="Ticket promedio" nota="Valor promedio por venta: ingresos divididos entre el número de transacciones." loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data?.ventas ? <KpiCard
                valor={formatUsd(data.ventas.ticketPromedio)}
                comparacion={<Variacion actual={data.ventas.ticketPromedio} anterior={(data.ventas.anterior?.ticketPromedio ?? null)} formatear={formatUsd} />}
              /> : null}
          </BentoCard>

          <BentoCard span={4} title="Compradores únicos" nota="Personas distintas (por correo) que compraron en el período, sin repetir a quien compró varias veces." loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data?.ventas ? <KpiCard
                valor={formatNumero(data.ventas.compradores)}
                comparacion={<Variacion actual={data.ventas.compradores} anterior={(data.ventas.anterior?.compradores ?? null)} formatear={formatNumero} />}
              /> : null}
          </BentoCard>

          <BentoCard
            span={12}
            title="Objeciones identificadas"
            nota="Razones por las que los clientes dudaron o no compraron, agrupadas por tipo. Haz clic en una para ver las conversaciones."
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.objeciones != null && data.objeciones.length === 0}
            expandible
          >
            {data?.objeciones ? <ObjecionesCard data={data.objeciones} range={range} /> : null}
          </BentoCard>

          <BentoCard
            span={12}
            title="Motivos de escalamiento a Melissa"
            nota="Por qué este agente pasó casos a Melissa, agrupado por motivo. Cada escalamiento cuenta una vez, así que el total puede superar los contactos escalados si a un contacto se le escaló más de una vez."
            hint={
              data?.motivosEscalamiento && data.motivosEscalamiento.length > 8
                ? "Se muestran los 8 motivos más frecuentes; el resto se agrupa en \"Otros\""
                : undefined
            }
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.motivosEscalamiento != null && data.motivosEscalamiento.length === 0}
            expandible
          >
            {data?.motivosEscalamiento ? (
              <MotivosEscalamientoCard data={data.motivosEscalamiento} range={range} agenteOrigen={CAMILA_ID} />
            ) : null}
          </BentoCard>
        </>
      ) : null}

      {agenteId !== CAMILA_ID && agenteId !== MELISSA_ID ? (
        <>
          <BentoCard
            span={4}
            title="% resuelto sin escalar"
            nota="Lo contrario de % escalado a Melissa: la parte de los casos que el agente resolvió sin necesidad de pasarlos a Melissa."
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
            nota="Contactos distintos que este agente pasó a Melissa, como porcentaje de las conversaciones atendidas. Haz clic para ver cuáles."
            loading={isInitialLoading}
            updating={isUpdating}
            empty={atendidasVacio}
            onClick={abrirDetalle("escaladas", "Contactos escalados a Melissa")}
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

      {agenteId === SAMI_ID ? (
        <>
          <BentoCard
            span={4}
            title="Tiempo de resolución"
            nota="Tiempo que pasa desde que empieza el caso hasta que el agente lo resuelve. Solo cuenta los casos resueltos en el período, por eso las muestras pueden ser pocas."
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.tiempoResolucionAgente != null && data.tiempoResolucionAgente.muestras === 0}
            onClick={abrirDetalle("tiempo-resolucion", "Tiempo de resolución · más lentas primero")}
          >
            {data?.tiempoResolucionAgente ? <TiempoCard data={data.tiempoResolucionAgente} color={ACCENT_SECONDARY} minMuestras={10} /> : null}
          </BentoCard>

          <BentoCard
            span={4}
            title="Contactos asignados"
            nota="Personas distintas a las que se les asignó este agente en el período. El número de asignaciones puede ser mayor porque a un mismo contacto se le puede asignar más de una vez. Es independiente de las conversaciones atendidas."
            loading={isInitialLoading}
            updating={isUpdating}
            onClick={abrirDetalle("asignaciones", "Contactos asignados")}
          >
            {data?.volumenRecibido ? (
              <KpiCard
                valor={formatNumero(data.volumenRecibido.contactos)}
                subtitulo={`${formatNumero(data.volumenRecibido.asignaciones)} asignaciones`}
              />
            ) : null}
          </BentoCard>

          <BentoCard
            span={6}
            title="Casos resueltos vs. abiertos"
            nota="Reparto de las conversaciones atendidas según su estado actual: cerradas (resueltas) o todavía abiertas."
            loading={isInitialLoading}
            updating={isUpdating}
            empty={atendidasVacio}
            onClick={abrirDetalle("atendidas", "Casos resueltos vs. abiertos")}
          >
            {data ? <ResueltosAbiertosCard data={data.atendidas} /> : null}
          </BentoCard>

          <BentoCard span={6} title="Carga por día / hora" nota="Cuántas conversaciones empezaron en cada día de la semana y en cada hora del día (hora de Colombia). Sirve para ver cuándo hay más demanda." loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data?.cargaDiaHora ? <CargaDiaHoraCard data={data.cargaDiaHora} /> : null}
          </BentoCard>

          <BentoCard
            span={4}
            title="CSAT de sus contactos"
            nota="Satisfacción del cliente (1 a 5) de las personas que tuvieron conversación con este agente. Una calificación de 4 o 5 cuenta como satisfecha. La encuesta no guarda el agente, por eso se atribuye por contacto."
            hint="Contactos con conversación de Sami en el período"
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.csat != null && data.csat.respuestas === 0}
            onClick={abrirDetalle("csat", "Calificaciones CSAT de sus contactos")}
          >
            {data?.csat ? <CsatGeneralCard data={data.csat} /> : null}
          </BentoCard>

          <BentoCard
            span={8}
            title="Distribución de calificaciones"
            nota="Cuántas respuestas recibió cada nota del 1 al 5."
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.csat != null && data.csat.respuestas === 0}
            onClick={abrirDetalle("csat", "Calificaciones CSAT de sus contactos")}
          >
            {data?.csat ? <CsatDistribucionCard data={data.csat} /> : null}
          </BentoCard>

          <BentoCard
            span={6}
            title="Resoluciones IA por tópico"
            nota="Casos que la IA resolvió por sí sola, agrupados por el tema (tópico) del caso. Compárala con los motivos de escalamiento para ver en qué temas Sami resuelve y en cuáles necesita más entrenamiento. Haz clic en una barra para ver las conversaciones."
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.resolucionesPorTopico != null && data.resolucionesPorTopico.length === 0}
            expandible
          >
            {data?.resolucionesPorTopico ? (
              <ResolucionesTopicoCard data={data.resolucionesPorTopico} range={range} agenteIa={AGENTES[SAMI_ID]} />
            ) : null}
          </BentoCard>

          <BentoCard
            span={6}
            title="Motivos de escalamiento a Melissa"
            nota="Por qué este agente pasó casos a Melissa, agrupado por motivo. Cada escalamiento cuenta una vez, así que el total puede superar los contactos escalados si a un contacto se le escaló más de una vez."
            hint={
              data?.motivosEscalamiento && data.motivosEscalamiento.length > 8
                ? "Se muestran los 8 motivos más frecuentes; el resto se agrupa en \"Otros\""
                : undefined
            }
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.motivosEscalamiento != null && data.motivosEscalamiento.length === 0}
            expandible
          >
            {data?.motivosEscalamiento ? (
              <MotivosEscalamientoCard data={data.motivosEscalamiento} range={range} agenteOrigen={SAMI_ID} />
            ) : null}
          </BentoCard>
        </>
      ) : null}

      {agenteId === MELISSA_ID ? (
        <>
          <BentoCard
            span={4}
            title="Volumen recibido (total)"
            nota="Personas distintas que le llegaron a Melissa en el período. Abajo se desglosa quién las escaló; 'sin escalamiento registrado' son contactos asignados directamente, sin un escalamiento asociado."
            loading={isInitialLoading}
            updating={isUpdating}
            onClick={abrirDetalle("asignaciones", "Contactos recibidos")}
          >
            {data?.volumenRecibido ? (
              <div className="flex flex-col gap-3">
                <KpiCard
                  valor={formatNumero(data.volumenRecibido.contactos)}
                  subtitulo={`${formatNumero(data.volumenRecibido.asignaciones)} asignaciones`}
                />
                {data.volumenRecibido.porOrigen && data.volumenRecibido.porOrigen.length > 0 ? (
                  <ul className="flex flex-col gap-1 border-t border-border pt-2 text-xs">
                    {data.volumenRecibido.porOrigen.map((o) => (
                      <li key={o.agenteId} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Escalados por {nombreAgente(o.agenteId)}</span>
                        <span className="font-medium tabular-nums text-foreground">{formatNumero(o.contactos)}</span>
                      </li>
                    ))}
                    {data.volumenRecibido.sinEscalamiento ? (
                      <li className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Sin escalamiento registrado</span>
                        <span className="font-medium tabular-nums text-foreground">
                          {formatNumero(data.volumenRecibido.sinEscalamiento)}
                        </span>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </BentoCard>

          <BentoCard
            span={4}
            title="Tiempo de resolución tras recibir el caso"
            nota="Tiempo entre que el contacto le llega a Melissa y se cierra su conversación. Solo cuenta los casos que ya se cerraron."
            hint={
              data && data.tiempoResolucion && data.tiempoResolucion.sinCerrar > 0
                ? `${formatNumero(data.tiempoResolucion.sinCerrar)} casos aún sin cerrar`
                : undefined
            }
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.tiempoResolucion != null && data.tiempoResolucion.muestras === 0}
            onClick={abrirDetalle("tiempo-resolucion", "Tiempo de resolución tras recibir el caso · más lentos primero")}
          >
            {data?.tiempoResolucion ? <TiempoCard data={data.tiempoResolucion} color={ACCENT_SECONDARY} minMuestras={10} /> : null}
          </BentoCard>

          <BentoCard
            span={4}
            title="Casos sin cerrar"
            nota="Contactos que le llegaron a Melissa en el período y cuya conversación no se ha cerrado después de recibirlos."
            loading={isInitialLoading}
            updating={isUpdating}
            onClick={data?.tiempoResolucion ? () => setCasosSinCerrarAbierto(true) : undefined}
          >
            {data?.tiempoResolucion ? (
              <KpiCard
                valor={formatNumero(data.tiempoResolucion.sinCerrar)}
                subtitulo="recibidos sin cierre posterior · clic para ver el detalle"
              />
            ) : null}
          </BentoCard>
          <CasosSinCerrarDialog range={range} open={casosSinCerrarAbierto} onOpenChange={setCasosSinCerrarAbierto} />

          <BentoCard
            span={6}
            title="Casos resueltos vs. abiertos"
            nota="Reparto de las conversaciones atendidas según su estado actual: cerradas (resueltas) o todavía abiertas."
            loading={isInitialLoading}
            updating={isUpdating}
            empty={atendidasVacio}
            onClick={abrirDetalle("atendidas", "Casos resueltos vs. abiertos")}
          >
            {data ? <ResueltosAbiertosCard data={data.atendidas} /> : null}
          </BentoCard>

          <BentoCard span={6} title="Carga por día / hora" nota="Cuántas conversaciones empezaron en cada día de la semana y en cada hora del día (hora de Colombia). Sirve para ver cuándo hay más demanda." loading={isInitialLoading} updating={isUpdating} empty={atendidasVacio}>
            {data?.cargaDiaHora ? <CargaDiaHoraCard data={data.cargaDiaHora} /> : null}
          </BentoCard>

          <BentoCard
            span={12}
            title="Motivos de escalamiento"
            nota="Razones por las que los demás agentes le pasaron casos a Melissa, agrupadas por motivo. Haz clic en un motivo para ver las conversaciones."
            hint={
              data?.motivosEscalamiento && data.motivosEscalamiento.length > 8
                ? "Se muestran los 8 motivos más frecuentes; el resto se agrupa en \"Otros\""
                : undefined
            }
            loading={isInitialLoading}
            updating={isUpdating}
            empty={data != null && data.motivosEscalamiento != null && data.motivosEscalamiento.length === 0}
            expandible
          >
            {data?.motivosEscalamiento ? <MotivosEscalamientoCard data={data.motivosEscalamiento} range={range} /> : null}
          </BentoCard>
        </>
      ) : null}
    </BentoGrid>
  );
}
