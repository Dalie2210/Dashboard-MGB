import { pool } from "@/lib/db";
import { AGENTE_POR_DEFECTO, nombreAgente } from "@/lib/agentes";
import { sqlAgenteNormalizado } from "@/lib/sql-agentes";
import type {
  ConversacionesMetric,
  ChatsPorAgenteMetric,
  ResueltoIaMetric,
  TiempoMetric,
  CsatMetric,
  SerieDiaria,
} from "@/types/metrics";

type Rango = { from: string; to: string };

function serieDesdeFilas(filas: { fecha: string | Date; valor: string | number | null }[]): SerieDiaria {
  return filas.map((f) => ({
    fecha: f.fecha instanceof Date ? f.fecha.toISOString().slice(0, 10) : f.fecha,
    valor: Number(f.valor ?? 0),
  }));
}

export async function getConversaciones({ from, to }: Rango): Promise<ConversacionesMetric> {
  const [totales, serie] = await Promise.all([
    pool.query<{ total: number; abiertas: number; cerradas: number }>(
      `select count(*)::int total,
              count(*) filter (where estado = 'abierta')::int abiertas,
              count(*) filter (where estado <> 'abierta')::int cerradas
       from ghl_conversaciones where fecha between $1 and $2`,
      [from, to]
    ),
    pool.query<{ fecha: string; valor: string }>(
      `select fecha::text fecha, count(*)::int valor
       from ghl_conversaciones where fecha between $1 and $2
       group by fecha order by fecha`,
      [from, to]
    ),
  ]);

  const t = totales.rows[0] ?? { total: 0, abiertas: 0, cerradas: 0 };

  return {
    total: t.total,
    abiertas: t.abiertas,
    cerradas: t.cerradas,
    serieDiaria: serieDesdeFilas(serie.rows),
  };
}

export async function getChatsPorAgente({ from, to }: Rango): Promise<ChatsPorAgenteMetric> {
  const { rows } = await pool.query<{ agente_id: string; chats: number }>(
    `select ${sqlAgenteNormalizado("agente_asignado", "$3")} agente_id,
            count(*)::int chats
     from ghl_conversaciones where fecha between $1 and $2
     group by 1 order by 2 desc`,
    [from, to, AGENTE_POR_DEFECTO]
  );

  const totalChats = rows.reduce((acc, r) => acc + r.chats, 0);

  return {
    items: rows.map((r) => ({
      agenteId: r.agente_id,
      nombre: nombreAgente(r.agente_id),
      chats: r.chats,
      porcentaje: totalChats > 0 ? (r.chats / totalChats) * 100 : 0,
    })),
    totalChats,
  };
}

export async function getResueltoIa({ from, to }: Rango): Promise<ResueltoIaMetric> {
  const [totales, porResultado, porAgenteIa] = await Promise.all([
    pool.query<{ total_conv: number; conv_ia: number }>(
      `with ia as (select distinct contact_id from ghl_resoluciones_ia where fecha between $1 and $2)
       select count(*)::int total_conv,
              count(*) filter (where c.contact_id in (select contact_id from ia))::int conv_ia
       from ghl_conversaciones c where c.fecha between $1 and $2`,
      [from, to]
    ),
    pool.query<{ clave: string | null; conteo: number }>(
      `select coalesce(resultado, 'Sin dato') clave, count(*)::int conteo
       from ghl_resoluciones_ia where fecha between $1 and $2
       group by 1 order by 2 desc`,
      [from, to]
    ),
    pool.query<{ clave: string | null; conteo: number }>(
      `select coalesce(agente_ia, 'Sin dato') clave, count(*)::int conteo
       from ghl_resoluciones_ia where fecha between $1 and $2
       group by 1 order by 2 desc`,
      [from, to]
    ),
  ]);

  const t = totales.rows[0] ?? { total_conv: 0, conv_ia: 0 };
  const porcentaje = t.total_conv > 0 ? Math.min(100, Math.max(0, (t.conv_ia / t.total_conv) * 100)) : null;

  return {
    totalConversaciones: t.total_conv,
    conversacionesIa: t.conv_ia,
    porcentaje,
    porResultado: porResultado.rows.map((r) => ({ clave: r.clave ?? "Sin dato", conteo: r.conteo })),
    porAgenteIa: porAgenteIa.rows.map((r) => ({ clave: r.clave ?? "Sin dato", conteo: r.conteo })),
  };
}

async function getTiempoPromedio(tabla: string, columna: string, { from, to }: Rango): Promise<TiempoMetric> {
  const [totales, serie] = await Promise.all([
    pool.query<{ promedio: string | null; mediana: string | null; muestras: number }>(
      `select avg(${columna})::float promedio,
              percentile_cont(0.5) within group (order by ${columna})::float mediana,
              count(*)::int muestras
       from ${tabla} where fecha between $1 and $2`,
      [from, to]
    ),
    pool.query<{ fecha: string; valor: string | null }>(
      `select fecha::text fecha, avg(${columna})::float valor
       from ${tabla} where fecha between $1 and $2
       group by fecha order by fecha`,
      [from, to]
    ),
  ]);

  const t = totales.rows[0] ?? { promedio: null, mediana: null, muestras: 0 };

  return {
    promedioSegundos: t.promedio != null ? Number(t.promedio) : null,
    medianaSegundos: t.mediana != null ? Number(t.mediana) : null,
    muestras: t.muestras,
    serieDiaria: serieDesdeFilas(serie.rows.map((r) => ({ fecha: r.fecha, valor: r.valor ?? 0 }))),
  };
}

export function getPrimeraRespuesta(rango: Rango): Promise<TiempoMetric> {
  return getTiempoPromedio("ghl_primera_respuesta", "tiempo_respuesta_segundos", rango);
}

export function getTiempoResolucion(rango: Rango): Promise<TiempoMetric> {
  return getTiempoPromedio("ghl_tiempo_resolucion", "tiempo_resolucion_segundos", rango);
}

export async function getCsat({ from, to }: Rango): Promise<CsatMetric> {
  const [totales, distribucion, pendientes] = await Promise.all([
    pool.query<{ promedio: string | null; respuestas: number; satisfechos: number }>(
      `select avg(score)::float promedio, count(*)::int respuestas,
              count(*) filter (where score >= 4)::int satisfechos
       from ghl_csat where fecha between $1 and $2`,
      [from, to]
    ),
    pool.query<{ score: number; conteo: number }>(
      `select score, count(*)::int conteo
       from ghl_csat where fecha between $1 and $2
       group by score order by score`,
      [from, to]
    ),
    pool.query<{ conteo: number }>(
      `select count(*)::int conteo
       from ghl_csat_pendiente where solicitado_at::date between $1 and $2`,
      [from, to]
    ),
  ]);

  const t = totales.rows[0] ?? { promedio: null, respuestas: 0, satisfechos: 0 };
  const pendientesEnRango = pendientes.rows[0]?.conteo ?? 0;
  const totalSolicitudes = pendientesEnRango + t.respuestas;

  return {
    promedio: t.promedio != null ? Number(t.promedio) : null,
    respuestas: t.respuestas,
    satisfechos: t.satisfechos,
    csatPorcentaje: t.respuestas > 0 ? (t.satisfechos / t.respuestas) * 100 : null,
    distribucion: distribucion.rows.map((r) => ({ score: r.score, conteo: r.conteo })),
    pendientesEnRango,
    tasaRespuesta: totalSolicitudes > 0 ? (t.respuestas / totalSolicitudes) * 100 : null,
  };
}
