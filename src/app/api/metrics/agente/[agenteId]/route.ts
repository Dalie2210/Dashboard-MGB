import { NextRequest, NextResponse } from "next/server";
import { esRangoValido } from "@/lib/date-ranges";
import { AGENTES, AGENTES_CON_PANEL, CAMILA_ID, MELISSA_ID, SAMI_ID } from "@/lib/agentes";
import {
  getAtendidasAgente,
  getCargaDiaHora,
  getCsatAgente,
  getEscaladasAMelissa,
  getMotivosEscalamiento,
  getObjeciones,
  getResolucionesPorTopico,
  getTiempoResolucionAgente,
  getTiempoRespuestaAgente,
  getTiempoTrasRecibirMelissa,
  getVentasCamila,
  getVolumenRecibido,
} from "@/lib/queries-agentes";
import type { AgenteMetricsResponse } from "@/types/metrics-agentes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AgenteConPanel = (typeof AGENTES_CON_PANEL)[number];

function esAgenteConPanel(valor: string): valor is AgenteConPanel {
  return (AGENTES_CON_PANEL as readonly string[]).includes(valor);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ agenteId: string }> }) {
  const { agenteId } = await params;

  if (!esAgenteConPanel(agenteId)) {
    return NextResponse.json({ error: "Agente no soportado." }, { status: 404 });
  }

  const rango = esRangoValido(req.nextUrl.searchParams.get("from"), req.nextUrl.searchParams.get("to"));
  if (!rango) {
    return NextResponse.json(
      { error: "Parámetros 'from' y 'to' requeridos en formato YYYY-MM-DD, con from <= to." },
      { status: 400 }
    );
  }

  try {
    const [atendidas, tiempoRespuesta] = await Promise.all([
      getAtendidasAgente(rango, agenteId),
      getTiempoRespuestaAgente(rango, agenteId),
    ]);

    let ventas: AgenteMetricsResponse["ventas"] = null;
    let porcentajeCierre: AgenteMetricsResponse["porcentajeCierre"] = null;
    let tiempoResolucion: AgenteMetricsResponse["tiempoResolucion"] = null;
    let cargaDiaHora: AgenteMetricsResponse["cargaDiaHora"] = null;
    let volumenRecibido: AgenteMetricsResponse["volumenRecibido"] = null;
    let escaladoAMelissa: AgenteMetricsResponse["escaladoAMelissa"] = null;
    let resueltoSinEscalar: AgenteMetricsResponse["resueltoSinEscalar"] = null;
    let motivosEscalamiento: AgenteMetricsResponse["motivosEscalamiento"] = null;
    let objeciones: AgenteMetricsResponse["objeciones"] = null;
    let tiempoResolucionAgente: AgenteMetricsResponse["tiempoResolucionAgente"] = null;
    let csat: AgenteMetricsResponse["csat"] = null;
    let resolucionesPorTopico: AgenteMetricsResponse["resolucionesPorTopico"] = null;

    if (agenteId === CAMILA_ID) {
      [ventas, objeciones, motivosEscalamiento] = await Promise.all([
        getVentasCamila(rango),
        getObjeciones(rango),
        getMotivosEscalamiento(rango, agenteId),
      ]);
      // Compradores únicos, no transacciones: evita que una persona con varias
      // compras infle el porcentaje por encima de 100%.
      porcentajeCierre = atendidas.total > 0 ? (ventas.compradores / atendidas.total) * 100 : null;
    }

    if (agenteId !== MELISSA_ID) {
      const escaladas = await getEscaladasAMelissa(rango, agenteId);
      const porcentaje = atendidas.total > 0 ? (escaladas / atendidas.total) * 100 : null;
      escaladoAMelissa = { escaladas, porcentaje };

      if (agenteId !== CAMILA_ID) {
        resueltoSinEscalar = { escaladas, porcentaje: porcentaje != null ? 100 - porcentaje : null };
      }
    }

    if (agenteId === MELISSA_ID) {
      [tiempoResolucion, cargaDiaHora, volumenRecibido, motivosEscalamiento] = await Promise.all([
        getTiempoTrasRecibirMelissa(rango, agenteId),
        getCargaDiaHora(rango, agenteId),
        getVolumenRecibido(rango, agenteId),
        getMotivosEscalamiento(rango),
      ]);
    }

    if (agenteId === SAMI_ID) {
      [cargaDiaHora, volumenRecibido, tiempoResolucionAgente, csat, resolucionesPorTopico, motivosEscalamiento] =
        await Promise.all([
          getCargaDiaHora(rango, agenteId),
          getVolumenRecibido(rango, agenteId),
          getTiempoResolucionAgente(rango, agenteId),
          getCsatAgente(rango, agenteId),
          // ghl_resoluciones_ia guarda el nombre del agente IA, no su ID GHL.
          getResolucionesPorTopico(rango, AGENTES[SAMI_ID]),
          getMotivosEscalamiento(rango, agenteId),
        ]);
    }

    const body: AgenteMetricsResponse = {
      rango,
      agenteId,
      atendidas,
      tiempoRespuesta,
      ventas,
      porcentajeCierre,
      tiempoResolucion,
      cargaDiaHora,
      volumenRecibido,
      escaladoAMelissa,
      resueltoSinEscalar,
      motivosEscalamiento,
      objeciones,
      tiempoResolucionAgente,
      csat,
      resolucionesPorTopico,
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error("[/api/metrics/agente]", error);
    return NextResponse.json({ error: "Error consultando las métricas del agente." }, { status: 500 });
  }
}
