import { pool } from "@/lib/db";
import { AGENTE_POR_DEFECTO, MELISSA_ID } from "@/lib/agentes";
import { sqlAgenteNormalizado } from "@/lib/sql-agentes";
import type { ConversacionesMetric, SerieDiaria } from "@/types/metrics";
import type {
  CargaItem,
  CargaMetric,
  MotivoDetalleItem,
  MotivoItem,
  TiempoRespuestaMetric,
  TiempoTrasRecibirMetric,
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

function rellenarCarga(filas: CargaItem[], desde: number, hasta: number): CargaItem[] {
  const mapa = new Map(filas.map((f) => [f.clave, f.conteo]));
  const resultado: CargaItem[] = [];
  for (let i = desde; i <= hasta; i++) {
    resultado.push({ clave: i, conteo: mapa.get(i) ?? 0 });
  }
  return resultado;
}

export async function getCargaDiaHoraMelissa({ from, to }: Rango, agenteId: string): Promise<CargaMetric> {
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

export async function getMotivosEscalamiento({ from, to }: Rango): Promise<MotivoItem[]> {
  const { rows } = await pool.query<{ motivo: string; conteo: number }>(
    `select motivo, count(*)::int conteo
     from ghl_escalamientos
     where fecha between $1 and $2 and agente_destino = $3
     group by motivo order by conteo desc`,
    [from, to, MELISSA_ID]
  );
  return rows;
}

export async function getMotivosEscalamientoDetalle({ from, to }: Rango, motivos: string[]): Promise<MotivoDetalleItem[]> {
  if (motivos.length === 0) return [];

  const { rows } = await pool.query<{ fecha: string; motivo: string; contact_id: string }>(
    `select fecha::text fecha, motivo, contact_id
     from ghl_escalamientos
     where fecha between $1 and $2 and agente_destino = $3 and motivo = any($4::text[])
     order by fecha desc, created_at desc`,
    [from, to, MELISSA_ID, motivos]
  );

  return rows.map((r) => ({ fecha: r.fecha, motivo: r.motivo, contactId: r.contact_id }));
}

export async function getVolumenRecibidoMelissa(
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
  return rows[0] ?? { contactos: 0, asignaciones: 0 };
}
