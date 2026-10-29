-- Ejecución manual del usuario.
-- Desde ahora `motivo` guarda solo el código de tópico (T1–T5) en los escalamientos
-- de Sami a Melissa, y el texto explicativo va en `detalle`.
alter table public.ghl_escalamientos add column detalle text null;
