import { NextRequest, NextResponse } from "next/server";
import { esRangoValido } from "@/lib/date-ranges";
import { AGENTES_CON_PANEL } from "@/lib/agentes";
import { getDetalleAgente } from "@/lib/queries-agentes";
import { DETALLE_TIPOS, type DetalleEstado, type DetalleTipo } from "@/types/metrics-agentes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ESTADOS: readonly DetalleEstado[] = ["todas", "abierta", "cerrada"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ agenteId: string }> }) {
  const { agenteId } = await params;
  const sp = req.nextUrl.searchParams;

  if (!(AGENTES_CON_PANEL as readonly string[]).includes(agenteId)) {
    return NextResponse.json({ error: "Agente no soportado." }, { status: 404 });
  }

  const rango = esRangoValido(sp.get("from"), sp.get("to"));
  const tipo = sp.get("tipo") as DetalleTipo | null;
  const estado = (sp.get("estado") ?? "todas") as DetalleEstado;

  if (!rango || !tipo || !DETALLE_TIPOS.includes(tipo) || !ESTADOS.includes(estado)) {
    return NextResponse.json(
      { error: "Parámetros 'from', 'to' (YYYY-MM-DD, from <= to) y 'tipo' válido requeridos." },
      { status: 400 }
    );
  }

  try {
    return NextResponse.json(await getDetalleAgente(rango, agenteId, tipo, estado));
  } catch (error) {
    console.error("[/api/metrics/agente/detalle]", error);
    return NextResponse.json({ error: "Error consultando el detalle." }, { status: 500 });
  }
}
