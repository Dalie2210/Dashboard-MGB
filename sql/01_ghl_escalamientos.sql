-- DDL propuesto para registrar escalamientos entre agentes (Camila -> Sami -> Melissa).
-- Ejecución manual del usuario: esta tabla no existe hoy y no se infiere desde
-- otras tablas. Debe poblarse desde la integración GHL.

create table public.ghl_escalamientos (
  id serial primary key,
  contact_id text not null,
  conversation_id text null,
  sesion_id integer null references ghl_conversaciones (id),
  agente_origen text null,        -- ID GHL; vacío/NULL ⇒ Camila
  agente_destino text not null,   -- ID GHL
  motivo text not null,
  fecha date not null default current_date,
  created_at timestamp with time zone not null default now()
);

create index idx_ghl_esc_fecha on public.ghl_escalamientos (fecha, agente_destino);
create index idx_ghl_esc_contact on public.ghl_escalamientos (contact_id, created_at desc);

-- `motivo` debe venir de un conjunto acotado de valores (no texto libre) para
-- que el gráfico de "Motivos de escalamiento" tenga categorías estables.
