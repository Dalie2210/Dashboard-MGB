import { NextRequest, NextResponse } from "next/server";
import { esRangoValido } from "@/lib/date-ranges";
import { getCierresInactividadDetalle } from "@/lib/queries";

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
    const items = await getCierresInactividadDetalle(rango);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[/api/metrics/cierres-inactividad-detalle]", error);
    return NextResponse.json({ error: "Error consultando los cierres por inactividad." }, { status: 500 });
  }
}
