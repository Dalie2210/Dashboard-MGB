-- Queries de verificación manual (no ejecutar desde la app).
-- Correr una por una en el editor SQL de Supabase y confirmar los supuestos
-- del plan antes de confiar en el dashboard.

-- 1. Valores distintos de `estado` en ghl_conversaciones
select estado, count(*) from ghl_conversaciones group by 1 order by 2 desc;

-- 2. Valores distintos de `resultado` en ghl_resoluciones_ia
select resultado, count(*) from ghl_resoluciones_ia group by 1 order by 2 desc;

-- 3. Valores distintos de `agente_ia` en ghl_resoluciones_ia
select agente_ia, count(*) from ghl_resoluciones_ia group by 1 order by 2 desc;

-- 4. IDs distintos de `agente_asignado` en ghl_conversaciones (para detectar
--    agentes no mapeados en src/lib/agentes.ts)
select agente_asignado, count(*) from ghl_conversaciones group by 1 order by 2 desc;

-- 5. Conteo de filas con agente vacío/NULL/"undefined"/"null" (deben sumarse a
--    Camila en el donut). El caso "undefined" literal es un bug de la
--    integración GHL detectado en datos reales (~39% de las filas), no una
--    decisión de negocio: se normaliza igual que vacío/NULL.
select count(*) from ghl_conversaciones
where trim(coalesce(agente_asignado, '')) = ''
   or lower(trim(agente_asignado)) in ('undefined', 'null');

-- 6. Rango real de `fecha` por tabla
select 'ghl_conversaciones' tabla, min(fecha) desde, max(fecha) hasta from ghl_conversaciones
union all
select 'ghl_resoluciones_ia', min(fecha), max(fecha) from ghl_resoluciones_ia
union all
select 'ghl_primera_respuesta', min(fecha), max(fecha) from ghl_primera_respuesta
union all
select 'ghl_tiempo_resolucion', min(fecha), max(fecha) from ghl_tiempo_resolucion
union all
select 'ghl_csat', min(fecha), max(fecha) from ghl_csat
union all
select 'ghl_csat_pendiente', min(solicitado_at::date), max(solicitado_at::date) from ghl_csat_pendiente;

-- 7. Puntajes distintos en ghl_csat (debe ser 1..5)
select score, count(*) from ghl_csat group by 1 order by 1;

-- 8. ventas_camila: rango de created_at (verificar el supuesto de que ya
--    viene en hora Colombia, no UTC)
select min(created_at) desde, max(created_at) hasta from ventas_camila;

-- 9. ventas_camila: nulos en value y buyer_email
select
  count(*) filter (where value is null) sin_value,
  count(*) filter (where nullif(trim(buyer_email), '') is null) sin_buyer_email,
  count(*) total
from ventas_camila;

-- 10. ventas_camila: distribución por hora (para contrastar con el supuesto
--     de hora Colombia del punto 8)
select extract(hour from created_at) hora, count(*)
from ventas_camila group by 1 order by 1;
