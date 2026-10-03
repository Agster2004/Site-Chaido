-- Painel de leads da Chiado. Projeto Supabase só do Chiado.
-- Rodar inteiro no SQL Editor do Supabase.

create table public.textos_consentimento (
  versao text primary key,
  texto text not null,
  criado_em timestamptz not null default now()
);

create table public.fases (
  id text primary key,
  nome text not null,
  ordem int not null unique
);

create table public.motivos_perda (
  id text primary key,
  nome text not null,
  ordem int not null unique
);

create table public.usuarios_painel (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  nome text not null check (char_length(nome) between 2 and 120),
  telefone text not null unique check (telefone ~ '^\+55[0-9]{10,11}$'),
  email text check (email is null or char_length(email) <= 254),
  mensagem text check (mensagem is null or char_length(mensagem) <= 1000),
  empreendimento_slug text,
  fase text not null default 'novo' references public.fases(id),
  motivo_perda text references public.motivos_perda(id),
  atribuido_a uuid references auth.users(id) on delete set null,
  origem_fonte text,
  origem_meio text,
  origem_campanha text,
  pagina_origem text,
  referrer text,
  retornos int not null default 0,
  ultimo_contato_em timestamptz,
  vendido_em timestamptz,
  consentimento_em timestamptz not null,
  consentimento_versao text not null references public.textos_consentimento(versao),
  aviso_email_ok boolean not null default true,
  constraint perdido_exige_motivo check (fase <> 'perdido' or motivo_perda is not null)
);
create index leads_fase_idx on public.leads (fase);
create index leads_criado_em_idx on public.leads (criado_em desc);
create index leads_empreendimento_idx on public.leads (empreendimento_slug);

create table public.lead_eventos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  criado_em timestamptz not null default now(),
  tipo text not null check (tipo in ('nota', 'mudanca_fase', 'retorno')),
  texto text,
  de_fase text,
  para_fase text,
  autor uuid references auth.users(id) on delete set null
);
create index lead_eventos_lead_idx on public.lead_eventos (lead_id, criado_em desc);

create table public.envios_recentes (
  ip_hash text not null,
  criado_em timestamptz not null default now()
);
create index envios_recentes_idx on public.envios_recentes (ip_hash, criado_em);

-- Dados iniciais
insert into public.textos_consentimento (versao, texto) values
  ('v1', 'Concordo em receber contato da Chiado Construtora e Incorporadora (CNPJ 57.026.203/0001-74) por WhatsApp, telefone ou e-mail sobre os empreendimentos. Meus dados serão usados só para esse fim, conforme a Política de Privacidade.');

insert into public.fases (id, nome, ordem) values
  ('novo', 'Novo', 1),
  ('contatado', 'Contatado', 2),
  ('visita_agendada', 'Visita agendada', 3),
  ('proposta', 'Proposta', 4),
  ('vendido', 'Vendido', 5),
  ('perdido', 'Perdido', 6);

insert into public.motivos_perda (id, nome, ordem) values
  ('preco', 'Preço', 1),
  ('localizacao', 'Localização', 2),
  ('sem_retorno', 'Sem retorno', 3),
  ('comprou_outro', 'Comprou em outro lugar', 4),
  ('outro', 'Outro', 5);

-- Gatilhos
create function public.toca_atualizado_em() returns trigger
language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

create trigger leads_atualizado_em before update on public.leads
  for each row execute function public.toca_atualizado_em();

create function public.evento_atualiza_contato() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tipo = 'nota' or (new.tipo = 'mudanca_fase' and new.de_fase is not null) then
    update public.leads set ultimo_contato_em = new.criado_em where id = new.lead_id;
  end if;
  return new;
end $$;

create trigger lead_eventos_contato after insert on public.lead_eventos
  for each row execute function public.evento_atualiza_contato();

-- Funções chamadas pelo servidor (só service_role)
create function public.registrar_lead(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_novo boolean := false;
begin
  insert into public.leads (
    nome, telefone, email, mensagem, empreendimento_slug,
    origem_fonte, origem_meio, origem_campanha, pagina_origem, referrer,
    consentimento_em, consentimento_versao
  ) values (
    p->>'nome', p->>'telefone', nullif(p->>'email', ''), nullif(p->>'mensagem', ''),
    nullif(p->>'empreendimento_slug', ''),
    nullif(p->>'origem_fonte', ''), nullif(p->>'origem_meio', ''), nullif(p->>'origem_campanha', ''),
    nullif(p->>'pagina_origem', ''), nullif(p->>'referrer', ''),
    now(), p->>'consentimento_versao'
  )
  on conflict (telefone) do nothing
  returning id into v_id;

  if v_id is not null then
    v_novo := true;
    insert into public.lead_eventos (lead_id, tipo, para_fase) values (v_id, 'mudanca_fase', 'novo');
  else
    select id into v_id from public.leads where telefone = p->>'telefone';
    update public.leads set retornos = retornos + 1 where id = v_id;
    insert into public.lead_eventos (lead_id, tipo, texto)
      values (v_id, 'retorno', nullif(p->>'mensagem', ''));
  end if;

  return jsonb_build_object('id', v_id, 'novo', v_novo);
end $$;

create function public.permitir_envio(p_ip_hash text, p_limite int default 5) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_qtd int;
begin
  delete from public.envios_recentes where criado_em < now() - interval '1 hour';
  select count(*) into v_qtd from public.envios_recentes where ip_hash = p_ip_hash;
  if v_qtd >= p_limite then
    return false;
  end if;
  insert into public.envios_recentes (ip_hash) values (p_ip_hash);
  return true;
end $$;

revoke all on function public.registrar_lead(jsonb) from public, anon, authenticated;
revoke all on function public.permitir_envio(text, int) from public, anon, authenticated;
grant execute on function public.registrar_lead(jsonb) to service_role;
grant execute on function public.permitir_envio(text, int) to service_role;

-- Funções do painel (usuário logado, sob as regras de acesso)
create function public.eh_usuario_painel() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.usuarios_painel where user_id = auth.uid())
$$;

create function public.mudar_fase(p_lead uuid, p_fase text, p_motivo text default null) returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_antiga text;
begin
  select fase into v_antiga from public.leads where id = p_lead for update;
  if not found then
    raise exception 'lead nao encontrado';
  end if;
  update public.leads
     set fase = p_fase,
         motivo_perda = case when p_fase = 'perdido' then p_motivo else null end,
         vendido_em = case when p_fase = 'vendido' then now() else null end
   where id = p_lead;
  insert into public.lead_eventos (lead_id, tipo, de_fase, para_fase, texto, autor)
    values (p_lead, 'mudanca_fase', v_antiga, p_fase, p_motivo, auth.uid());
end $$;

revoke all on function public.eh_usuario_painel() from public, anon;
revoke all on function public.mudar_fase(uuid, text, text) from public, anon;
grant execute on function public.eh_usuario_painel() to authenticated;
grant execute on function public.mudar_fase(uuid, text, text) to authenticated;

-- Regras de acesso (RLS): ligadas em tudo. Sem política = ninguém acessa.
alter table public.textos_consentimento enable row level security;
alter table public.fases enable row level security;
alter table public.motivos_perda enable row level security;
alter table public.usuarios_painel enable row level security;
alter table public.leads enable row level security;
alter table public.lead_eventos enable row level security;
alter table public.envios_recentes enable row level security;

create policy consentimento_leitura on public.textos_consentimento
  for select to anon, authenticated using (true);

create policy fases_leitura on public.fases
  for select to authenticated using (public.eh_usuario_painel());

create policy motivos_leitura on public.motivos_perda
  for select to authenticated using (public.eh_usuario_painel());

create policy usuarios_leitura on public.usuarios_painel
  for select to authenticated using (user_id = auth.uid());

create policy leads_leitura on public.leads
  for select to authenticated using (public.eh_usuario_painel());
create policy leads_edicao on public.leads
  for update to authenticated
  using (public.eh_usuario_painel()) with check (public.eh_usuario_painel());
create policy leads_exclusao on public.leads
  for delete to authenticated using (public.eh_usuario_painel());

create policy eventos_leitura on public.lead_eventos
  for select to authenticated using (public.eh_usuario_painel());
create policy eventos_insercao on public.lead_eventos
  for insert to authenticated
  with check (public.eh_usuario_painel() and autor = auth.uid());
