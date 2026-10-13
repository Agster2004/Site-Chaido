-- Contador de visitas: só somas por dia, página e origem. Nenhum dado pessoal (sem IP, sem cookie, sem nome).
-- Uma visita = uma sessão do navegador, contada na página de entrada. Quem grava é o servidor (api/visita.js);
-- o painel só lê, e só quem está em usuarios_painel.

create table public.visitas_diarias (
  dia date not null,
  caminho text not null,
  fonte text not null default '',
  meio text not null default '',
  campanha text not null default '',
  total int not null default 0,
  primary key (dia, caminho, fonte, meio, campanha)
);

-- Soma 1 à linha do dia (fuso de São Paulo). Para ninguém encher a tabela com origens inventadas, depois de
-- 500 combinações no mesmo dia as novas origens entram juntas como "outros".
create function public.registrar_visita(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
  v_caminho text := left(coalesce(p->>'caminho', '/'), 120);
  v_fonte text := left(coalesce(p->>'fonte', ''), 50);
  v_meio text := left(coalesce(p->>'meio', ''), 50);
  v_campanha text := left(coalesce(p->>'campanha', ''), 50);
begin
  if not exists (
    select 1 from public.visitas_diarias
     where dia = v_dia and caminho = v_caminho and fonte = v_fonte and meio = v_meio and campanha = v_campanha
  ) and (select count(*) from public.visitas_diarias where dia = v_dia) >= 500 then
    v_fonte := 'outros';
    v_meio := '';
    v_campanha := '';
  end if;

  insert into public.visitas_diarias (dia, caminho, fonte, meio, campanha, total)
  values (v_dia, v_caminho, v_fonte, v_meio, v_campanha, 1)
  on conflict (dia, caminho, fonte, meio, campanha)
  do update set total = public.visitas_diarias.total + 1;
end $$;

revoke all on function public.registrar_visita(jsonb) from public, anon, authenticated;
grant execute on function public.registrar_visita(jsonb) to service_role;

alter table public.visitas_diarias enable row level security;

create policy visitas_leitura on public.visitas_diarias
  for select to authenticated using (public.eh_usuario_painel());
