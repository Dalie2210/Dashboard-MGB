import { NextRequest, NextResponse } from "next/server";
import { esRangoValido } from "@/lib/date-ranges";
import { getResolucionesDetalle } from "@/lib/queries-agentes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rango = esRangoValido(req.nextUrl.searchParams.get("from"), req.nextUrl.searchParams.get("to"));
  const agente = req.nextUrl.searchParams.get("agente");
  const topicos = req.nextUrl.searchParams.getAll("topico");

  if (!rango || !agente || topicos.length === 0) {
    return NextResponse.json(
      { error: "Parámetros 'from', 'to' (YYYY-MM-DD, from <= to), 'agente' y al menos un 'topico' requeridos." },
      { status: 400 }
    );
  }

  try {
    const items = await getResolucionesDetalle(rango, agente, topicos);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[/api/metrics/resoluciones-ia-detalle]", error);
    return NextResponse.json({ error: "Error consultando el detalle de resoluciones IA." }, { status: 500 });
  }
}
