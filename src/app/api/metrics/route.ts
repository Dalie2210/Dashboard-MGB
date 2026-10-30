import { NextRequest, NextResponse } from "next/server";
import { esRangoValido } from "@/lib/date-ranges";
import {
  getConversaciones,
  getChatsPorAgente,
  getResueltoIa,
  getPrimeraRespuesta,
  getTiempoResolucion,
  getCierresInactividad,
  getCsat,
} from "@/lib/queries";
import { getCsatAgente } from "@/lib/queries-agentes";
import { AGENTES_CON_PANEL } from "@/lib/agentes";
import type { MetricsResponse } from "@/types/metrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rango = esRangoValido(req.nextUrl.searchParams.get("from"), req.nextUrl.searchParams.get("to"));

  if (!rango) {
    return NextResponse.json(
      { error: "Parámetros 'from' y 'to' requeridos en formato YYYY-MM-DD, con from <= to." },
      { status: 400 }
    );
  }

  try {
    const [conversaciones, chatsPorAgente, resueltoIa, primeraRespuesta, tiempoResolucion, cierresInactividad, csat] =
      await Promise.all([
        getConversaciones(rango),
        getChatsPorAgente(rango),
        getResueltoIa(rango),
        getPrimeraRespuesta(rango),
        getTiempoResolucion(rango),
        getCierresInactividad(rango),
        getCsat(rango),
      ]);

    const csatAgentes = await Promise.all(AGENTES_CON_PANEL.map((id) => getCsatAgente(rango, id)));
    csat.porAgente = AGENTES_CON_PANEL.map((agenteId, i) => ({
      agenteId,
      promedio: csatAgentes[i].promedio,
      respuestas: csatAgentes[i].respuestas,
      tasaRespuesta: csatAgentes[i].tasaRespuesta,
    }));

    const body: MetricsResponse = {
      rango,
      conversaciones,
      chatsPorAgente,
      resueltoIa,
      primeraRespuesta,
      tiempoResolucion,
      cierresInactividad,
      csat,
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error("[/api/metrics]", error);
    return NextResponse.json({ error: "Error consultando las métricas." }, { status: 500 });
  }
}
