import { NextRequest, NextResponse } from "next/server";
import { esRangoValido } from "@/lib/date-ranges";
import {
  getConversaciones,
  getChatsPorAgente,
  getResueltoIa,
  getPrimeraRespuesta,
  getTiempoResolucion,
  getCsat,
} from "@/lib/queries";
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
    const [conversaciones, chatsPorAgente, resueltoIa, primeraRespuesta, tiempoResolucion, csat] =
      await Promise.all([
        getConversaciones(rango),
        getChatsPorAgente(rango),
        getResueltoIa(rango),
        getPrimeraRespuesta(rango),
        getTiempoResolucion(rango),
        getCsat(rango),
      ]);

    const body: MetricsResponse = {
      rango,
      conversaciones,
      chatsPorAgente,
      resueltoIa,
      primeraRespuesta,
      tiempoResolucion,
      csat,
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error("[/api/metrics]", error);
    return NextResponse.json({ error: "Error consultando las métricas." }, { status: 500 });
  }
}
