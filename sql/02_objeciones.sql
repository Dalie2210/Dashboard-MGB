create table public.objeciones (
  id bigserial not null,
  contact_id text not null,
  canal text not null,
  categoria text not null,
  detalle text null,
  fecha timestamp with time zone not null default now(),
  constraint objeciones_pkey primary key (id),
  constraint objeciones_canal_check check (
    (
      canal = any (array['ghl'::text, 'manychat'::text])
    )
  ),
  constraint objeciones_categoria_check check (
    (
      categoria = any (
        array[
          'precio'::text,
          'personalizacion'::text,
          'adecuacion_clinica'::text,
          'medios_pago'::text,
          'hablar_con_humano'::text,
          'friccion_checkout'::text,
          'permanencia_confianza'::text,
          'consultar_familia'::text,
          'tiempo'::text,
          'otro'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_objeciones_contact_id on public.objeciones using btree (contact_id) TABLESPACE pg_default;

create index IF not exists idx_objeciones_categoria on public.objeciones using btree (categoria) TABLESPACE pg_default;

create index IF not exists idx_objeciones_fecha on public.objeciones using btree (fecha) TABLESPACE pg_default;
