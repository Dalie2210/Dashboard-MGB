import { NextRequest, NextResponse } from "next/server";
import { esRangoValido } from "@/lib/date-ranges";
import { getObjecionesDetalle } from "@/lib/queries-agentes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rango = esRangoValido(req.nextUrl.searchParams.get("from"), req.nextUrl.searchParams.get("to"));
  const categorias = req.nextUrl.searchParams.getAll("categoria");

  if (!rango || categorias.length === 0) {
    return NextResponse.json(
      { error: "Parámetros 'from', 'to' (YYYY-MM-DD, from <= to) y al menos una 'categoria' requeridos." },
      { status: 400 }
    );
  }

  try {
    const items = await getObjecionesDetalle(rango, categorias);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[/api/metrics/objeciones-detalle]", error);
    return NextResponse.json({ error: "Error consultando el detalle de objeciones." }, { status: 500 });
  }
}
