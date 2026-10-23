-- Book do empreendimento: quando alguém baixa o PDF, a ficha do lead mostra "Baixou o book".
-- Não guarda nada além do que já existe (o lead e o nome do empreendimento).

alter table public.lead_eventos drop constraint if exists lead_eventos_tipo_check;
alter table public.lead_eventos
  add constraint lead_eventos_tipo_check check (tipo in ('nota', 'mudanca_fase', 'retorno', 'book'));

create or replace function public.registrar_book(p_lead uuid, p_slug text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.lead_eventos (lead_id, tipo, texto) values (p_lead, 'book', p_slug);
end $$;

-- Só o servidor (chave de serviço) chama esta função.
revoke all on function public.registrar_book(uuid, text) from public, anon, authenticated;
grant execute on function public.registrar_book(uuid, text) to service_role;
