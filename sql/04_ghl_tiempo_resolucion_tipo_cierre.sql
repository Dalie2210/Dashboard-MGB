-- Distingue cierres confirmados (resuelto) de cierres automáticos por 24 h sin
-- respuesta de la clienta (inactividad). Escribe la columna el flujo n8n
-- "SAC - Chat Cerrado" según body.customData.tipo_cierre.
-- Las filas existentes quedan como 'resuelto' (comportamiento previo).

alter table ghl_tiempo_resolucion
  add column if not exists tipo_cierre text not null default 'resuelto';

alter table ghl_tiempo_resolucion
  drop constraint if exists ghl_tiempo_resolucion_tipo_cierre_chk;

alter table ghl_tiempo_resolucion
  add constraint ghl_tiempo_resolucion_tipo_cierre_chk
  check (tipo_cierre in ('resuelto', 'inactividad'));

comment on column ghl_tiempo_resolucion.tipo_cierre is
  'resuelto = cierre por agente/bot; inactividad = cierre automático tras 24 h sin respuesta de la clienta (no cuenta para el tiempo de resolución)';

create index if not exists ghl_tiempo_resolucion_tipo_cierre_fecha_idx
  on ghl_tiempo_resolucion (tipo_cierre, fecha);
