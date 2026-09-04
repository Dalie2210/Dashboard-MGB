import { NextRequest, NextResponse } from "next/server";
import { esRangoValido } from "@/lib/date-ranges";
import { getMotivosEscalamientoDetalle } from "@/lib/queries-agentes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rango = esRangoValido(req.nextUrl.searchParams.get("from"), req.nextUrl.searchParams.get("to"));
  const motivos = req.nextUrl.searchParams.getAll("motivo");

  if (!rango || motivos.length === 0) {
    return NextResponse.json(
      { error: "Parámetros 'from', 'to' (YYYY-MM-DD, from <= to) y al menos un 'motivo' requeridos." },
      { status: 400 }
    );
  }

  try {
    const items = await getMotivosEscalamientoDetalle(rango, motivos);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[/api/metrics/motivos-escalamiento-detalle]", error);
    return NextResponse.json({ error: "Error consultando el detalle de motivos de escalamiento." }, { status: 500 });
  }
}
