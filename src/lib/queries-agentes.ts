import { pool } from "@/lib/db";
import { AGENTE_POR_DEFECTO, MELISSA_ID } from "@/lib/agentes";
import { sqlAgenteNormalizado } from "@/lib/sql-agentes";
import { formatDuracion } from "@/lib/format";
import type { ConversacionesMetric, CsatMetric, SerieDiaria, TiempoMetric } from "@/types/metrics";
import type {
  CargaItem,
  DetalleEstado,
  DetalleItem,
  DetalleResponse,
  DetalleTipo,
  CargaMetric,
  CasoSinCerrarItem,
  MotivoDetalleItem,
  MotivoItem,
  ObjecionCanal,
  ObjecionDetalleItem,
  ObjecionItem,
  ResolucionDetalleItem,
  TiempoRespuestaMetric,
  TiempoTrasRecibirMetric,
  TopicoItem,
  VentasMetric,
  VolumenRecibidoMetric,
} from "@/types/metrics-agentes";

type Rango = { from: string; to: string };

function serieDesdeFilas(filas: { fecha: string | Date; valor: string | number | null }[]): SerieDiaria {
  return filas.map((f) => ({
    fecha: f.fecha instanceof Date ? f.fecha.toISOString().slice(0, 10) : f.fecha,
    valor: Number(f.valor ?? 0),
  }));
}

export async function getAtendidasAgente({ from, to }: Rango, agenteId: string): Promise<ConversacionesMetric> {
  const norm = sqlAgenteNormalizado("agente_asignado", "$4");
  const [totales, serie] = await Promise.all([
    pool.query<{ total: number; abiertas: number; cerradas: number }>(
      `select count(*)::int total,
              count(*) filter (where estado = 'abierta')::int abiertas,
              count(*) filter (where estado <> 'abierta')::int cerradas
       from ghl_conversaciones
       where fecha between $1 and $2 and ${norm} = $3`,
      [from, to, agenteId, AGENTE_POR_DEFECTO]
    ),
    pool.query<{ fecha: string; valor: string }>(
      `select fecha::text fecha, count(*)::int valor
       from ghl_conversaciones
       where fecha between $1 and $2 and ${norm} = $3
       group by fecha order by fecha`,
      [from, to, agenteId, AGENTE_POR_DEFECTO]
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

export async function getTiempoRespuestaAgente(
  { from, to }: Rango,
  agenteId: string
): Promise<TiempoRespuestaMetric> {
  const norm = sqlAgenteNormalizado("c.agente_asignado", "$4");
  const [totales, serie, sinSesion] = await Promise.all([
    pool.query<{ promedio: string | null; mediana: string | null; muestras: number }>(
      `select avg(pr.tiempo_respuesta_segundos)::float promedio,
              percentile_cont(0.5) within group (order by pr.tiempo_respuesta_segundos)::float mediana,
              count(*)::int muestras
       from ghl_primera_respuesta pr
       join ghl_conversaciones c on c.id = pr.sesion_id
       where pr.fecha between $1 and $2 and ${norm} = $3`,
      [from, to, agenteId, AGENTE_POR_DEFECTO]
    ),
    pool.query<{ fecha: string; valor: string | null }>(
      `select pr.fecha::text fecha, avg(pr.tiempo_respuesta_segundos)::float valor
       from ghl_primera_respuesta pr
       join ghl_conversaciones c on c.id = pr.sesion_id
       where pr.fecha between $1 and $2 and ${norm} = $3
       group by pr.fecha order by pr.fecha`,
      [from, to, agenteId, AGENTE_POR_DEFECTO]
    ),
    pool.query<{ conteo: number }>(
      `select count(*)::int conteo
       from ghl_primera_respuesta
       where fecha between $1 and $2 and sesion_id is null`,
      [from, to]
    ),
  ]);

  const t = totales.rows[0] ?? { promedio: null, mediana: null, muestras: 0 };

  return {
    promedioSegundos: t.promedio != null ? Number(t.promedio) : null,
    medianaSegundos: t.mediana != null ? Number(t.mediana) : null,
    muestras: t.muestras,
    serieDiaria: serieDesdeFilas(serie.rows.map((r) => ({ fecha: r.fecha, valor: r.valor ?? 0 }))),
    sinSesion: sinSesion.rows[0]?.conteo ?? 0,
  };
}

export async function getVentasCamila({ from, to }: Rango): Promise<VentasMetric> {
  const [totales, serie] = await Promise.all([
    pool.query<{
      ingresos: string;
      transacciones: number;
      ticket_promedio: string | null;
      compradores: number;
    }>(
      `select coalesce(sum(value), 0)::float ingresos,
              count(*)::int transacciones,
              (sum(value) / nullif(count(value), 0))::float ticket_promedio,
              count(distinct lower(trim(buyer_email)))
                filter (where nullif(trim(buyer_email), '') is not null)::int compradores
       from ventas_camila where created_at::date between $1 and $2`,
      [from, to]
    ),
    pool.query<{ fecha: string; valor: string | null }>(
      `select created_at::date::text fecha, coalesce(sum(value), 0)::float valor
       from ventas_camila where created_at::date between $1 and $2
       group by created_at::date order by 1`,
      [from, to]
    ),
  ]);

  const t = totales.rows[0] ?? { ingresos: "0", transacciones: 0, ticket_promedio: null, compradores: 0 };

  return {
    ingresos: Number(t.ingresos),
    transacciones: t.transacciones,
    ticketPromedio: t.ticket_promedio != null ? Number(t.ticket_promedio) : null,
    compradores: t.compradores,
    serieDiaria: serieDesdeFilas(serie.rows.map((r) => ({ fecha: r.fecha, valor: r.valor ?? 0 }))),
  };
}

export async function getTiempoTrasRecibirMelissa(
  { from, to }: Rango,
  agenteId: string
): Promise<TiempoTrasRecibirMetric> {
  const norm = sqlAgenteNormalizado("agente_id", "$4");
  const [resultado, recibidos] = await Promise.all([
    pool.query<{ promedio: string | null; mediana: string | null; muestras: number }>(
      `with recibido as (
         select contact_id, min(created_at) recibido_at
         from ghl_asignaciones_agente
         where fecha between $1 and $2 and ${norm} = $3
         group by contact_id
       ),
       cerrado as (
         select distinct on (r.contact_id)
                r.contact_id,
                extract(epoch from (c.closed_at - r.recibido_at))::float segundos
         from recibido r
         join ghl_conversaciones c
           on c.contact_id = r.contact_id
          and c.closed_at is not null
          and c.closed_at > r.recibido_at
         order by r.contact_id, c.closed_at asc
       )
       select avg(segundos)::float promedio,
              percentile_cont(0.5) within group (order by segundos)::float mediana,
              count(*)::int muestras
       from cerrado`,
      [from, to, agenteId, AGENTE_POR_DEFECTO]
    ),
    pool.query<{ contactos: number }>(
      `select count(distinct contact_id)::int contactos
       from ghl_asignaciones_agente
       where fecha between $1 and $2 and ${norm} = $3`,
      [from, to, agenteId, AGENTE_POR_DEFECTO]
    ),
  ]);

  const t = resultado.rows[0] ?? { promedio: null, mediana: null, muestras: 0 };
  const contactosRecibidos = recibidos.rows[0]?.contactos ?? 0;

  return {
    promedioSegundos: t.promedio != null ? Number(t.promedio) : null,
    medianaSegundos: t.mediana != null ? Number(t.mediana) : null,
    muestras: t.muestras,
    serieDiaria: [],
    sinCerrar: Math.max(0, contactosRecibidos - t.muestras),
  };
}

export async function getCasosSinCerrarMelissa({ from, to }: Rango, agenteId: string): Promise<CasoSinCerrarItem[]> {
  const norm = sqlAgenteNormalizado("agente_id", "$4");
  const { rows } = await pool.query<{
    contact_id: string;
    conversation_id: string | null;
    recibido_at: Date;
    motivo: string | null;
  }>(
    `with recibido as (
       select contact_id, min(created_at) recibido_at
       from ghl_asignaciones_agente
       where fecha between $1 and $2 and ${norm} = $3
       group by contact_id
     )
     select r.contact_id, conv.conversation_id, r.recibido_at, esc.motivo
     from recibido r
     left join lateral (
       select c.conversation_id
       from ghl_conversaciones c
       where c.contact_id = r.contact_id
       order by c.created_at desc
       limit 1
     ) conv on true
     left join lateral (
       select e.motivo
       from ghl_escalamientos e
       where e.contact_id = r.contact_id and e.agente_destino = $5
       order by e.created_at desc
       limit 1
     ) esc on true
     where not exists (
       select 1 from ghl_conversaciones c
       where c.contact_id = r.contact_id
         and c.closed_at is not null
         and c.closed_at > r.recibido_at
     )
     order by r.recibido_at asc`,
    [from, to, agenteId, AGENTE_POR_DEFECTO, MELISSA_ID]
  );

  return rows.map((r) => ({
    contactId: r.contact_id,
    conversationId: r.conversation_id,
    recibidoAt: new Date(r.recibido_at).toISOString(),
    motivo: r.motivo,
  }));
}

function rellenarCarga(filas: CargaItem[], desde: number, hasta: number): CargaItem[] {
  const mapa = new Map(filas.map((f) => [f.clave, f.conteo]));
  const resultado: CargaItem[] = [];
  for (let i = desde; i <= hasta; i++) {
    resultado.push({ clave: i, conteo: mapa.get(i) ?? 0 });
  }
  return resultado;
}

export async function getCargaDiaHora({ from, to }: Rango, agenteId: string): Promise<CargaMetric> {
  const norm = sqlAgenteNormalizado("agente_asignado", "$4");
  const [porDia, porHora] = await Promise.all([
    pool.query<{ clave: number; conteo: number }>(
      `select extract(isodow from created_at at time zone 'America/Bogota')::int clave,
              count(*)::int conteo
       from ghl_conversaciones
       where fecha between $1 and $2 and ${norm} = $3
       group by 1 order by 1`,
      [from, to, agenteId, AGENTE_POR_DEFECTO]
    ),
    pool.query<{ clave: number; conteo: number }>(
      `select extract(hour from created_at at time zone 'America/Bogota')::int clave,
              count(*)::int conteo
       from ghl_conversaciones
       where fecha between $1 and $2 and ${norm} = $3
       group by 1 order by 1`,
      [from, to, agenteId, AGENTE_POR_DEFECTO]
    ),
  ]);

  return {
    porDia: rellenarCarga(porDia.rows, 1, 7),
    porHora: rellenarCarga(porHora.rows, 0, 23),
  };
}

export async function getEscaladasAMelissa({ from, to }: Rango, agenteId: string): Promise<number> {
  const norm = sqlAgenteNormalizado("agente_origen", "$5");
  const { rows } = await pool.query<{ escaladas: number }>(
    `select count(distinct contact_id)::int escaladas
     from ghl_escalamientos
     where fecha between $1 and $2 and ${norm} = $3 and agente_destino = $4`,
    [from, to, agenteId, MELISSA_ID, AGENTE_POR_DEFECTO]
  );
  return rows[0]?.escaladas ?? 0;
}

/** `agenteOrigen` opcional: restringe a los escalamientos que vienen de ese agente. */
function filtroOrigen(agenteOrigen: string | undefined, primerParam: number) {
  if (!agenteOrigen) return { sql: "", params: [] as string[] };
  const norm = sqlAgenteNormalizado("agente_origen", `$${primerParam + 1}`);
  return { sql: ` and ${norm} = $${primerParam}`, params: [agenteOrigen, AGENTE_POR_DEFECTO] };
}

export async function getMotivosEscalamiento({ from, to }: Rango, agenteOrigen?: string): Promise<MotivoItem[]> {
  const origen = filtroOrigen(agenteOrigen, 4);
  const { rows } = await pool.query<{ motivo: string; conteo: number }>(
    `select motivo, count(*)::int conteo
     from ghl_escalamientos
     where fecha between $1 and $2 and agente_destino = $3${origen.sql}
     group by motivo order by conteo desc`,
    [from, to, MELISSA_ID, ...origen.params]
  );
  return rows;
}

export async function getMotivosEscalamientoDetalle(
  { from, to }: Rango,
  motivos: string[],
  agenteOrigen?: string
): Promise<MotivoDetalleItem[]> {
  if (motivos.length === 0) return [];

  const origen = filtroOrigen(agenteOrigen, 5);
  const { rows } = await pool.query<{ fecha: string; motivo: string; detalle: string | null; contact_id: string }>(
    `select fecha::text fecha, motivo, detalle, contact_id
     from ghl_escalamientos
     where fecha between $1 and $2 and agente_destino = $3 and motivo = any($4::text[])${origen.sql}
     order by fecha desc, created_at desc`,
    [from, to, MELISSA_ID, motivos, ...origen.params]
  );

  return rows.map((r) => ({ fecha: r.fecha, motivo: r.motivo, detalle: r.detalle, contactId: r.contact_id }));
}

export async function getObjeciones({ from, to }: Rango): Promise<ObjecionItem[]> {
  const { rows } = await pool.query<{ categoria: string; conteo: number }>(
    `select categoria, count(*)::int conteo
     from objeciones
     where fecha::date between $1 and $2
     group by categoria order by conteo desc`,
    [from, to]
  );
  return rows;
}

export async function getObjecionesDetalle({ from, to }: Rango, categorias: string[]): Promise<ObjecionDetalleItem[]> {
  if (categorias.length === 0) return [];

  const { rows } = await pool.query<{
    fecha: string;
    categoria: string;
    detalle: string | null;
    contact_id: string;
    canal: ObjecionCanal;
  }>(
    `select fecha::date::text fecha, categoria, detalle, contact_id, canal
     from objeciones
     where fecha::date between $1 and $2 and categoria = any($3::text[])
     order by fecha desc`,
    [from, to, categorias]
  );

  return rows.map((r) => ({
    fecha: r.fecha,
    categoria: r.categoria,
    detalle: r.detalle,
    contactId: r.contact_id,
    canal: r.canal,
  }));
}

export async function getVolumenRecibido(
  { from, to }: Rango,
  agenteId: string
): Promise<VolumenRecibidoMetric> {
  const norm = sqlAgenteNormalizado("agente_id", "$4");
  const { rows } = await pool.query<{ contactos: number; asignaciones: number }>(
    `select count(distinct contact_id)::int contactos, count(*)::int asignaciones
     from ghl_asignaciones_agente
     where fecha between $1 and $2 and ${norm} = $3`,
    [from, to, agenteId, AGENTE_POR_DEFECTO]
  );
  const base = rows[0] ?? { contactos: 0, asignaciones: 0 };
  if (agenteId !== MELISSA_ID) return base;

  const origenNorm = sqlAgenteNormalizado("agente_origen", "$4");
  const origen = await pool.query<{ agente_id: string; contactos: number }>(
    `select ${origenNorm} agente_id, count(distinct contact_id)::int contactos
     from ghl_escalamientos
     where fecha between $1 and $2 and agente_destino = $3
     group by 1 order by contactos desc`,
    [from, to, MELISSA_ID, AGENTE_POR_DEFECTO]
  );
  const sinEsc = await pool.query<{ contactos: number }>(
    `select count(distinct a.contact_id)::int contactos
     from ghl_asignaciones_agente a
     where a.fecha between $1 and $2 and ${sqlAgenteNormalizado("a.agente_id", "$4")} = $3
       and not exists (select 1 from ghl_escalamientos e
                       where e.contact_id = a.contact_id and e.agente_destino = $3
                         and e.fecha between $1 and $2)`,
    [from, to, agenteId, AGENTE_POR_DEFECTO]
  );
  return {
    ...base,
    porOrigen: origen.rows.map((r) => ({ agenteId: r.agente_id, contactos: r.contactos })),
    sinEscalamiento: sinEsc.rows[0]?.contactos ?? 0,
  };
}

export async function getTiempoResolucionAgente({ from, to }: Rango, agenteId: string): Promise<TiempoMetric> {
  const [totales, serie] = await Promise.all([
    pool.query<{ promedio: string | null; mediana: string | null; muestras: number }>(
      `select avg(tiempo_resolucion_segundos)::float promedio,
              percentile_cont(0.5) within group (order by tiempo_resolucion_segundos)::float mediana,
              count(*)::int muestras
       from ghl_tiempo_resolucion
       where fecha between $1 and $2 and agente_resolucion = $3 and tipo_cierre = 'resuelto'`,
      [from, to, agenteId]
    ),
    pool.query<{ fecha: string; valor: string | null }>(
      `select fecha::text fecha, avg(tiempo_resolucion_segundos)::float valor
       from ghl_tiempo_resolucion
       where fecha between $1 and $2 and agente_resolucion = $3 and tipo_cierre = 'resuelto'
       group by fecha order by fecha`,
      [from, to, agenteId]
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
 * CSAT atribuido al agente: respuestas de contactos que tuvieron al menos una
 * conversación asignada a ese agente dentro del rango (ghl_csat no guarda agente).
 */
export async function getCsatAgente({ from, to }: Rango, agenteId: string): Promise<CsatMetric> {
  const norm = sqlAgenteNormalizado("c.agente_asignado", "$4");
  const delAgente = (alias: string) =>
    `exists (select 1 from ghl_conversaciones c
             where c.contact_id = ${alias}.contact_id and c.fecha between $1 and $2 and ${norm} = $3)`;
  const params = [from, to, agenteId, AGENTE_POR_DEFECTO];

  const [totales, distribucion, pendientes] = await Promise.all([
    pool.query<{ promedio: string | null; respuestas: number; satisfechos: number }>(
      `select avg(score)::float promedio, count(*)::int respuestas,
              count(*) filter (where score >= 4)::int satisfechos
       from ghl_csat s where s.fecha between $1 and $2 and ${delAgente("s")}`,
      params
    ),
    pool.query<{ score: number; conteo: number }>(
      `select score, count(*)::int conteo
       from ghl_csat s where s.fecha between $1 and $2 and ${delAgente("s")}
       group by score order by score`,
      params
    ),
    pool.query<{ conteo: number }>(
      `select count(*)::int conteo
       from ghl_csat_pendiente p where p.solicitado_at::date between $1 and $2 and ${delAgente("p")}`,
      params
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

const SQL_TOPICO = `coalesce(substring(resultado from '^(T[0-9])'), 'Sin tópico')`;

export async function getResolucionesPorTopico({ from, to }: Rango, agenteIa: string): Promise<TopicoItem[]> {
  const { rows } = await pool.query<{ topico: string; conteo: number }>(
    `select ${SQL_TOPICO} topico, count(*)::int conteo
     from ghl_resoluciones_ia
     where fecha between $1 and $2 and agente_ia = $3
     group by 1 order by conteo desc`,
    [from, to, agenteIa]
  );
  return rows;
}

export async function getResolucionesDetalle(
  { from, to }: Rango,
  agenteIa: string,
  topicos: string[]
): Promise<ResolucionDetalleItem[]> {
  if (topicos.length === 0) return [];

  const { rows } = await pool.query<{ fecha: string; resultado: string | null; contact_id: string }>(
    `select fecha::text fecha, resultado, contact_id
     from ghl_resoluciones_ia
     where fecha between $1 and $2 and agente_ia = $3 and ${SQL_TOPICO} = any($4::text[])
     order by fecha desc, created_at desc`,
    [from, to, agenteIa, topicos]
  );

  return rows.map((r) => ({ fecha: r.fecha, resultado: r.resultado ?? "Sin dato", contactId: r.contact_id }));
}

const DETALLE_LIMITE = 2000;

type FilaDetalle = { fecha: string; contact_id: string; conversation_id: string | null; celda: string | number | null };

const COLUMNA_DETALLE: Record<DetalleTipo, string> = {
  atendidas: "Estado",
  "tiempo-respuesta": "Tiempo de respuesta",
  "tiempo-resolucion": "Tiempo de resolución",
  escaladas: "Motivo de escalamiento",
  asignaciones: "Asignaciones",
  csat: "Calificación",
};

function formatoCelda(tipo: DetalleTipo, raw: string | number | null): string {
  if (raw == null) return "—";
  switch (tipo) {
    case "atendidas":
      return raw === "abierta" ? "Abierta" : "Cerrada";
    case "tiempo-respuesta":
    case "tiempo-resolucion":
      return formatDuracion(Number(raw));
    case "csat":
      return `${raw} ★`;
    default:
      return String(raw);
  }
}

/** Filas detrás de cada tarjeta del panel de un agente, para auditar conversación por conversación. */
export async function getDetalleAgente(
  { from, to }: Rango,
  agenteId: string,
  tipo: DetalleTipo,
  estado: DetalleEstado = "todas"
): Promise<DetalleResponse> {
  const params: unknown[] = [from, to, agenteId, AGENTE_POR_DEFECTO];
  let sql: string;

  switch (tipo) {
    case "atendidas": {
      const norm = sqlAgenteNormalizado("agente_asignado", "$4");
      const filtroEstado =
        estado === "abierta" ? " and estado = 'abierta'" : estado === "cerrada" ? " and estado <> 'abierta'" : "";
      sql = `select fecha::text fecha, contact_id, conversation_id, estado celda
             from ghl_conversaciones
             where fecha between $1 and $2 and ${norm} = $3${filtroEstado}
             order by created_at desc`;
      break;
    }
    case "tiempo-respuesta": {
      const norm = sqlAgenteNormalizado("c.agente_asignado", "$4");
      sql = `select pr.fecha::text fecha, pr.contact_id, pr.conversation_id, pr.tiempo_respuesta_segundos celda
             from ghl_primera_respuesta pr
             join ghl_conversaciones c on c.id = pr.sesion_id
             where pr.fecha between $1 and $2 and ${norm} = $3
             order by pr.tiempo_respuesta_segundos desc`;
      break;
    }
    case "tiempo-resolucion": {
      if (agenteId === MELISSA_ID) {
        const norm = sqlAgenteNormalizado("agente_id", "$4");
        sql = `with recibido as (
                 select contact_id, min(created_at) recibido_at
                 from ghl_asignaciones_agente
                 where fecha between $1 and $2 and ${norm} = $3
                 group by contact_id
               )
               select * from (
                 select distinct on (r.contact_id)
                        (r.recibido_at at time zone 'America/Bogota')::date::text fecha,
                        r.contact_id, c.conversation_id,
                        extract(epoch from (c.closed_at - r.recibido_at))::float celda
                 from recibido r
                 join ghl_conversaciones c
                   on c.contact_id = r.contact_id and c.closed_at is not null and c.closed_at > r.recibido_at
                 order by r.contact_id, c.closed_at asc
               ) t
               order by celda desc`;
      } else {
        sql = `select fecha::text fecha, contact_id, conversation_id, tiempo_resolucion_segundos celda
               from ghl_tiempo_resolucion
               where fecha between $1 and $2 and agente_resolucion = $3 and tipo_cierre = 'resuelto'
               order by tiempo_resolucion_segundos desc`;
        params.pop();
      }
      break;
    }
    case "escaladas": {
      const norm = sqlAgenteNormalizado("agente_origen", "$4");
      sql = `select fecha::text fecha, contact_id, conversation_id, motivo celda
             from ghl_escalamientos
             where fecha between $1 and $2 and ${norm} = $3 and agente_destino = $5
             order by fecha desc, created_at desc`;
      params.push(MELISSA_ID);
      break;
    }
    case "asignaciones": {
      const norm = sqlAgenteNormalizado("a.agente_id", "$4");
      sql = `select min(a.fecha)::text fecha, a.contact_id, conv.conversation_id, count(*)::int celda
             from ghl_asignaciones_agente a
             left join lateral (
               select c.conversation_id from ghl_conversaciones c
               where c.contact_id = a.contact_id order by c.created_at desc limit 1
             ) conv on true
             where a.fecha between $1 and $2 and ${norm} = $3
             group by a.contact_id, conv.conversation_id
             order by min(a.fecha) desc, a.contact_id`;
      break;
    }
    case "csat": {
      const norm = sqlAgenteNormalizado("c.agente_asignado", "$4");
      sql = `select s.fecha::text fecha, s.contact_id, conv.conversation_id, s.score celda
             from ghl_csat s
             left join lateral (
               select c.conversation_id from ghl_conversaciones c
               where c.contact_id = s.contact_id order by c.created_at desc limit 1
             ) conv on true
             where s.fecha between $1 and $2
               and exists (select 1 from ghl_conversaciones c
                           where c.contact_id = s.contact_id and c.fecha between $1 and $2 and ${norm} = $3)
             order by s.fecha desc, s.created_at desc`;
      break;
    }
  }

  const { rows } = await pool.query<FilaDetalle>(`${sql} limit ${DETALLE_LIMITE + 1}`, params);
  const items: DetalleItem[] = rows.slice(0, DETALLE_LIMITE).map((r) => ({
    fecha: r.fecha,
    contactId: r.contact_id,
    conversationId: r.conversation_id,
    celda: formatoCelda(tipo, r.celda),
    valor: typeof r.celda === "number" ? r.celda : null,
  }));

  return { columna: COLUMNA_DETALLE[tipo], items, truncado: rows.length > DETALLE_LIMITE };
}
