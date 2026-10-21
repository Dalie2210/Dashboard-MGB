import { NextRequest, NextResponse } from "next/server";
import { esRangoValido } from "@/lib/date-ranges";
import { MELISSA_ID } from "@/lib/agentes";
import { getCasosSinCerrarMelissa } from "@/lib/queries-agentes";

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
    const items = await getCasosSinCerrarMelissa(rango, MELISSA_ID);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[/api/metrics/casos-sin-cerrar-detalle]", error);
    return NextResponse.json({ error: "Error consultando los casos sin cerrar." }, { status: 500 });
  }
}
