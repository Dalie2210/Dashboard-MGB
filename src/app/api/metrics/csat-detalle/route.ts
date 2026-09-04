import { NextRequest, NextResponse } from "next/server";
import { esRangoValido } from "@/lib/date-ranges";
import { getCsatDetalle } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseScores(valor: string | null): number[] | null {
  if (!valor) return null;
  const scores = valor
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5);
  return scores.length > 0 ? Array.from(new Set(scores)) : null;
}

export async function GET(req: NextRequest) {
  const rango = esRangoValido(req.nextUrl.searchParams.get("from"), req.nextUrl.searchParams.get("to"));
  const scores = parseScores(req.nextUrl.searchParams.get("scores"));

  if (!rango || !scores) {
    return NextResponse.json(
      { error: "Parámetros 'from', 'to' (YYYY-MM-DD, from <= to) y 'scores' (1-5, separados por coma) requeridos." },
      { status: 400 }
    );
  }

  try {
    const items = await getCsatDetalle(rango, scores);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[/api/metrics/csat-detalle]", error);
    return NextResponse.json({ error: "Error consultando el detalle de CSAT." }, { status: 500 });
  }
}
