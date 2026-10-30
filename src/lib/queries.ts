import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { pool } from "@/lib/db";
import { AGENTE_POR_DEFECTO, nombreAgente } from "@/lib/agentes";
import { sqlAgenteNormalizado } from "@/lib/sql-agentes";
import type {
  ConversacionesMetric,
  ChatsPorAgenteMetric,
  ResueltoIaMetric,
  PrimeraRespuestaMetric,
  TiempoMetric,
  CsatMetric,
  CsatDetalleItem,
  CierresInactividadMetric,
  CierreInactividadItem,
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
    pool.query<{ total: number; abiertas: number; cerradas: number; estancadas: number }>(
      `select count(*)::int total,
              count(*) filter (where estado = 'abierta')::int abiertas,
              count(*) filter (where estado <> 'abierta')::int cerradas,
              count(*) filter (where estado = 'abierta' and fecha < current_date - 3)::int estancadas
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

  const t = totales.rows[0] ?? { total: 0, abiertas: 0, cerradas: 0, estancadas: 0 };

  return {
    total: t.total,
    abiertas: t.abiertas,
    cerradas: t.cerradas,
    abiertasMasDe3Dias: t.estancadas,
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

async function getPorcentajeResueltoIa({ from, to }: Rango) {
  const { rows } = await pool.query<{ total_conv: number; conv_ia: number; conv_camila: number; conv_sami: number }>(
    `with ia as (select contact_id, bool_or(agente_ia = 'Camila') camila, bool_or(agente_ia = 'Sami') sami
                 from ghl_resoluciones_ia where fecha between $1 and $2 group by contact_id)
     select count(*)::int total_conv,
            count(*) filter (where ia.contact_id is not null)::int conv_ia,
            count(*) filter (where ia.camila)::int conv_camila,
            count(*) filter (where ia.sami)::int conv_sami
     from ghl_conversaciones c left join ia on ia.contact_id = c.contact_id
     where c.fecha between $1 and $2`,
    [from, to]
  );
  const t = rows[0] ?? { total_conv: 0, conv_ia: 0, conv_camila: 0, conv_sami: 0 };
  const pct = (n: number) => (t.total_conv > 0 ? Math.min(100, Math.max(0, (n / t.total_conv) * 100)) : null);
  return {
    totalConversaciones: t.total_conv,
    conversacionesIa: t.conv_ia,
    porcentaje: pct(t.conv_ia),
    porcentajeCamila: pct(t.conv_camila),
    porcentajeSami: pct(t.conv_sami),
  };
}

/** Periodo inmediatamente anterior, de la misma duración en días. */
function rangoAnterior({ from, to }: Rango): Rango {
  const dias = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1;
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  return { from: fmt(addDays(parseISO(from), -dias)), to: fmt(addDays(parseISO(from), -1)) };
}

export async function getResueltoIa({ from, to }: Rango): Promise<ResueltoIaMetric> {
  const [actual, anterior, porResultado, porAgenteIa] = await Promise.all([
    getPorcentajeResueltoIa({ from, to }),
    getPorcentajeResueltoIa(rangoAnterior({ from, to })),
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

  return {
    ...actual,
    porcentajeAnterior: anterior.porcentaje,
    porResultado: porResultado.rows.map((r) => ({ clave: r.clave ?? "Sin dato", conteo: r.conteo })),
    porAgenteIa: porAgenteIa.rows.map((r) => ({ clave: r.clave ?? "Sin dato", conteo: r.conteo })),
  };
}

async function getTiempoPromedio(
  tabla: string,
  columna: string,
  { from, to }: Rango,
  filtroExtra = ""
): Promise<TiempoMetric> {
  const [totales, serie] = await Promise.all([
    pool.query<{ promedio: string | null; mediana: string | null; muestras: number }>(
      `select avg(${columna})::float promedio,
              percentile_cont(0.5) within group (order by ${columna})::float mediana,
              count(*)::int muestras
       from ${tabla} where fecha between $1 and $2${filtroExtra}`,
      [from, to]
    ),
    pool.query<{ fecha: string; valor: string | null }>(
      `select fecha::text fecha, avg(${columna})::float valor
       from ${tabla} where fecha between $1 and $2${filtroExtra}
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

/**
 * Separa la primera respuesta en IA y humana. Si la sesión ya estaba escalada cuando se registró la respuesta,
 * la respondió una persona (Melissa) y el tiempo se mide desde el escalamiento; si no, es la IA y se mide desde
 * el inicio de la conversación. Solo se registra una primera respuesta por sesión, así que una sesión que la IA
 * respondió antes de escalar no aporta muestra humana.
 */
export async function getPrimeraRespuesta({ from, to }: Rango): Promise<PrimeraRespuestaMetric> {
  const base = `with base as (
      select pr.fecha,
             (e.created_at is not null) humana,
             case when e.created_at is not null
                  then extract(epoch from (pr.created_at - e.created_at))
                  else pr.tiempo_respuesta_segundos end valor
      from ghl_primera_respuesta pr
      left join lateral (
        select created_at from ghl_escalamientos e
        where e.sesion_id = pr.sesion_id and e.created_at <= pr.created_at
        order by e.created_at desc limit 1
      ) e on true
      where pr.fecha between $1 and $2
    )`;

  const [totales, serie] = await Promise.all([
    pool.query<{ humana: boolean; promedio: number | null; mediana: number | null; muestras: number }>(
      `${base}
       select humana, avg(valor)::float promedio,
              percentile_cont(0.5) within group (order by valor)::float mediana,
              count(*)::int muestras
       from base group by humana`,
      [from, to]
    ),
    pool.query<{ humana: boolean; fecha: string; valor: number | null }>(
      `${base}
       select humana, fecha::text fecha, avg(valor)::float valor
       from base group by humana, fecha order by fecha`,
      [from, to]
    ),
  ]);

  const armar = (humana: boolean): TiempoMetric => {
    const t = totales.rows.find((r) => r.humana === humana);
    return {
      promedioSegundos: t?.promedio ?? null,
      medianaSegundos: t?.mediana ?? null,
      muestras: t?.muestras ?? 0,
      serieDiaria: serieDesdeFilas(
        serie.rows.filter((r) => r.humana === humana).map((r) => ({ fecha: r.fecha, valor: r.valor ?? 0 }))
      ),
    };
  };

  return { ia: armar(false), humana: armar(true) };
}

/** Solo cierres confirmados: un cierre por inactividad mide silencio de la clienta, no resolución. */
export function getTiempoResolucion(rango: Rango): Promise<TiempoMetric> {
  return getTiempoPromedio(
    "ghl_tiempo_resolucion",
    "tiempo_resolucion_segundos",
    rango,
    " and tipo_cierre = 'resuelto'"
  );
}

export async function getCierresInactividad({ from, to }: Rango): Promise<CierresInactividadMetric> {
  const [totales, serie] = await Promise.all([
    pool.query<{ inactividad: number; resueltos: number }>(
      `select count(*) filter (where tipo_cierre = 'inactividad')::int inactividad,
              count(*) filter (where tipo_cierre = 'resuelto')::int resueltos
       from ghl_tiempo_resolucion where fecha between $1 and $2`,
      [from, to]
    ),
    pool.query<{ fecha: string; valor: number }>(
      `select fecha::text fecha, count(*)::int valor
       from ghl_tiempo_resolucion
       where fecha between $1 and $2 and tipo_cierre = 'inactividad'
       group by fecha order by fecha`,
      [from, to]
    ),
  ]);

  const t = totales.rows[0] ?? { inactividad: 0, resueltos: 0 };
  const totalCierres = t.inactividad + t.resueltos;

  return {
    inactividad: t.inactividad,
    resueltos: t.resueltos,
    porcentaje: totalCierres > 0 ? (t.inactividad / totalCierres) * 100 : null,
    serieDiaria: serieDesdeFilas(serie.rows),
  };
}

const CIERRES_INACTIVIDAD_LIMITE = 2000;

export async function getCierresInactividadDetalle({ from, to }: Rango): Promise<CierreInactividadItem[]> {
  const { rows } = await pool.query<{
    fecha: string;
    contact_id: string;
    conversation_id: string | null;
    tiempo_resolucion_segundos: number | null;
  }>(
    `select fecha::text fecha, contact_id, conversation_id, tiempo_resolucion_segundos
     from ghl_tiempo_resolucion
     where fecha between $1 and $2 and tipo_cierre = 'inactividad'
     order by fecha desc, tiempo_resolucion_segundos desc
     limit ${CIERRES_INACTIVIDAD_LIMITE}`,
    [from, to]
  );

  return rows.map((r) => ({
    fecha: r.fecha,
    contactId: r.contact_id,
    conversationId: r.conversation_id,
    duracionSegundos: r.tiempo_resolucion_segundos != null ? Number(r.tiempo_resolucion_segundos) : null,
  }));
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

export async function getCsatDetalle({ from, to }: Rango, scores: number[]): Promise<CsatDetalleItem[]> {
  if (scores.length === 0) return [];

  const { rows } = await pool.query<{
    fecha: string;
    contact_id: string;
    score: number;
    agente_id: string | null;
    motivo: string | null;
  }>(
    `select s.fecha::text fecha, s.contact_id, s.score,
            ${sqlAgenteNormalizado("conv.agente_asignado", "$4")} agente_id,
            esc.motivo
     from ghl_csat s
     left join lateral (
       select c.agente_asignado
       from ghl_conversaciones c
       where c.contact_id = s.contact_id
       order by c.created_at desc
       limit 1
     ) conv on true
     left join lateral (
       select e.motivo
       from ghl_escalamientos e
       where e.contact_id = s.contact_id
       order by e.created_at desc
       limit 1
     ) esc on true
     where s.fecha between $1 and $2 and s.score = any($3::int[])
     order by s.fecha desc, s.created_at desc`,
    [from, to, scores, AGENTE_POR_DEFECTO]
  );

  return rows.map((r) => ({
    fecha: r.fecha,
    contactId: r.contact_id,
    score: r.score,
    agente: r.agente_id ? nombreAgente(r.agente_id) : null,
    motivo: r.motivo,
  }));
}
