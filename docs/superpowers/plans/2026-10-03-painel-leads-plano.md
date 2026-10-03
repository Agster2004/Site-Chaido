# Painel de leads da Chiado — plano de implementação (versão 1)

> **Para quem for executar:** usar a skill `subagent-driven-development` (recomendado) ou `executing-plans`, tarefa por tarefa. Os passos usam caixas `- [ ]` para acompanhar. **Nada deste plano é executado antes de o usuário dizer "pode construir".**

> **Estado (03/10/2026):** Tarefas 0 a 9 executadas na branch `trabalho`, com os desvios registrados nos commits e no `resumo-tecnico-sessao.md` (retirada do `pgcrypto`, `urlBase` do Supabase, `motivoRobo`, link do consentimento, CSV do telefone). Pendente para ir ao ar: Resend (DNS), decisões do usuário e "podemos colocar no ar".

**Objetivo:** captar leads pelo site, guardá-los num banco só do Chiado e dar à equipe um painel (`/painel`) para acompanhar cada lead até a venda.

**Arquitetura:** o formulário do site envia para `POST /api/lead` (função da Vercel), que valida, barra robôs, grava no Supabase e avisa por e-mail (Resend). O painel é uma página estática em `site/painel/` que lê e edita os leads pelo Supabase, sob regras de acesso (RLS) que só liberam usuários cadastrados. Tudo no repositório Site-Chaido, sem build e sem `package.json`.

**Stack:** HTML/CSS/JS puros (módulos ES no navegador), funções Node da Vercel usando só `fetch`, Supabase (Postgres + Auth + REST/RPC), Resend (e-mail), `supabase-js` via CDN (`cdn.jsdelivr.net`), testes com `node --test` (módulo nativo, sem instalar nada).

**Spec:** `docs/superpowers/specs/2026-10-03-painel-leads-design.md` (aprovado pelo usuário em 03/10/2026). Este plano acrescenta três detalhes de construção, registrados na Tarefa 0: tabelas `fases` e `motivos_perda` (para mudar fases sem mexer em vários arquivos), coluna `vendido_em` (para "vendidos no mês") e a variável `IP_HASH_SALT`.

## Restrições globais (valem para todas as tarefas)

- Site sem build e sem `package.json`. Funções em `site/api/` usam **só `fetch`** e módulos próprios; nada de pacotes npm.
- Tudo em português: textos da tela, mensagens de erro, commits, documentos. Texto de interface em *sentence case* (só a primeira letra maiúscula), sem ponto final em rótulos e títulos.
- Domínio oficial `https://www.chiadoconstrutora.com.br` (constante `SITE_URL`, sobrescrevível pela variável de ambiente `SITE_URL`).
- **Supabase: projeto novo só do Chiado. Nunca usar o projeto do Site Financeiro**, nem reaproveitar chaves ou dados dele. **Não tocar no repositório nem na pasta do Site Financeiro.**
- **Chave de serviço** (`SUPABASE_SERVICE_ROLE_KEY`) só em `site/api/_lib/supabase.js` e nas variáveis da Vercel. Nunca em arquivo servido ao navegador, nunca em commit, nunca no chat. O usuário cola as chaves direto na Vercel.
- O formulário público **nunca** fala direto com o banco; só `/api/lead` grava leads novos.
- Texto vindo do visitante nunca vira HTML: escapar no painel (`escapeHtml`) e no e-mail (`esc`).
- LGPD: caixa de consentimento **desmarcada**; nome e WhatsApp obrigatórios; e-mail e mensagem opcionais; não pedir CPF nem renda; guardar versão, data e hora do consentimento.
- O painel não entra no Google: `noindex` na página e em `/painel/*`, e `Disallow: /painel/` no `robots.txt`.
- Fluxo: trabalho na branch `trabalho` → push da `trabalho` (gera a prévia `site-chaido-git-trabalho-chiado.vercel.app`) → teste na prévia → o usuário diz "podemos colocar no ar" → só então `main`. **Nunca `main` sem esse ok.** Push da `trabalho` não afeta o site no ar.
- Mudança que mexe no banco: backup antes (exportar a tabela `leads` em CSV pelo painel do Supabase) e teste primeiro.
- Commits e mensagens em português, com as linhas de atribuição padrão do Claude Code.

---

## Mapa de arquivos

**Criar**

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/0001_leads.sql` | Tabelas, regras de acesso (RLS), funções e dados iniciais do banco |
| `site/api/_lib/validacao.js` | Telefone, validação do lead, detecção de robô (funções puras) |
| `site/api/_lib/ip.js` | IP da requisição e hash dele |
| `site/api/_lib/supabase.js` | Chamadas ao Supabase com a chave de serviço |
| `site/api/_lib/email.js` | Montar e enviar o e-mail de aviso (Resend) |
| `site/api/_lib/proprio.js` | Ler JSONs do próprio site (`/data/...`) |
| `site/api/lead.js` | Função `POST /api/lead` |
| `site/api/painel-config.js` | Entrega URL e chave pública do Supabase ao painel |
| `site/data/consentimento.json` | Versão e texto do consentimento |
| `site/data/empresa.json` | Dados da empresa usados em `/privacidade` |
| `site/assets/utm.js` | Guarda a origem do visitante na sessão |
| `site/assets/lead-form.js` | Formulário de interesse |
| `site/assets/privacidade.js` | Preenche os dados da empresa em `/privacidade` |
| `site/privacidade.html` | Política de privacidade |
| `site/painel/index.html`, `site/painel/painel.css` | Casca e estilo do painel |
| `site/painel/js/format.js` | Funções puras (tempo, filtros, números, CSV, links) |
| `site/painel/js/api.js` | Consultas ao Supabase no navegador |
| `site/painel/js/ui.js` | Estado, moldura da tela, download |
| `site/painel/js/tela-login.js`, `tela-lista.js`, `tela-ficha.js`, `tela-pessoa.js`, `main.js` | Telas e roteamento |
| `tests/*.test.mjs` | Testes automáticos (`node --test`) |

**Modificar:** `site/index.html`, `site/imovel.html`, `site/assets/render.js`, `site/assets/style.css`, `site/vercel.json`, `site/robots.txt`, `site/api/sitemap.js`, o desenho aprovado e os `.md` do projeto.

---

### Tarefa 0: preparação (ações do usuário e ajustes no desenho)

Nenhum código do site. Sem estes itens, parar e perguntar.

**Arquivos:** Modificar `docs/superpowers/specs/2026-10-03-painel-leads-design.md`.

**Interfaces:** Produz as variáveis de ambiente e os dados que as tarefas seguintes usam:
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `LEAD_NOTIFY_EMAILS` (lista separada por vírgula), `LEAD_FROM_EMAIL` (ex.: `Chiado leads <leads@seu-dominio>`), `IP_HASH_SALT`.

- [ ] **Passo 1: o usuário cria o projeto no Supabase.** Organização nova (ex.: "Chiado Site") e projeto `chiado-leads`, região São Paulo. Enquanto o painel é construído, esse único projeto serve de teste; **antes de entrar no ar os leads de teste são apagados** (Tarefa 9). Se o plano gratuito não permitir um projeto novo, parar e decidir com o usuário (plano pago).
- [ ] **Passo 2: o usuário configura o login no Supabase** (Authentication): desligar "Allow new users to sign up" e criar o primeiro usuário (e-mail do usuário, senha forte, "Auto confirm user" ligado).
- [ ] **Passo 3: o usuário cria a conta no Resend,** verifica o domínio `chiadoconstrutora.com.br` (os registros DNS são criados no Registro.br, onde o usuário tem acesso; o Claude passa o passo a passo) e cria uma chave de API só de envio.
- [ ] **Passo 4: o usuário informa os dados para a política de privacidade:** razão social, endereço da empresa e e-mail para pedidos de privacidade (o CNPJ `57.026.203/0001-74` já está no site).
- [ ] **Passo 5: o usuário informa** os e-mails que recebem o aviso de lead novo e o e-mail do primeiro usuário do painel.
- [ ] **Passo 6: o usuário cola as variáveis na Vercel.** No Supabase (Project Settings → API Keys), a chave pública pode se chamar "Publishable key" (ou "anon", no formato antigo) e a de servidor "Secret key" (ou "service_role"); o código aceita os dois formatos, e os nomes das variáveis continuam `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. Marcar as chaves secretas como "Sensitive" na Vercel. Cole as variáveis na Vercel (projeto `site-chaido` → Settings → Environment Variables), marcadas para **Preview e Production**. Para `IP_HASH_SALT`, gerar um texto aleatório **no terminal do próprio usuário** (não no chat): `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`. Variáveis novas só valem depois de um novo deploy.
- [ ] **Passo 7: conferir os nomes (sem ver valores).** O Claude lista as variáveis do projeto pela ferramenta da Vercel (`filter_project_envs`, sem descriptografar) e confirma que os 7 nomes existem em Preview e Production.
- [ ] **Passo 8: atualizar o desenho aprovado.** Em `docs/superpowers/specs/2026-10-03-painel-leads-design.md`: (a) na seção 5, na tabela de `leads`, acrescentar a linha `| vendido_em | timestamptz, opcional | preenchido quando a fase vira vendido; base do número "vendidos no mês" |`; (b) na seção 5, depois de `lead_eventos`, acrescentar o parágrafo `**fases** e **motivos_perda**: tabelas de apoio (id, nome, ordem) com a lista de fases do funil e de motivos de perda. Mudar ou incluir uma fase passa a ser uma linha nova na tabela, sem alterar vários arquivos.`; (c) na seção 15, na lista de variáveis, acrescentar `IP_HASH_SALT` (texto aleatório, usado só para guardar o IP como hash).
- [ ] **Passo 9: commit.**

```bash
git add docs/superpowers/specs/2026-10-03-painel-leads-design.md
git commit -m "Desenho do painel de leads: vendido_em, tabelas de fases e IP_HASH_SALT"
```

---

### Tarefa 1: banco de dados (tabelas, regras de acesso e funções)

**Arquivos:**
- Criar: `supabase/migrations/0001_leads.sql`
- Criar: `tests/rls.test.mjs`

**Interfaces:**
- Produz (banco): tabelas `textos_consentimento`, `fases`, `motivos_perda`, `usuarios_painel`, `leads`, `lead_eventos`, `envios_recentes`; funções `registrar_lead(p jsonb) → jsonb {id, novo}` (só `service_role`), `permitir_envio(p_ip_hash text, p_limite int) → boolean` (só `service_role`), `mudar_fase(p_lead uuid, p_fase text, p_motivo text) → void` e `eh_usuario_painel() → boolean` (usuário logado).
- Fases: `novo`, `contatado`, `visita_agendada`, `proposta`, `vendido`, `perdido`. Motivos: `preco`, `localizacao`, `sem_retorno`, `comprou_outro`, `outro`. Versão de consentimento inicial: `v1`.

- [ ] **Passo 1: criar a migração.**

`supabase/migrations/0001_leads.sql`:

```sql
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
```

- [ ] **Passo 2: o usuário roda a migração.** No Supabase: SQL Editor → colar o arquivo inteiro → Run. Resultado esperado: "Success. No rows returned".
- [ ] **Passo 3: cadastrar o primeiro usuário do painel.** No SQL Editor (trocar o e-mail e o nome pelos que o usuário informou na Tarefa 0, passo 5):

```sql
insert into public.usuarios_painel (user_id, nome)
select id, 'Nome do usuário' from auth.users where email = 'email-do-usuario@exemplo.com';
```

Conferir: `select count(*) from public.usuarios_painel;` deve dar `1`.

- [ ] **Passo 4: conferir os dados iniciais.** No SQL Editor: `select (select count(*) from public.fases) as fases, (select count(*) from public.motivos_perda) as motivos, (select count(*) from public.textos_consentimento) as consentimentos;` Esperado: `6`, `5`, `1`.
- [ ] **Passo 5: escrever o teste de acesso.** Ele só roda se as variáveis `TESTE_SUPABASE_URL`, `TESTE_ANON_KEY` e `TESTE_SERVICE_KEY` existirem no terminal de quem roda; sem elas é ignorado. **As chaves nunca vão para o chat nem para arquivos:** o usuário as define no próprio terminal.

`tests/rls.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

const URL_BASE = process.env.TESTE_SUPABASE_URL;
const ANON = process.env.TESTE_ANON_KEY;
const SERVICO = process.env.TESTE_SERVICE_KEY;
const pular = !URL_BASE || !ANON || !SERVICO ? 'defina TESTE_SUPABASE_URL, TESTE_ANON_KEY e TESTE_SERVICE_KEY' : false;

const chamar = (caminho, chave, opcoes = {}) =>
  fetch(URL_BASE.replace(/\/$/, '') + caminho, {
    ...opcoes,
    headers: {
      apikey: chave,
      ...(chave.startsWith('eyJ') ? { Authorization: 'Bearer ' + chave } : {}),
      'Content-Type': 'application/json',
      ...(opcoes.headers || {}),
    },
  });

test('visitante anônimo não lê leads', { skip: pular }, async () => {
  const r = await chamar('/rest/v1/leads?select=id', ANON);
  const corpo = r.ok ? await r.json() : [];
  assert.deepEqual(corpo, []);
});

test('visitante anônimo não grava lead direto no banco', { skip: pular }, async () => {
  const r = await chamar('/rest/v1/leads', ANON, {
    method: 'POST',
    body: JSON.stringify({ nome: 'Teste', telefone: '+5513900000001', consentimento_em: new Date().toISOString(), consentimento_versao: 'v1' }),
  });
  assert.equal(r.ok, false);
});

test('visitante anônimo não executa registrar_lead', { skip: pular }, async () => {
  const r = await chamar('/rest/v1/rpc/registrar_lead', ANON, { method: 'POST', body: JSON.stringify({ p: {} }) });
  assert.equal(r.ok, false);
});

test('visitante anônimo não executa permitir_envio', { skip: pular }, async () => {
  const r = await chamar('/rest/v1/rpc/permitir_envio', ANON, { method: 'POST', body: JSON.stringify({ p_ip_hash: 'x', p_limite: 5 }) });
  assert.equal(r.ok, false);
});

test('visitante anônimo lê o texto de consentimento v1', { skip: pular }, async () => {
  const r = await chamar('/rest/v1/textos_consentimento?select=versao&versao=eq.v1', ANON);
  assert.equal(r.ok, true);
  assert.deepEqual(await r.json(), [{ versao: 'v1' }]);
});

test('servidor registra lead, repete o telefone como retorno e limpa', { skip: pular }, async () => {
  const p = { nome: 'Teste Automatico', telefone: '+5513900000001', consentimento_versao: 'v1' };
  const um = await (await chamar('/rest/v1/rpc/registrar_lead', SERVICO, { method: 'POST', body: JSON.stringify({ p }) })).json();
  assert.equal(um.novo, true);
  const dois = await (await chamar('/rest/v1/rpc/registrar_lead', SERVICO, { method: 'POST', body: JSON.stringify({ p }) })).json();
  assert.equal(dois.novo, false);
  assert.equal(dois.id, um.id);
  const lead = (await (await chamar('/rest/v1/leads?select=retornos&id=eq.' + um.id, SERVICO)).json())[0];
  assert.equal(lead.retornos, 1);
  const del = await chamar('/rest/v1/leads?id=eq.' + um.id, SERVICO, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
  assert.equal(del.ok, true);
});
```

- [ ] **Passo 6: rodar o teste de acesso.** O usuário define as três variáveis no próprio terminal (PowerShell: `$env:TESTE_SUPABASE_URL='...'` etc.) e roda `node --test tests/rls.test.mjs`. Esperado: 6 testes passam. Sem as variáveis: 6 testes "skipped".
- [ ] **Passo 7: teste manual de usuário sem permissão.** No painel do Supabase, criar um **segundo** usuário (Authentication → Users) que **não** esteja em `usuarios_painel`. Quando o painel existir (Tarefa 6), confirmar que esse usuário entra e vê a mensagem "Esta conta não tem acesso ao painel". Anotar no resumo que isso fica para a Tarefa 6.
- [ ] **Passo 8: commit.**

```bash
git add supabase/migrations/0001_leads.sql tests/rls.test.mjs
git commit -m "Banco do painel de leads: tabelas, regras de acesso e funcoes"
```

---

### Tarefa 2: validação, telefone e anti-robô (funções puras)

**Arquivos:**
- Criar: `site/api/_lib/validacao.js`, `site/api/_lib/ip.js`
- Criar: `tests/validacao.test.mjs`

**Interfaces:**
- Produz: `normalizarTelefone(entrada: any) → string | null` (formato `+55DDDNÚMERO`);
  `validarLead(corpo, { slugsValidos: string[], versaoConsentimento: string }) → { ok: true, dados } | { ok: false, erros: Record<string,string> }`;
  `ehRobo(corpo) → boolean`;
  `hashIp(ip: string, sal: string) → string` (hex sha-256); `ipDaRequisicao(req) → string`.
- `dados` contém: `nome, telefone, email, mensagem, empreendimento_slug, origem_fonte, origem_meio, origem_campanha, pagina_origem, referrer, consentimento_versao` (opcionais viram `null`).

- [ ] **Passo 1: escrever o teste que falha.**

`tests/validacao.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarTelefone, validarLead, ehRobo, motivoRobo } from '../site/api/_lib/validacao.js';
import { hashIp, ipDaRequisicao } from '../site/api/_lib/ip.js';

test('normalizarTelefone aceita celular com e sem formatação e com +55', () => {
  assert.equal(normalizarTelefone('(13) 99777-0974'), '+5513997770974');
  assert.equal(normalizarTelefone('13997770974'), '+5513997770974');
  assert.equal(normalizarTelefone('+55 13 99777-0974'), '+5513997770974');
  assert.equal(normalizarTelefone('5513997770974'), '+5513997770974');
});

test('normalizarTelefone aceita fixo e DDD 55', () => {
  assert.equal(normalizarTelefone('(13) 3222-1000'), '+551332221000');
  assert.equal(normalizarTelefone('55 99777-0974'), '+5555997770974');
});

test('normalizarTelefone rejeita valores inválidos', () => {
  for (const v of ['', 'abc', '1234', '(13) 89777-0974', '(03) 99777-0974', '999999999', null, undefined]) {
    assert.equal(normalizarTelefone(v), null, String(v));
  }
});

const ctx = { slugsValidos: ['garrett', 'carmo'], versaoConsentimento: 'v1' };
const base = () => ({
  nome: '  Maria   Souza ',
  telefone: '(13) 99777-0974',
  email: 'maria@exemplo.com',
  mensagem: 'Quero saber o valor.',
  empreendimento_slug: 'carmo',
  consentimento: true,
  consentimento_versao: 'v1',
  origem_fonte: 'instagram',
  pagina_origem: '/imovel/carmo',
});

test('validarLead aceita um lead completo e limpa os campos', () => {
  const r = validarLead(base(), ctx);
  assert.equal(r.ok, true);
  assert.equal(r.dados.nome, 'Maria Souza');
  assert.equal(r.dados.telefone, '+5513997770974');
  assert.equal(r.dados.empreendimento_slug, 'carmo');
  assert.equal(r.dados.origem_meio, null);
});

test('validarLead aceita só os campos obrigatórios', () => {
  const r = validarLead({ nome: 'Ana', telefone: '13997770974', consentimento: true, consentimento_versao: 'v1' }, ctx);
  assert.equal(r.ok, true);
  assert.equal(r.dados.email, null);
  assert.equal(r.dados.mensagem, null);
  assert.equal(r.dados.empreendimento_slug, null);
});

test('validarLead exige consentimento e a versão vigente', () => {
  assert.equal(validarLead({ ...base(), consentimento: false }, ctx).erros.consentimento, 'É preciso aceitar para enviar.');
  assert.match(validarLead({ ...base(), consentimento_versao: 'v0' }, ctx).erros.consentimento, /mudou/);
});

test('validarLead aponta cada campo inválido', () => {
  const r = validarLead({ nome: 'A', telefone: '12', email: 'sem-arroba', mensagem: 'x'.repeat(1001), empreendimento_slug: 'outro', consentimento: true, consentimento_versao: 'v1' }, ctx);
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.erros).sort(), ['email', 'empreendimento_slug', 'mensagem', 'nome', 'telefone']);
});

test('validarLead não quebra com corpo vazio ou inválido', () => {
  assert.equal(validarLead(null, ctx).ok, false);
  assert.equal(validarLead('texto', ctx).ok, false);
});

test('ehRobo detecta campo-isca e preenchimento rápido demais', () => {
  assert.equal(ehRobo({ website: 'http://spam', tempo_ms: 9000 }), true);
  assert.equal(ehRobo({ website: '', tempo_ms: 500 }), true);
  assert.equal(ehRobo({ website: '', tempo_ms: 'abc' }), true);
  assert.equal(ehRobo({ website: '', tempo_ms: 8000 }), false);
  assert.equal(ehRobo(null), true);
});

test('motivoRobo separa o campo-isca do envio rápido demais', () => {
  assert.equal(motivoRobo({ website: 'http://spam', tempo_ms: 9000 }), 'isca');
  assert.equal(motivoRobo({ website: 'http://spam', tempo_ms: 100 }), 'isca');
  assert.equal(motivoRobo({ website: '', tempo_ms: 500 }), 'rapido');
  assert.equal(motivoRobo({ website: '', tempo_ms: 'abc' }), 'rapido');
  assert.equal(motivoRobo({ website: '', tempo_ms: 8000 }), null);
});

test('hashIp é estável, depende do sal e não contém o IP', () => {
  const a = hashIp('200.1.2.3', 'sal1');
  assert.equal(a, hashIp('200.1.2.3', 'sal1'));
  assert.notEqual(a, hashIp('200.1.2.3', 'sal2'));
  assert.equal(a.includes('200.1.2.3'), false);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test('ipDaRequisicao usa o primeiro IP de x-forwarded-for', () => {
  assert.equal(ipDaRequisicao({ headers: { 'x-forwarded-for': '200.1.2.3, 10.0.0.1' } }), '200.1.2.3');
  assert.equal(ipDaRequisicao({ headers: {}, socket: { remoteAddress: '127.0.0.1' } }), '127.0.0.1');
  assert.equal(ipDaRequisicao({ headers: {} }), 'desconhecido');
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/validacao.test.mjs`. Esperado: falha com `ERR_MODULE_NOT_FOUND` (os módulos ainda não existem).
- [ ] **Passo 3: criar `site/api/_lib/validacao.js`.**

```js
// Validação do lead e detecção de robô. Funções puras, sem rede, fáceis de testar.

export function normalizarTelefone(entrada) {
  let d = String(entrada ?? '').replace(/\D/g, '');
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  if (Number(d.slice(0, 2)) < 11) return null;
  if (d.length === 11 && d[2] !== '9') return null;
  if (d.length === 10 && !/[2-9]/.test(d[2])) return null;
  return '+55' + d;
}

const texto = (v) => String(v ?? '').trim();
const limitar = (v, max) => {
  const t = texto(v);
  return t ? t.slice(0, max) : null;
};

export function validarLead(corpo, { slugsValidos, versaoConsentimento }) {
  const c = corpo && typeof corpo === 'object' ? corpo : {};
  const erros = {};

  const nome = texto(c.nome).replace(/\s+/g, ' ');
  if (nome.length < 2 || nome.length > 120) erros.nome = 'Informe seu nome.';

  const telefone = normalizarTelefone(c.telefone);
  if (!telefone) erros.telefone = 'Informe um WhatsApp válido, com DDD.';

  const email = texto(c.email);
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) {
    erros.email = 'E-mail inválido.';
  }

  const mensagem = texto(c.mensagem);
  if (mensagem.length > 1000) erros.mensagem = 'Mensagem muito longa (máximo 1000 caracteres).';

  const slug = texto(c.empreendimento_slug);
  if (slug && !slugsValidos.includes(slug)) erros.empreendimento_slug = 'Empreendimento inválido.';

  if (c.consentimento !== true) {
    erros.consentimento = 'É preciso aceitar para enviar.';
  } else if (texto(c.consentimento_versao) !== versaoConsentimento) {
    erros.consentimento = 'O texto de consentimento mudou. Recarregue a página.';
  }

  if (Object.keys(erros).length) return { ok: false, erros };

  return {
    ok: true,
    dados: {
      nome,
      telefone,
      email: email || null,
      mensagem: mensagem || null,
      empreendimento_slug: slug || null,
      origem_fonte: limitar(c.origem_fonte, 100),
      origem_meio: limitar(c.origem_meio, 100),
      origem_campanha: limitar(c.origem_campanha, 150),
      pagina_origem: limitar(c.pagina_origem, 300),
      referrer: limitar(c.referrer, 300),
      consentimento_versao: versaoConsentimento,
    },
  };
}

// 'isca': o campo-isca (invisível) veio preenchido, só um robô faz isso.
// 'rapido': enviado em menos de 3 segundos. Pode ser robô, mas também uma pessoa com
// preenchimento automático; por isso o servidor não finge sucesso nesse caso.
export function motivoRobo(corpo) {
  const c = corpo && typeof corpo === 'object' ? corpo : {};
  if (texto(c.website) !== '') return 'isca';
  const t = Number(c.tempo_ms);
  if (!Number.isFinite(t) || t < 3000) return 'rapido';
  return null;
}

export const ehRobo = (corpo) => motivoRobo(corpo) !== null;
```

- [ ] **Passo 4: criar `site/api/_lib/ip.js`.**

```js
import { createHash } from 'node:crypto';

// O IP nunca é guardado em texto: só este hash, com um sal secreto (IP_HASH_SALT).
export function hashIp(ip, sal) {
  return createHash('sha256').update(String(sal) + '|' + String(ip)).digest('hex');
}

export function ipDaRequisicao(req) {
  const xf = req.headers['x-forwarded-for'];
  const bruto = Array.isArray(xf) ? xf[0] : String(xf ?? '');
  const primeiro = bruto.split(',')[0].trim();
  return primeiro || req.socket?.remoteAddress || 'desconhecido';
}
```

- [ ] **Passo 5: rodar e ver passar.** `node --test tests/validacao.test.mjs`. Esperado: todos os testes passam (0 falhas).
- [ ] **Passo 6: commit.**

```bash
git add site/api/_lib/validacao.js site/api/_lib/ip.js tests/validacao.test.mjs
git commit -m "Validacao do lead, telefone brasileiro e anti-robo"
```

---

### Tarefa 3: acesso ao Supabase e e-mail no servidor

**Arquivos:**
- Criar: `site/api/_lib/supabase.js`, `site/api/_lib/email.js`, `site/api/_lib/proprio.js`
- Criar: `tests/email.test.mjs`, `tests/supabase.test.mjs`

**Interfaces:**
- Consome: nada das tarefas anteriores.
- Produz: `cabecalhos(chave: string, extras?: object) → object` (cabeçalhos da chamada ao Supabase); `rpc(nome: string, args: object) → Promise<any>`; `marcarAviso(id: string, ok: boolean) → Promise<null>`; `montarEmail(lead, { retorno: boolean, nomesEmpreendimentos: Record<string,string> }) → { assunto, html, texto }`; `enviarEmail({ assunto, html, texto }) → Promise<void>`; `lerJsonProprio(req, caminho: string) → Promise<any>`.

- [ ] **Passo 1: escrever o teste do e-mail (falha).**

`tests/email.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { montarEmail } from '../site/api/_lib/email.js';

const lead = {
  nome: 'Maria <b>Souza</b>',
  telefone: '+5513997770974',
  email: 'maria@exemplo.com',
  mensagem: '<script>alert(1)</script> Quero saber o valor.',
  empreendimento_slug: 'carmo',
  origem_fonte: 'instagram',
  origem_meio: 'social',
  origem_campanha: 'lancamento-carmo',
};
const nomes = { carmo: 'Residencial Carmo' };

test('montarEmail escapa HTML vindo do visitante', () => {
  const { html } = montarEmail(lead, { retorno: false, nomesEmpreendimentos: nomes });
  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('<b>Souza</b>'), false);
  assert.match(html, /&lt;script&gt;/);
});

test('montarEmail tem assunto de lead novo e de retorno', () => {
  assert.equal(montarEmail(lead, { retorno: false, nomesEmpreendimentos: nomes }).assunto.startsWith('Novo lead: '), true);
  assert.equal(montarEmail(lead, { retorno: true, nomesEmpreendimentos: nomes }).assunto.startsWith('Lead voltou: '), true);
});

test('montarEmail inclui imóvel, origem e link do WhatsApp só com dígitos', () => {
  const { html, texto } = montarEmail(lead, { retorno: false, nomesEmpreendimentos: nomes });
  assert.match(texto, /Residencial Carmo/);
  assert.match(texto, /instagram \/ social \/ lancamento-carmo/);
  assert.match(html, /https:\/\/wa\.me\/5513997770974\?text=/);
});

test('montarEmail lida com campos vazios', () => {
  const { texto } = montarEmail({ ...lead, email: null, mensagem: null, empreendimento_slug: null, origem_fonte: null, origem_meio: null, origem_campanha: null }, { retorno: false, nomesEmpreendimentos: nomes });
  assert.match(texto, /Não informado/);
  assert.match(texto, /Direto ou não identificada/);
});
```

- [ ] **Passo 1b: teste dos cabeçalhos do Supabase (falha).** O Supabase tem chaves antigas (JWT, começam com `eyJ`) e novas (`sb_secret_...`, que não são JWT). O código precisa aceitar as duas.

`tests/supabase.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { cabecalhos, urlBase } from '../site/api/_lib/supabase.js';

test('chave antiga (JWT) vai em apikey e em Authorization', () => {
  const h = cabecalhos('eyJabc.def.ghi');
  assert.equal(h.apikey, 'eyJabc.def.ghi');
  assert.equal(h.Authorization, 'Bearer eyJabc.def.ghi');
});

test('chave nova (sb_secret_) vai só em apikey', () => {
  const h = cabecalhos('sb_secret_abc123', { Prefer: 'return=minimal' });
  assert.equal(h.apikey, 'sb_secret_abc123');
  assert.equal(h.Authorization, undefined);
  assert.equal(h.Prefer, 'return=minimal');
});

test('erro do Supabase mostra status, rota, código e mensagem, mas nunca os detalhes', async () => {
  process.env.SUPABASE_URL = 'https://proj.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    text: async () => JSON.stringify({ code: 'PGRST202', message: 'Could not find the function', details: 'Key (telefone)=(+5513900000000) already exists' }),
  });
  const { rpc } = await import('../site/api/_lib/supabase.js');
  await assert.rejects(() => rpc('permitir_envio', {}), (e) => {
    assert.match(e.message, /404/);
    assert.match(e.message, /permitir_envio/);
    assert.match(e.message, /PGRST202/);
    assert.match(e.message, /Could not find the function/);
    assert.equal(e.message.includes('+5513900000000'), false);
    return true;
  });
});

test('urlBase aceita o endereço com barra final ou com /rest/v1', () => {
  const certo = 'https://abc.supabase.co';
  assert.equal(urlBase('https://abc.supabase.co'), certo);
  assert.equal(urlBase('https://abc.supabase.co/'), certo);
  assert.equal(urlBase('https://abc.supabase.co/rest/v1'), certo);
  assert.equal(urlBase('https://abc.supabase.co/rest/v1/'), certo);
  assert.equal(urlBase('  https://abc.supabase.co/rest/v1/  '), certo);
  assert.equal(urlBase(''), '');
  assert.equal(urlBase(undefined), '');
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/email.test.mjs tests/supabase.test.mjs`. Esperado: `ERR_MODULE_NOT_FOUND`.
- [ ] **Passo 3: criar `site/api/_lib/email.js`.**

```js
// E-mail de aviso de lead novo, enviado pelo Resend (https://resend.com).

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function montarEmail(lead, { retorno = false, nomesEmpreendimentos = {} }) {
  const imovel = nomesEmpreendimentos[lead.empreendimento_slug] || 'Não informado';
  const origem =
    [lead.origem_fonte, lead.origem_meio, lead.origem_campanha].filter(Boolean).join(' / ') ||
    'Direto ou não identificada';
  const primeiroNome = String(lead.nome).split(' ')[0];
  const zap =
    'https://wa.me/' +
    String(lead.telefone).replace(/\D/g, '') +
    '?text=' +
    encodeURIComponent('Olá, ' + primeiroNome + '! Aqui é da Chiado Construtora. Recebemos o seu interesse. Posso ajudar?');

  const assunto = (retorno ? 'Lead voltou: ' : 'Novo lead: ') + lead.nome + ' — ' + imovel;
  const linhas = [
    ['Nome', lead.nome],
    ['WhatsApp', lead.telefone],
    ['E-mail', lead.email || '—'],
    ['Interesse', imovel],
    ['Origem', origem],
    ['Mensagem', lead.mensagem || '—'],
  ];

  const texto =
    (retorno ? 'Este lead voltou a preencher o formulário.\n\n' : '') +
    linhas.map(([k, v]) => k + ': ' + v).join('\n') +
    '\n\nChamar no WhatsApp: ' + zap + '\n';

  const html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1B2118">' +
    (retorno ? '<p><strong>Este lead voltou a preencher o formulário.</strong></p>' : '') +
    '<table style="border-collapse:collapse">' +
    linhas
      .map(
        ([k, v]) =>
          '<tr><td style="padding:4px 12px 4px 0;color:#555">' + esc(k) + '</td><td style="padding:4px 0">' + esc(v) + '</td></tr>'
      )
      .join('') +
    '</table>' +
    '<p><a href="' + esc(zap) + '" style="display:inline-block;background:#1F4029;color:#fff;padding:10px 18px;border-radius:4px;text-decoration:none">Chamar no WhatsApp</a></p>' +
    '</div>';

  return { assunto, html, texto };
}

export async function enviarEmail({ assunto, html, texto }) {
  const chave = process.env.RESEND_API_KEY;
  const para = (process.env.LEAD_NOTIFY_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const de = process.env.LEAD_FROM_EMAIL;
  if (!chave || !para.length || !de) throw new Error('E-mail não configurado');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + chave, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: de, to: para, subject: assunto, html, text: texto }),
  });
  if (!r.ok) throw new Error('Resend respondeu ' + r.status);
}
```

- [ ] **Passo 4: criar `site/api/_lib/supabase.js`.**

```js
// Acesso ao Supabase com a chave de serviço. Só roda no servidor (api/*).
// A chave nunca sai daqui: vem de variável de ambiente da Vercel.

// Aceita o endereço do projeto com ou sem barra final e mesmo se vier com /rest/v1
// (a tela "Data API" do Supabase mostra a URL assim, e isso quebrava com PGRST125).
export function urlBase(valor) {
  return String(valor || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '').replace(/\/+$/, '');
}

function config() {
  const url = urlBase(process.env.SUPABASE_URL);
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !chave) throw new Error('Supabase não configurado');
  return { url, chave };
}

// Chaves novas do Supabase (sb_secret_...) não são JWT e vão só no cabeçalho apikey.
// Chaves antigas (service_role, JWT que começa com "eyJ") também vão em Authorization.
export function cabecalhos(chave, extras = {}) {
  const h = { apikey: chave, 'Content-Type': 'application/json', ...extras };
  if (chave.startsWith('eyJ')) h.Authorization = 'Bearer ' + chave;
  return h;
}

async function chamar(caminho, opcoes = {}) {
  const { url, chave } = config();
  const resp = await fetch(url + caminho, {
    ...opcoes,
    headers: cabecalhos(chave, opcoes.headers),
  });
  const bruto = await resp.text();
  if (!resp.ok) {
    // Só status, rota, código e mensagem. Nunca "details"/"hint": podem trazer dados da pessoa.
    let extra = '';
    try {
      const c = JSON.parse(bruto);
      if (c && c.code) extra = ' [' + c.code + '] ' + String(c.message || '').slice(0, 160);
    } catch {}
    throw new Error('Supabase ' + resp.status + ' em ' + caminho.split('?')[0] + extra);
  }
  return bruto ? JSON.parse(bruto) : null;
}

export const rpc = (nome, args) =>
  chamar('/rest/v1/rpc/' + nome, { method: 'POST', body: JSON.stringify(args) });

export const marcarAviso = (id, ok) =>
  chamar('/rest/v1/leads?id=eq.' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ aviso_email_ok: ok }),
  });
```

- [ ] **Passo 5: criar `site/api/_lib/proprio.js`.**

```js
// Lê arquivos do próprio site pela web (mesmo jeito de api/imovel.js).
// Ler do disco não funciona nas funções da Vercel.
export async function lerJsonProprio(req, caminho) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const r = await fetch(proto + '://' + req.headers.host + caminho);
  if (!r.ok) throw new Error(caminho + ' respondeu ' + r.status);
  return r.json();
}
```

- [ ] **Passo 6: rodar e ver passar.** `node --test tests/email.test.mjs tests/supabase.test.mjs`. Esperado: 6 testes passam.
- [ ] **Passo 7: commit.**

```bash
git add site/api/_lib/supabase.js site/api/_lib/email.js site/api/_lib/proprio.js tests/email.test.mjs tests/supabase.test.mjs
git commit -m "Acesso ao Supabase e e-mail de aviso no servidor"
```

---

### Tarefa 4: função `POST /api/lead`

**Arquivos:**
- Criar: `site/api/lead.js`, `site/data/consentimento.json`
- Criar: `tests/lead-handler.test.mjs`, `tests/consentimento.test.mjs`

**Interfaces:**
- Consome (Tarefas 2 e 3): `validarLead`, `ehRobo`, `hashIp`, `ipDaRequisicao`, `rpc`, `marcarAviso`, `montarEmail`, `enviarEmail`, `lerJsonProprio`.
- Corpo esperado do `POST`: `{ nome, telefone, email?, mensagem?, empreendimento_slug?, consentimento: true, consentimento_versao, website, tempo_ms, origem_fonte?, origem_meio?, origem_campanha?, pagina_origem? , referrer? }`.
- Respostas: `200 { ok: true }` (sucesso, robô e limite excedido, sem diferença visível); `400 { ok: false, erros }`; `403` (outra origem); `405` (método); `500 { ok: false }`.

- [ ] **Passo 1: criar `site/data/consentimento.json`.** O texto tem de ser **igual** ao de `v1` na migração.

```json
{
  "versao": "v1",
  "texto": "Concordo em receber contato da Chiado Construtora e Incorporadora (CNPJ 57.026.203/0001-74) por WhatsApp, telefone ou e-mail sobre os empreendimentos. Meus dados serão usados só para esse fim, conforme a Política de Privacidade."
}
```

- [ ] **Passo 2: teste que garante o texto igual nos dois lugares.**

`tests/consentimento.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('o texto de consentimento do site é igual ao do banco (v1)', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0001_leads.sql', import.meta.url), 'utf8');
  const noBanco = sql.match(/\('v1', '([^']*)'\)/)?.[1];
  const json = JSON.parse(readFileSync(new URL('../site/data/consentimento.json', import.meta.url), 'utf8'));
  assert.equal(json.versao, 'v1');
  assert.equal(json.texto, noBanco);
});
```

Rodar: `node --test tests/consentimento.test.mjs`. Esperado: passa.

- [ ] **Passo 3: escrever o teste da função (falha).**

`tests/lead-handler.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL = 'https://proj.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-teste';
process.env.RESEND_API_KEY = 're_teste';
process.env.LEAD_NOTIFY_EMAILS = 'a@exemplo.com, b@exemplo.com';
process.env.LEAD_FROM_EMAIL = 'Chiado <leads@exemplo.com>';
process.env.IP_HASH_SALT = 'sal-de-teste';

const { default: handler } = await import('../site/api/lead.js');

function criarRes() {
  const r = {
    statusCode: 200, headers: {}, corpo: undefined,
    setHeader(k, v) { r.headers[k.toLowerCase()] = v; },
    status(c) { r.statusCode = c; return r; },
    json(o) { r.corpo = o; return r; },
    send(o) { r.corpo = o; return r; },
  };
  return r;
}

function instalarFetch(rotas) {
  const chamadas = [];
  globalThis.fetch = async (url, opcoes = {}) => {
    chamadas.push({ url: String(url), opcoes });
    for (const [padrao, resp] of rotas) {
      if (String(url).includes(padrao)) {
        const v = typeof resp === 'function' ? resp(opcoes) : resp;
        return {
          ok: v.ok !== false, status: v.status || 200,
          json: async () => v.corpo, text: async () => (v.corpo == null ? '' : JSON.stringify(v.corpo)),
        };
      }
    }
    throw new Error('fetch inesperado: ' + url);
  };
  return chamadas;
}

const rotasBase = () => [
  ['/data/empreendimentos.json', { corpo: { items: [{ slug: 'carmo', nome: 'Residencial Carmo' }] } }],
  ['/data/consentimento.json', { corpo: { versao: 'v1', texto: 'texto' } }],
  ['/rpc/permitir_envio', { corpo: true }],
  ['/rpc/registrar_lead', { corpo: { id: 'abc', novo: true } }],
  ['api.resend.com', { corpo: { id: 'x' } }],
  ['/rest/v1/leads?id=eq.abc', { status: 204, corpo: null }],
];

const corpoValido = () => ({
  nome: 'Maria Souza', telefone: '(13) 99777-0974', email: '', mensagem: 'Oi',
  empreendimento_slug: 'carmo', consentimento: true, consentimento_versao: 'v1',
  website: '', tempo_ms: 8000, origem_fonte: 'instagram', pagina_origem: '/imovel/carmo',
});

const req = (extra = {}) => ({
  method: 'POST',
  headers: { host: 'site.test', origin: 'https://site.test', 'x-forwarded-proto': 'https', 'x-forwarded-for': '200.1.2.3' },
  body: corpoValido(),
  ...extra,
});

const chamadasAoBanco = (c) => c.filter((x) => x.url.includes('supabase.co'));

test('só aceita POST', async () => {
  instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req({ method: 'GET' }), res);
  assert.equal(res.statusCode, 405);
});

test('recusa requisição de outra origem', async () => {
  instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req({ headers: { host: 'site.test', origin: 'https://evil.com' } }), res);
  assert.equal(res.statusCode, 403);
});

test('robô (campo-isca) recebe sucesso e nada é gravado', async () => {
  const c = instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req({ body: { ...corpoValido(), website: 'http://spam' } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(chamadasAoBanco(c).length, 0);
});

test('envio rápido demais devolve 400 sem gravar (pessoa com autopreenchimento pode tentar de novo)', async () => {
  const c = instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req({ body: { ...corpoValido(), tempo_ms: 500 } }), res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.corpo, { ok: false, erros: {} });
  assert.equal(chamadasAoBanco(c).length, 0);
});

test('dados inválidos devolvem 400 com os erros', async () => {
  instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req({ body: { ...corpoValido(), telefone: '12' } }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.corpo.ok, false);
  assert.ok(res.corpo.erros.telefone);
});

test('limite de envios excedido responde sucesso sem gravar', async () => {
  const rotas = rotasBase().map((r) => (r[0] === '/rpc/permitir_envio' ? [r[0], { corpo: false }] : r));
  const c = instalarFetch(rotas);
  const res = criarRes();
  await handler(req(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(c.some((x) => x.url.includes('registrar_lead')), false);
});

test('sucesso grava o lead e envia o e-mail', async () => {
  const c = instalarFetch(rotasBase());
  const res = criarRes();
  await handler(req(), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.corpo, { ok: true });
  const reg = c.find((x) => x.url.includes('registrar_lead'));
  const enviado = JSON.parse(reg.opcoes.body).p;
  assert.equal(enviado.telefone, '+5513997770974');
  assert.equal(enviado.empreendimento_slug, 'carmo');
  const email = c.find((x) => x.url.includes('api.resend.com'));
  assert.deepEqual(JSON.parse(email.opcoes.body).to, ['a@exemplo.com', 'b@exemplo.com']);
  assert.equal(c.some((x) => x.opcoes.method === 'PATCH'), false);
});

test('falha no e-mail marca o aviso como não enviado e ainda responde 200', async () => {
  const rotas = rotasBase().map((r) => (r[0] === 'api.resend.com' ? [r[0], { ok: false, status: 500, corpo: {} }] : r));
  const c = instalarFetch(rotas);
  const res = criarRes();
  await handler(req(), res);
  assert.equal(res.statusCode, 200);
  const patch = c.find((x) => x.opcoes.method === 'PATCH');
  assert.deepEqual(JSON.parse(patch.opcoes.body), { aviso_email_ok: false });
});

test('falha no banco devolve 500 sem detalhes', async () => {
  const rotas = rotasBase().map((r) => (r[0] === '/rpc/registrar_lead' ? [r[0], { ok: false, status: 500, corpo: {} }] : r));
  instalarFetch(rotas);
  const res = criarRes();
  await handler(req(), res);
  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.corpo, { ok: false });
});
```

- [ ] **Passo 4: rodar e ver falhar.** `node --test tests/lead-handler.test.mjs`. Esperado: falha com `ERR_MODULE_NOT_FOUND` para `site/api/lead.js`.
- [ ] **Passo 5: criar `site/api/lead.js`.**

```js
// Recebe o formulário de interesse: valida, barra robôs, grava o lead e avisa por e-mail.
import { validarLead, motivoRobo } from './_lib/validacao.js';
import { hashIp, ipDaRequisicao } from './_lib/ip.js';
import { rpc, marcarAviso } from './_lib/supabase.js';
import { montarEmail, enviarEmail } from './_lib/email.js';
import { lerJsonProprio } from './_lib/proprio.js';

const LIMITE_POR_HORA = 5;

function lerCorpo(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try {
    return JSON.parse(String(req.body ?? ''));
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  // Só aceita envio vindo do próprio site.
  const origem = req.headers.origin;
  if (origem) {
    let host = '';
    try {
      host = new URL(origem).host;
    } catch {
      host = '';
    }
    if (host !== req.headers.host) return res.status(403).json({ ok: false });
  }

  const corpo = lerCorpo(req);

  const motivo = motivoRobo(corpo);
  // Campo-isca: só robô preenche. Responde como se tivesse dado certo, sem gravar nada.
  if (motivo === 'isca') return res.status(200).json({ ok: true });
  // Rápido demais pode ser uma pessoa com preenchimento automático: nada é gravado, mas
  // devolve erro para ela tentar de novo em instantes, sem perder o lead em silêncio.
  if (motivo === 'rapido') return res.status(400).json({ ok: false, erros: {} });

  let empreendimentos;
  let consentimento;
  try {
    empreendimentos = (await lerJsonProprio(req, '/data/empreendimentos.json')).items || [];
    consentimento = await lerJsonProprio(req, '/data/consentimento.json');
  } catch (e) {
    console.error('lead: não leu os JSONs do site:', e.message);
    return res.status(500).json({ ok: false });
  }

  const validacao = validarLead(corpo, {
    slugsValidos: empreendimentos.map((e) => e.slug),
    versaoConsentimento: consentimento.versao,
  });
  if (!validacao.ok) return res.status(400).json({ ok: false, erros: validacao.erros });

  let resultado;
  try {
    const ipHash = hashIp(ipDaRequisicao(req), process.env.IP_HASH_SALT || '');
    const permitido = await rpc('permitir_envio', { p_ip_hash: ipHash, p_limite: LIMITE_POR_HORA });
    if (permitido !== true) return res.status(200).json({ ok: true });

    resultado = await rpc('registrar_lead', { p: validacao.dados });
  } catch (e) {
    // e.message tem só o status e a rota, nunca dados do lead
    console.error('lead: falha ao gravar no banco:', e.message);
    return res.status(500).json({ ok: false });
  }

  // O lead já está salvo. Se o e-mail falhar, só marca o aviso como não enviado.
  try {
    const nomes = Object.fromEntries(empreendimentos.map((e) => [e.slug, e.nome]));
    await enviarEmail(montarEmail(validacao.dados, { retorno: resultado.novo === false, nomesEmpreendimentos: nomes }));
  } catch (e) {
    console.error('lead: aviso por e-mail não enviado:', e.message);
    await marcarAviso(resultado.id, false).catch(() => {});
  }

  return res.status(200).json({ ok: true });
}
```

- [ ] **Passo 6: rodar e ver passar.** `node --test tests/lead-handler.test.mjs`. Esperado: 8 testes passam.
- [ ] **Passo 7: rodar tudo.** `node --test`. Esperado: nenhum teste falha (os de `rls.test.mjs` aparecem como "skipped" sem as variáveis).
- [ ] **Passo 8: commit e envio da `trabalho`** (gera a prévia; não afeta o site no ar).

```bash
git add site/api/lead.js site/data/consentimento.json tests/lead-handler.test.mjs tests/consentimento.test.mjs
git commit -m "Funcao /api/lead: valida, grava o lead e avisa por e-mail"
git push origin trabalho
```

- [ ] **Passo 9: testar na prévia, com dado fictício.** Depois que a prévia ficar pronta, enviar um lead de teste direto à função (sem o formulário, que vem na Tarefa 5). `tempo_ms` precisa ser maior que 3000:

```bash
curl -s -i -X POST https://site-chaido-git-trabalho-chiado.vercel.app/api/lead -H "Content-Type: application/json" -d "{\"nome\":\"Teste Previa\",\"telefone\":\"(13) 90000-0002\",\"consentimento\":true,\"consentimento_versao\":\"v1\",\"website\":\"\",\"tempo_ms\":9000,\"empreendimento_slug\":\"carmo\"}"
```

Esperado: `HTTP 200` com `{"ok":true}`; o e-mail chega aos endereços de aviso; o lead aparece na tabela `leads` (Supabase → Table Editor). Repetir o mesmo comando: continua `200`, o lead **não** duplica e `retornos` passa a `1`. Se der `500`, ver os logs da função (`get_runtime_logs`). **Se o erro for do `import` de `_lib` na Vercel** (módulo não encontrado), juntar os módulos de `_lib` dentro de `lead.js` e repetir o teste (os testes automáticos de `_lib` continuam valendo para as funções puras copiadas).

---

### Tarefa 5: formulário de interesse no site

**Arquivos:**
- Criar: `site/assets/utm.js`, `site/assets/lead-form.js`
- Modificar: `site/index.html`, `site/imovel.html`, `site/assets/render.js`, `site/assets/style.css`

**Interfaces:**
- Consome (Tarefa 4): `POST /api/lead` e `site/data/consentimento.json`.
- Produz: `window.initLeadForm(items)`, que monta o formulário em `#lead-form-root` (atributo `data-empreendimento="<slug>"` pré-seleciona o imóvel); `sessionStorage['chiado_origem']` com `{ fonte, meio, campanha, referrer, entrada }`.

- [ ] **Passo 1: criar `site/assets/utm.js`.**

```js
// Guarda de onde o visitante veio (primeira visita da sessão), para ir junto com o lead.
(function () {
  try {
    if (sessionStorage.getItem('chiado_origem')) return;
    var p = new URLSearchParams(location.search);
    var ref = '';
    if (document.referrer) {
      try {
        if (new URL(document.referrer).host !== location.host) ref = document.referrer;
      } catch (e) {}
    }
    sessionStorage.setItem(
      'chiado_origem',
      JSON.stringify({
        fonte: p.get('utm_source') || '',
        meio: p.get('utm_medium') || '',
        campanha: p.get('utm_campaign') || '',
        referrer: ref,
        entrada: location.pathname,
      })
    );
  } catch (e) {}
})();
```

- [ ] **Passo 2: criar `site/assets/lead-form.js`.**

```js
// Formulário de interesse. O visitante preenche, o servidor (/api/lead) valida e grava.
(function () {
  var WHATSAPP = '5513997770974';

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  // O link da política é a própria frase "Política de Privacidade" do texto (sem repetir).
  function textoConsentimento(texto) {
    var link = '<a href="privacidade" target="_blank" rel="noopener">Política de Privacidade</a>';
    var seguro = esc(texto);
    return seguro.indexOf('Política de Privacidade') >= 0
      ? seguro.replace('Política de Privacidade', link)
      : seguro + ' ' + link;
  }

  function mascara(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    var corte = d.length > 10 ? 7 : 6;
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, corte) + '-' + d.slice(corte);
  }

  function linkWhatsapp(msg) {
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
  }

  function origemDaSessao() {
    try {
      return JSON.parse(sessionStorage.getItem('chiado_origem') || '{}');
    } catch (e) {
      return {};
    }
  }

  window.initLeadForm = function (items) {
    var raiz = document.getElementById('lead-form-root');
    if (!raiz || raiz.dataset.pronto) return;
    raiz.dataset.pronto = '1';
    items = items || [];

    var slugInicial = raiz.getAttribute('data-empreendimento') || '';
    var inicio = Date.now();

    fetch('data/consentimento.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('consentimento');
        return r.json();
      })
      .then(montar)
      .catch(function () {
        raiz.innerHTML =
          '<div class="lead-card"><h2>Quero saber mais</h2><p>Não conseguimos carregar o formulário agora. Fale com a gente pelo WhatsApp.</p>' +
          '<a class="btn btn-dark" target="_blank" rel="noopener" href="' + esc(linkWhatsapp('Olá, vim pelo site e quero saber mais sobre os empreendimentos da Chiado.')) + '">Chamar no WhatsApp</a></div>';
      });

    function montar(cons) {
      var opcoes = ['<option value="">Ainda não sei</option>']
        .concat(items.map(function (i) {
          return '<option value="' + esc(i.slug) + '"' + (i.slug === slugInicial ? ' selected' : '') + '>' + esc(i.nome) + '</option>';
        }))
        .join('');

      raiz.innerHTML =
        '<div class="lead-card">' +
        '<h2>Quero saber mais</h2>' +
        '<p class="lead-sub">Deixe seu contato e a equipe da Chiado fala com você pelo WhatsApp.</p>' +
        '<form id="lead-form" novalidate>' +
        '<label for="lf-emp">Empreendimento de interesse</label><select id="lf-emp" name="empreendimento_slug">' + opcoes + '</select>' +
        '<label for="lf-nome">Nome *</label><input id="lf-nome" name="nome" type="text" autocomplete="name" required maxlength="120" aria-describedby="lf-nome-erro"><p class="lead-erro" id="lf-nome-erro"></p>' +
        '<label for="lf-tel">WhatsApp *</label><input id="lf-tel" name="telefone" type="tel" inputmode="tel" autocomplete="tel" required placeholder="(13) 99999-9999" aria-describedby="lf-telefone-erro"><p class="lead-erro" id="lf-telefone-erro"></p>' +
        '<label for="lf-email">E-mail</label><input id="lf-email" name="email" type="email" autocomplete="email" maxlength="254" aria-describedby="lf-email-erro"><p class="lead-erro" id="lf-email-erro"></p>' +
        '<label for="lf-msg">Mensagem</label><textarea id="lf-msg" name="mensagem" rows="3" maxlength="1000" aria-describedby="lf-mensagem-erro"></textarea><p class="lead-erro" id="lf-mensagem-erro"></p>' +
        '<div class="lead-isca" aria-hidden="true"><label for="lf-site">Não preencha este campo</label><input id="lf-site" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
        '<div class="lead-consent"><input id="lf-consent" name="consentimento" type="checkbox" aria-describedby="lf-consentimento-erro"><label for="lf-consent">' + textoConsentimento(cons.texto) + '</label></div><p class="lead-erro" id="lf-consentimento-erro"></p>' +
        '<button class="btn btn-dark" type="submit" id="lf-enviar">Enviar</button>' +
        '<div class="lead-status" id="lf-status" role="status" aria-live="polite"></div>' +
        '</form></div>';

      var form = document.getElementById('lead-form');
      var tel = document.getElementById('lf-tel');
      var status = document.getElementById('lf-status');
      var botao = document.getElementById('lf-enviar');

      tel.addEventListener('input', function () {
        tel.value = mascara(tel.value);
      });

      function limparErros() {
        form.querySelectorAll('.lead-erro').forEach(function (p) { p.textContent = ''; });
        form.querySelectorAll('[aria-invalid]').forEach(function (c) { c.removeAttribute('aria-invalid'); });
      }

      function mostrarErros(erros) {
        var primeiro = null;
        Object.keys(erros).forEach(function (campo) {
          var p = document.getElementById('lf-' + campo + '-erro');
          var el = form.elements[campo];
          if (p) p.textContent = erros[campo];
          if (el) {
            el.setAttribute('aria-invalid', 'true');
            if (!primeiro) primeiro = el;
          }
        });
        if (primeiro) primeiro.focus();
      }

      function falhaEnvio() {
        status.innerHTML =
          '<p class="lead-erro-geral">Não conseguimos enviar agora. Seus dados continuam no formulário. Tente de novo ou fale com a gente pelo WhatsApp.</p>' +
          '<a class="btn btn-outline-dark" target="_blank" rel="noopener" href="' + esc(linkWhatsapp('Olá, vim pelo site e quero saber mais sobre os empreendimentos da Chiado.')) + '">Chamar no WhatsApp</a>';
      }

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        limparErros();
        status.textContent = '';
        var o = origemDaSessao();
        var corpo = {
          nome: form.elements.nome.value,
          telefone: form.elements.telefone.value,
          email: form.elements.email.value,
          mensagem: form.elements.mensagem.value,
          empreendimento_slug: form.elements.empreendimento_slug.value,
          consentimento: form.elements.consentimento.checked,
          consentimento_versao: cons.versao,
          website: form.elements.website.value,
          tempo_ms: Date.now() - inicio,
          origem_fonte: o.fonte || '',
          origem_meio: o.meio || '',
          origem_campanha: o.campanha || '',
          referrer: o.referrer || '',
          pagina_origem: location.pathname,
        };

        botao.disabled = true;
        botao.textContent = 'Enviando…';

        fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
          .then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, corpo: j }; });
          })
          .then(function (res) {
            if (res.status === 200 && res.corpo.ok) {
              var nomeImovel = '';
              items.forEach(function (i) { if (i.slug === corpo.empreendimento_slug) nomeImovel = i.nome; });
              var msg = 'Olá, acabei de deixar meu contato no site' + (nomeImovel ? ' sobre o ' + nomeImovel : '') + '.';
              raiz.innerHTML =
                '<div class="lead-card"><h2>Recebemos seu contato</h2><p>A equipe da Chiado vai falar com você pelo WhatsApp. Se preferir, já pode chamar agora.</p>' +
                '<a class="btn btn-dark" target="_blank" rel="noopener" href="' + esc(linkWhatsapp(msg)) + '">Chamar no WhatsApp</a></div>';
              return;
            }
            if (res.status === 400 && res.corpo.erros && Object.keys(res.corpo.erros).length) {
              mostrarErros(res.corpo.erros);
            } else {
              falhaEnvio();
            }
            botao.disabled = false;
            botao.textContent = 'Enviar';
          })
          .catch(function () {
            falhaEnvio();
            botao.disabled = false;
            botao.textContent = 'Enviar';
          });
      });
    }
  };
})();
```

- [ ] **Passo 3: estilo do formulário.** Acrescentar ao **final** de `site/assets/style.css`:

```css

/* ---------- formulário de interesse ---------- */
.lead-section{ padding:20px 0 60px; }
.lead-card{
  background:var(--paper); border:1px solid var(--line); border-radius:8px;
  padding:32px 28px; max-width:620px; margin:0 auto;
}
.lead-card h2{ font-size:clamp(24px, 3.4vw, 32px); color:var(--green-900); }
.lead-sub{ margin:8px 0 18px; color:rgba(27,33,24,0.72); font-size:15px; }
.lead-card label{ display:block; font-size:13px; font-weight:600; color:var(--green-800); margin:14px 0 6px; }
.lead-card input[type=text], .lead-card input[type=tel], .lead-card input[type=email], .lead-card select, .lead-card textarea{
  width:100%; padding:12px 14px; font:inherit; font-size:15px; color:var(--ink);
  background:#fff; border:1px solid var(--line); border-radius:4px;
}
.lead-card [aria-invalid=true]{ border-color:#9B2C2C; }
.lead-erro{ min-height:0; margin:4px 0 0; font-size:12.5px; color:#9B2C2C; }
.lead-consent{ display:flex; gap:10px; align-items:flex-start; margin-top:16px; }
.lead-consent input{ margin-top:3px; flex-shrink:0; width:18px; height:18px; }
.lead-consent label{ margin:0; font-weight:400; font-size:13px; color:rgba(27,33,24,0.78); }
.lead-consent a{ text-decoration:underline; }
.lead-card .btn{ margin-top:18px; }
.lead-card .btn[disabled]{ opacity:0.6; cursor:default; }
.lead-status{ margin-top:12px; }
.lead-erro-geral{ color:#9B2C2C; font-size:14px; margin:0 0 10px; }
.lead-isca{ position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }
```

- [ ] **Passo 4: incluir os scripts e o ponto de montagem na home.** Em `site/index.html`: (a) antes da linha `<script src="assets/main.js"></script>` acrescentar `<script src="assets/utm.js"></script>`; (b) antes da linha `<script src="assets/render.js"></script>` acrescentar `<script src="assets/lead-form.js"></script>`; (c) logo antes de `<section id="contato" class="final-cta">` acrescentar:

```html
<section id="interesse" class="lead-section">
  <div class="wrap"><div id="lead-form-root" data-empreendimento=""></div></div>
</section>

```

- [ ] **Passo 5: incluir os scripts na página do imóvel.** Em `site/imovel.html`, as mesmas duas linhas de script do passo 4 (a) e (b). Não há seção fixa: o formulário é criado pelo `render.js`.
- [ ] **Passo 6: montar o formulário no `render.js`.** Abrir `site/assets/render.js` e ler o fim da função `renderDetail` e o `DOMContentLoaded` antes de editar. (a) No final do `root.innerHTML = ...` do imóvel, trocar o trecho

```js
          '<p class="side-note">' + esc(item.sidebar_nota) + '</p>' +
        '</div>' +
      '</div>';
```

por

```js
          '<p class="side-note">' + esc(item.sidebar_nota) + '</p>' +
        '</div>' +
      '</div>' +
      '<section id="interesse" class="lead-section"><div class="wrap"><div id="lead-form-root" data-empreendimento="' + esc(item.slug) + '"></div></div></section>';
```

(b) No final do bloco `.then(function(items){ ... })`, logo depois de `if(window.initLightbox) window.initLightbox();`, acrescentar `if(window.initLeadForm) window.initLeadForm(items);`.

- [ ] **Passo 7: testar localmente.** Subir um servidor estático simples na pasta `site/` (por exemplo `node -e "require('http').createServer((q,s)=>{const f=require('path').join(process.cwd(),q.url==='/'?'index.html':q.url.split('?')[0]);require('fs').readFile(f,(e,d)=>{if(e){s.statusCode=404;return s.end('404')}s.end(d)})}).listen(4173)"`, dentro de `site/`). No navegador, em `http://localhost:4173/` e `http://localhost:4173/imovel.html?slug=carmo`: o formulário aparece; o imóvel vem selecionado no Carmo; digitar o telefone aplica a máscara; enviar vazio mostra os erros e foca o primeiro campo. O envio de verdade só funciona na prévia (a função é da Vercel).
- [ ] **Passo 8: commit e envio da `trabalho`.**

```bash
git add site/assets/utm.js site/assets/lead-form.js site/assets/style.css site/assets/render.js site/index.html site/imovel.html
git commit -m "Formulario de interesse na home e nas paginas dos imoveis"
git push origin trabalho
```

- [ ] **Passo 9: testar na prévia, com dado fictício, no celular e no computador.** Abrir `https://site-chaido-git-trabalho-chiado.vercel.app/imovel/carmo?utm_source=teste&utm_campaign=plano`. Conferir: (1) campos e erros; (2) consentimento desmarcado impede o envio e mostra o erro; (3) um envio válido mostra "Recebemos seu contato" e o botão do WhatsApp; (4) o e-mail de aviso chega; (5) no Supabase, o lead tem `origem_fonte = teste`, `origem_campanha = plano`, `pagina_origem = /imovel/carmo` e `consentimento_versao = v1`; (6) enviar de novo com o mesmo telefone não duplica e soma 1 em `retornos`; (7) com a internet cortada, o envio mostra a mensagem de falha com o botão do WhatsApp e os dados continuam no formulário. **Mudança pública: só vai ao `main` depois da validação do usuário.**

---

### Tarefa 6: painel, base, login e lista de leads

**Arquivos:**
- Criar: `site/api/painel-config.js`, `site/painel/index.html`, `site/painel/painel.css`, `site/painel/js/format.js`, `site/painel/js/api.js`, `site/painel/js/ui.js`, `site/painel/js/tela-login.js`, `site/painel/js/tela-lista.js`, `site/painel/js/main.js`
- Criar: `tests/painel-format.test.mjs`
- Modificar: `site/vercel.json`, `site/robots.txt`

**Interfaces:**
- Consome: banco da Tarefa 1 (tabelas `leads`, `fases`, `motivos_perda`; função `eh_usuario_painel`).
- Produz (`format.js`, funções puras): `escapeHtml(s)`, `tempoRelativo(iso, agora?)`, `horasDesde(iso, agora?)`, `aguardandoContato(lead, agora?)`, `resumoNumeros(leads, agora?) → { novos, aguardando, visitas, vendidosNoMes }`, `filtrarLeads(leads, filtros)`, `valorOrigem(lead)`, `telefoneBonito(t)`, `linkWhatsapp(lead, nomeEmpreendimento)`, `linkTelefone(lead)`, `gerarCsv(leads, nomeFase, nomeEmp)`.
- Produz (`api.js`): `iniciar()`, `sessao()`, `entrar(email, senha)`, `sair()`, `ehUsuarioPainel()`, `listarLeads()`, `listarFases()`, `listarMotivos()`, `buscarLead(id)`, `listarEventos(leadId)`, `mudarFase(id, fase, motivo)`, `anotar(leadId, texto, autor)`, `buscarPessoa(termo)`, `apagarLead(id)`.
- Produz (`ui.js`): `app`, `estado`, `nomeFase(id)`, `nomeEmp(slug)`, `mensagemErro(e)`, `moldura(html)`, `baixar(nome, texto, tipo)`.

- [ ] **Passo 1: escrever o teste das funções puras (falha).**

`tests/painel-format.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml, tempoRelativo, horasDesde, aguardandoContato, resumoNumeros,
  filtrarLeads, valorOrigem, telefoneBonito, linkWhatsapp, linkTelefone, gerarCsv,
} from '../site/painel/js/format.js';

const AGORA = Date.parse('2026-10-03T15:00:00Z');
const antes = (min) => new Date(AGORA - min * 60000).toISOString();
const lead = (extra = {}) => ({
  id: '1', nome: 'Maria Souza', telefone: '+5513997770974', email: null, mensagem: null,
  empreendimento_slug: 'carmo', fase: 'novo', origem_fonte: 'instagram', origem_meio: null, origem_campanha: null,
  retornos: 0, criado_em: antes(30), ultimo_contato_em: null, vendido_em: null, ...extra,
});

test('escapeHtml neutraliza HTML', () => {
  assert.equal(escapeHtml('<img src=x onerror="a">&\''), '&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');
  assert.equal(escapeHtml(null), '');
});

test('tempoRelativo', () => {
  assert.equal(tempoRelativo(antes(0), AGORA), 'agora');
  assert.equal(tempoRelativo(antes(12), AGORA), 'há 12 min');
  assert.equal(tempoRelativo(antes(180), AGORA), 'há 3 h');
  assert.equal(tempoRelativo(antes(60 * 24), AGORA), 'há 1 dia');
  assert.equal(tempoRelativo(antes(60 * 24 * 5), AGORA), 'há 5 dias');
});

test('horasDesde', () => assert.equal(horasDesde(antes(26 * 60), AGORA), 26));

test('aguardandoContato: só lead novo, sem contato, com mais de 24 h', () => {
  assert.equal(aguardandoContato(lead({ criado_em: antes(26 * 60) }), AGORA), true);
  assert.equal(aguardandoContato(lead({ criado_em: antes(23 * 60) }), AGORA), false);
  assert.equal(aguardandoContato(lead({ criado_em: antes(26 * 60), ultimo_contato_em: antes(60) }), AGORA), false);
  assert.equal(aguardandoContato(lead({ criado_em: antes(26 * 60), fase: 'contatado' }), AGORA), false);
});

test('resumoNumeros', () => {
  const leads = [
    lead({ id: 'a' }),
    lead({ id: 'b', criado_em: antes(26 * 60) }),
    lead({ id: 'c', fase: 'visita_agendada' }),
    lead({ id: 'd', fase: 'vendido', vendido_em: '2026-10-01T12:00:00Z' }),
    lead({ id: 'e', fase: 'vendido', vendido_em: '2026-09-20T12:00:00Z' }),
  ];
  assert.deepEqual(resumoNumeros(leads, AGORA), { novos: 2, aguardando: 1, visitas: 1, vendidosNoMes: 1 });
});

test('filtrarLeads por fase, imóvel, origem e datas', () => {
  const leads = [
    lead({ id: 'a', criado_em: '2026-10-01T12:00:00Z' }),
    lead({ id: 'b', empreendimento_slug: 'garrett', fase: 'proposta', origem_fonte: 'google', criado_em: '2026-09-10T12:00:00Z' }),
  ];
  assert.deepEqual(filtrarLeads(leads, { fase: 'proposta' }).map((l) => l.id), ['b']);
  assert.deepEqual(filtrarLeads(leads, { slug: 'carmo' }).map((l) => l.id), ['a']);
  assert.deepEqual(filtrarLeads(leads, { fonte: 'google' }).map((l) => l.id), ['b']);
  assert.deepEqual(filtrarLeads(leads, { de: '2026-09-30' }).map((l) => l.id), ['a']);
  assert.deepEqual(filtrarLeads(leads, { ate: '2026-09-30' }).map((l) => l.id), ['b']);
  assert.equal(filtrarLeads(leads, {}).length, 2);
});

test('valorOrigem e telefoneBonito', () => {
  assert.equal(valorOrigem(lead()), 'instagram');
  assert.equal(valorOrigem(lead({ origem_fonte: null })), 'direto');
  assert.equal(telefoneBonito('+5513997770974'), '(13) 99777-0974');
  assert.equal(telefoneBonito('+551332221000'), '(13) 3222-1000');
});

test('links de WhatsApp e telefone', () => {
  const zap = linkWhatsapp(lead(), 'Residencial Carmo');
  assert.match(zap, /^https:\/\/wa\.me\/5513997770974\?text=/);
  assert.match(decodeURIComponent(zap), /Olá, Maria!/);
  assert.match(decodeURIComponent(zap), /Residencial Carmo/);
  assert.equal(linkTelefone(lead()), 'tel:+5513997770974');
});

test('gerarCsv: cabeçalho, escape de aspas e proteção contra fórmulas de planilha', () => {
  const csv = gerarCsv(
    [lead({ nome: '=CMD()', mensagem: 'disse "oi"; tchau', retornos: 2 })],
    (id) => ({ novo: 'Novo' }[id] || id),
    (slug) => ({ carmo: 'Residencial Carmo' }[slug] || slug)
  );
  assert.equal(csv.startsWith('﻿Data;Nome;WhatsApp;E-mail;Empreendimento;Fase;Origem;Campanha;Mensagem;Retornos'), true);
  assert.match(csv, /"'=CMD\(\)"/);
  assert.match(csv, /"disse ""oi""; tchau"/);
  assert.match(csv, /Residencial Carmo/);
  assert.match(csv, /;"\+5513997770974";/);
  assert.equal(csv.includes("\"'+5513997770974"), false);
});
```

- [ ] **Passo 2: rodar e ver falhar.** `node --test tests/painel-format.test.mjs`. Esperado: `ERR_MODULE_NOT_FOUND`.
- [ ] **Passo 3: criar `site/painel/js/format.js`.**

```js
// Funções puras do painel (sem tela, sem rede): fáceis de testar.

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function tempoRelativo(iso, agora = Date.now()) {
  const min = Math.max(0, Math.floor((agora - Date.parse(iso)) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return 'há ' + min + ' min';
  const h = Math.floor(min / 60);
  if (h < 24) return 'há ' + h + ' h';
  const d = Math.floor(h / 24);
  return 'há ' + d + (d === 1 ? ' dia' : ' dias');
}

export function horasDesde(iso, agora = Date.now()) {
  return Math.floor((agora - Date.parse(iso)) / 3600000);
}

// Novo, sem nenhuma anotação ou mudança de fase, e chegou há mais de 24 h.
export function aguardandoContato(lead, agora = Date.now()) {
  return lead.fase === 'novo' && !lead.ultimo_contato_em && agora - Date.parse(lead.criado_em) > 24 * 3600000;
}

export function resumoNumeros(leads, agora = Date.now()) {
  const ref = new Date(agora);
  const mesmoMes = (iso) => {
    const d = new Date(iso);
    return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
  };
  return {
    novos: leads.filter((l) => l.fase === 'novo').length,
    aguardando: leads.filter((l) => aguardandoContato(l, agora)).length,
    visitas: leads.filter((l) => l.fase === 'visita_agendada').length,
    vendidosNoMes: leads.filter((l) => l.fase === 'vendido' && l.vendido_em && mesmoMes(l.vendido_em)).length,
  };
}

export function filtrarLeads(leads, f = {}) {
  const de = f.de ? Date.parse(f.de + 'T00:00:00') : null;
  const ate = f.ate ? Date.parse(f.ate + 'T23:59:59.999') : null;
  return leads.filter((l) => {
    if (f.fase && l.fase !== f.fase) return false;
    if (f.slug && (l.empreendimento_slug || '') !== f.slug) return false;
    if (f.fonte && (l.origem_fonte || '') !== f.fonte) return false;
    const t = Date.parse(l.criado_em);
    if (de !== null && t < de) return false;
    if (ate !== null && t > ate) return false;
    return true;
  });
}

export const valorOrigem = (lead) => lead.origem_fonte || 'direto';

export function telefoneBonito(t) {
  const d = String(t ?? '').replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return String(t ?? '');
}

export function linkWhatsapp(lead, nomeEmpreendimento) {
  const primeiroNome = String(lead.nome).split(' ')[0];
  const interesse = nomeEmpreendimento && nomeEmpreendimento !== 'Não informado' ? ' no ' + nomeEmpreendimento : '';
  const msg = 'Olá, ' + primeiroNome + '! Aqui é da Chiado Construtora. Recebemos o seu interesse' + interesse + '. Posso ajudar?';
  return 'https://wa.me/' + String(lead.telefone).replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
}

export const linkTelefone = (lead) => 'tel:' + lead.telefone;

// Separador ";" e BOM para abrir certo no Excel brasileiro.
// Valores que começam com = + - @ ganham um apóstrofo: texto digitado por visitantes não vira fórmula.
export function gerarCsv(leads, nomeFase, nomeEmp) {
  // O telefone (coluna 2) já é validado pelo banco (+55 e só dígitos), então não leva o apóstrofo.
  const celula = (v, proteger = true) => {
    let t = String(v ?? '');
    if (proteger && /^[=+\-@\t\r]/.test(t)) t = "'" + t;
    return '"' + t.replace(/"/g, '""') + '"';
  };
  const cab = ['Data', 'Nome', 'WhatsApp', 'E-mail', 'Empreendimento', 'Fase', 'Origem', 'Campanha', 'Mensagem', 'Retornos'];
  const linhas = leads.map((l) =>
    [
      new Date(l.criado_em).toLocaleString('pt-BR'),
      l.nome,
      l.telefone,
      l.email,
      nomeEmp(l.empreendimento_slug),
      nomeFase(l.fase),
      valorOrigem(l),
      l.origem_campanha,
      l.mensagem,
      l.retornos,
    ].map((v, i) => celula(v, i !== 2)).join(';')
  );
  return '﻿' + cab.join(';') + '\n' + linhas.join('\n') + '\n';
}
```

- [ ] **Passo 4: rodar e ver passar.** `node --test tests/painel-format.test.mjs`. Esperado: todos passam.
- [ ] **Passo 5: criar `site/api/painel-config.js`** (URL e chave **pública** do Supabase; nada secreto).

```js
// Entrega ao painel a URL e a chave pública (anon) do Supabase.
// A chave anon é pública por desenho: quem manda é a regra de acesso (RLS) do banco.
import { urlBase } from './_lib/supabase.js';

export default function handler(req, res) {
  const url = urlBase(process.env.SUPABASE_URL);
  const anonKey = process.env.SUPABASE_ANON_KEY;
  res.setHeader('Cache-Control', 'no-store');
  if (!url || !anonKey) return res.status(500).json({ ok: false });
  return res.status(200).json({ url, anonKey });
}
```

- [ ] **Passo 6: criar `site/painel/index.html`.**

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Painel de leads | Chiado</title>
<link rel="icon" type="image/png" href="/assets/logo-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/painel/painel.css">
</head>
<body>
<div id="app"><p class="carregando">Carregando…</p></div>
<script type="module" src="/painel/js/main.js"></script>
</body>
</html>
```

- [ ] **Passo 7: criar `site/painel/painel.css`.**

```css
:root{
  --green-900:#16301F; --green-800:#1F4029; --gold:#C9A25C; --gold-dark:#7A5A1F;
  --cream:#F3F0E6; --ink:#1B2118; --paper:#fff; --line:rgba(27,33,24,0.14);
  --muted:rgba(27,33,24,0.68); --aviso:#7A5A1F; --aviso-bg:#FBF0D9; --perigo:#9B2C2C;
}
*{ box-sizing:border-box; margin:0; padding:0; }
body{ font-family:'Poppins',sans-serif; background:var(--cream); color:var(--ink); font-size:15px; line-height:1.5; }
h1{ font-family:'Fraunces',serif; font-weight:600; font-size:24px; color:var(--green-900); }
a{ color:inherit; }
:focus-visible{ outline:2.5px solid var(--gold-dark); outline-offset:2px; }
.carregando, .erro{ padding:24px 16px; text-align:center; color:var(--muted); }
.erro{ color:var(--perigo); }

.topo{ display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:var(--green-900); color:#fff; }
.topo .marca{ font-family:'Fraunces',serif; font-size:18px; text-decoration:none; }
.topo nav{ display:flex; gap:16px; align-items:center; font-size:14px; }
.topo nav a{ color:#fff; text-decoration:none; opacity:.9; }
.link{ background:none; border:0; color:#fff; font:inherit; cursor:pointer; text-decoration:underline; }
.conteudo{ max-width:1100px; margin:0 auto; padding:16px; }

.login{ min-height:100vh; display:flex; align-items:center; justify-content:center; padding:16px; }
.cartao{ background:var(--paper); border:1px solid var(--line); border-radius:12px; padding:20px; }
.login .cartao{ width:100%; max-width:360px; display:flex; flex-direction:column; gap:12px; }
.sub{ color:var(--muted); font-size:14px; }
label{ display:flex; flex-direction:column; gap:4px; font-size:13px; font-weight:600; color:var(--green-800); }
input, select, textarea{ font:inherit; font-size:15px; padding:10px 12px; border:1px solid var(--line); border-radius:6px; background:#fff; color:var(--ink); width:100%; }
button, .botao{ font:inherit; font-size:14px; padding:10px 16px; border:1px solid var(--green-800); background:transparent; color:var(--green-800); border-radius:6px; cursor:pointer; text-decoration:none; display:inline-block; text-align:center; }
button.primario, .botao.primario{ background:var(--green-800); color:#fff; }
button[disabled]{ opacity:.6; cursor:default; }

.numeros{ display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:12px 0; }
.num{ background:var(--paper); border:1px solid var(--line); border-radius:8px; padding:10px 12px; }
.num span{ display:block; font-size:12px; color:var(--muted); }
.num strong{ font-size:24px; font-weight:500; }
.num.alerta strong{ color:var(--aviso); }

.filtros{ display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; align-items:center; }
.filtros select, .filtros input{ width:auto; font-size:13px; padding:6px 8px; }
.chip{ font-size:12px; padding:4px 12px; border-radius:999px; border:1px solid var(--line); background:#fff; color:var(--muted); cursor:pointer; }
.chip.on{ background:var(--green-800); color:#fff; border-color:var(--green-800); }
.barra{ display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin:8px 0; }

.cards{ list-style:none; display:flex; flex-direction:column; gap:8px; }
.lead{ display:flex; flex-direction:column; gap:2px; padding:10px 12px; border:1px solid var(--line); border-radius:10px; background:var(--paper); text-decoration:none; }
.lead.novo{ border-color:var(--green-800); background:#F0F6F1; }
.lead.aguardando{ border-color:var(--gold-dark); background:var(--aviso-bg); }
.l1{ display:flex; justify-content:space-between; gap:8px; align-items:center; }
.l2{ font-size:12px; color:var(--muted); }
.fase{ font-size:11px; padding:2px 10px; border-radius:999px; background:#E8EEE9; color:var(--green-800); white-space:nowrap; font-weight:500; }
.fase-perdido{ background:#F6DADA; color:var(--perigo); }
.fase-vendido{ background:var(--green-800); color:#fff; }
.tabela{ display:none; width:100%; border-collapse:collapse; background:var(--paper); border:1px solid var(--line); border-radius:8px; overflow:hidden; }
.tabela th, .tabela td{ text-align:left; padding:10px 12px; border-bottom:1px solid var(--line); font-size:14px; }
.tabela th{ font-size:12px; color:var(--muted); font-weight:600; }
.tabela tr.novo td{ background:#F0F6F1; }
.tabela tr.aguardando td{ background:var(--aviso-bg); }
@media (min-width:900px){
  .cards{ display:none; }
  .tabela{ display:table; }
  .numeros{ grid-template-columns:repeat(4,1fr); }
}
.vazio{ padding:24px; text-align:center; color:var(--muted); }
```

(Estilos da ficha e da busca por pessoa entram nas Tarefas 7 e 8.)

- [ ] **Passo 8: criar `site/painel/js/api.js`.**

```js
// Consultas ao Supabase pelo navegador. Quem manda aqui são as regras de acesso (RLS) do banco:
// sem login de um usuário do painel, nada é devolvido.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

let cliente;

async function ou(erro, dados) {
  if (erro) throw erro;
  return dados;
}

export async function iniciar() {
  const r = await fetch('/api/painel-config');
  if (!r.ok) throw new Error('Painel não configurado');
  const c = await r.json();
  cliente = createClient(c.url, c.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
}

export const sessao = async () => (await cliente.auth.getSession()).data.session;
export const entrar = (email, senha) => cliente.auth.signInWithPassword({ email, password: senha });
export const sair = () => cliente.auth.signOut();

export async function ehUsuarioPainel() {
  const { data, error } = await cliente.rpc('eh_usuario_painel');
  return !error && data === true;
}

export async function listarLeads() {
  const { data, error } = await cliente.from('leads').select('*').order('criado_em', { ascending: false });
  return ou(error, data);
}
export async function listarFases() {
  const { data, error } = await cliente.from('fases').select('*').order('ordem');
  return ou(error, data);
}
export async function listarMotivos() {
  const { data, error } = await cliente.from('motivos_perda').select('*').order('ordem');
  return ou(error, data);
}
export async function buscarLead(id) {
  const { data, error } = await cliente.from('leads').select('*').eq('id', id).maybeSingle();
  return ou(error, data);
}
export async function listarEventos(leadId) {
  const { data, error } = await cliente.from('lead_eventos').select('*').eq('lead_id', leadId).order('criado_em', { ascending: false });
  return ou(error, data);
}
export async function mudarFase(id, fase, motivo) {
  const { error } = await cliente.rpc('mudar_fase', { p_lead: id, p_fase: fase, p_motivo: motivo ?? null });
  return ou(error, true);
}
export async function anotar(leadId, texto) {
  const { data: u } = await cliente.auth.getUser();
  const { error } = await cliente.from('lead_eventos').insert({ lead_id: leadId, tipo: 'nota', texto, autor: u.user.id });
  return ou(error, true);
}
export async function buscarPessoa(termo) {
  const t = String(termo).trim();
  let consulta = cliente.from('leads').select('*').order('criado_em', { ascending: false });
  if (t.includes('@')) consulta = consulta.ilike('email', '%' + t + '%');
  else consulta = consulta.ilike('telefone', '%' + t.replace(/\D/g, '') + '%');
  const { data, error } = await consulta;
  return ou(error, data);
}
export async function apagarLead(id) {
  const { error } = await cliente.from('leads').delete().eq('id', id);
  return ou(error, true);
}
```

- [ ] **Passo 9: criar `site/painel/js/ui.js`.**

```js
import { escapeHtml as h } from './format.js';
import * as api from './api.js';

export const app = document.getElementById('app');

export const estado = {
  fases: [], motivos: [], empreendimentos: [], leads: [],
  filtros: { fase: '', slug: '', fonte: '', de: '', ate: '' },
};

export const nomeFase = (id) => estado.fases.find((f) => f.id === id)?.nome ?? id;
export const nomeEmp = (slug) => estado.empreendimentos.find((e) => e.slug === slug)?.nome ?? (slug || 'Não informado');
export const mensagemErro = (e) => {
  console.error(e);
  return 'Não foi possível carregar. Verifique a internet e tente de novo.';
};

export function moldura(conteudo) {
  app.innerHTML =
    '<header class="topo"><a class="marca" href="#/">Leads</a><nav><a href="#/pessoa">Dados da pessoa</a>' +
    '<button id="sair" class="link" type="button">Sair</button></nav></header>' +
    '<main class="conteudo">' + conteudo + '</main>';
  document.getElementById('sair').addEventListener('click', async () => {
    await api.sair();
    location.hash = '';
    location.reload();
  });
}

export function baixar(nome, texto, tipo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: tipo }));
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export { h };
```

- [ ] **Passo 10: criar `site/painel/js/tela-login.js`.**

```js
import { app, h } from './ui.js';
import * as api from './api.js';

export function telaLogin(aoEntrar, erro = '') {
  app.innerHTML =
    '<main class="login"><form id="form-login" class="cartao">' +
    '<h1>Painel de leads</h1><p class="sub">Chiado Construtora</p>' +
    '<label>E-mail<input name="email" type="email" autocomplete="username" required></label>' +
    '<label>Senha<input name="senha" type="password" autocomplete="current-password" required></label>' +
    '<p class="erro" role="alert">' + h(erro) + '</p>' +
    '<button class="primario" type="submit">Entrar</button></form></main>';

  document.getElementById('form-login').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = new FormData(ev.target);
    const botao = ev.target.querySelector('button');
    botao.disabled = true;
    botao.textContent = 'Entrando…';
    const { error } = await api.entrar(dados.get('email'), dados.get('senha'));
    if (error) return telaLogin(aoEntrar, 'E-mail ou senha incorretos.');
    aoEntrar();
  });
}
```

- [ ] **Passo 11: criar `site/painel/js/tela-lista.js`.**

```js
import { estado, moldura, mensagemErro, nomeFase, nomeEmp, baixar, h } from './ui.js';
import * as api from './api.js';
import { tempoRelativo, horasDesde, aguardandoContato, resumoNumeros, filtrarLeads, valorOrigem, gerarCsv } from './format.js';

export async function telaLista() {
  moldura('<p class="carregando">Carregando…</p>');
  try {
    estado.leads = await api.listarLeads();
  } catch (e) {
    return moldura('<p class="erro">' + h(mensagemErro(e)) + '</p>');
  }
  desenhar();
}

function quando(l, agora) {
  const texto = aguardandoContato(l, agora) ? 'aguardando contato há ' + horasDesde(l.criado_em, agora) + ' h' : tempoRelativo(l.criado_em, agora);
  const voltou = l.retornos ? ' · voltou ' + l.retornos + (l.retornos === 1 ? ' vez' : ' vezes') : '';
  return h(nomeEmp(l.empreendimento_slug)) + ' · ' + h(valorOrigem(l)) + ' · ' + h(texto) + h(voltou);
}

function classes(l, agora) {
  return (l.fase === 'novo' ? 'novo ' : '') + (aguardandoContato(l, agora) ? 'aguardando' : '');
}

function desenhar() {
  const agora = Date.now();
  const n = resumoNumeros(estado.leads, agora);
  const f = estado.filtros;
  const lista = filtrarLeads(estado.leads, f);
  const fontes = [...new Set(estado.leads.map((l) => l.origem_fonte).filter(Boolean))].sort();

  const chips =
    '<button type="button" class="chip' + (f.fase ? '' : ' on') + '" data-fase="">Todos</button>' +
    estado.fases.map((x) => '<button type="button" class="chip' + (f.fase === x.id ? ' on' : '') + '" data-fase="' + h(x.id) + '">' + h(x.nome) + '</button>').join('');

  const opEmp = ['<option value="">Todos os imóveis</option>']
    .concat(estado.empreendimentos.map((e) => '<option value="' + h(e.slug) + '"' + (f.slug === e.slug ? ' selected' : '') + '>' + h(e.nome) + '</option>'))
    .join('');
  const opFonte = ['<option value="">Todas as origens</option>']
    .concat(fontes.map((x) => '<option value="' + h(x) + '"' + (f.fonte === x ? ' selected' : '') + '>' + h(x) + '</option>'))
    .join('');

  const cartoes = lista.map((l) =>
    '<li><a class="lead ' + classes(l, agora) + '" href="#/lead/' + h(l.id) + '">' +
    '<span class="l1"><strong>' + h(l.nome) + '</strong><span class="fase fase-' + h(l.fase) + '">' + h(nomeFase(l.fase)) + '</span></span>' +
    '<span class="l2">' + quando(l, agora) + '</span></a></li>').join('');

  const linhas = lista.map((l) =>
    '<tr class="' + classes(l, agora) + '"><td><a href="#/lead/' + h(l.id) + '"><strong>' + h(l.nome) + '</strong></a></td>' +
    '<td>' + h(nomeEmp(l.empreendimento_slug)) + '</td><td>' + h(valorOrigem(l)) + '</td>' +
    '<td><span class="fase fase-' + h(l.fase) + '">' + h(nomeFase(l.fase)) + '</span></td>' +
    '<td>' + h(aguardandoContato(l, agora) ? 'aguardando contato há ' + horasDesde(l.criado_em, agora) + ' h' : tempoRelativo(l.criado_em, agora)) + '</td></tr>').join('');

  moldura(
    '<div class="numeros">' +
    '<div class="num"><span>Novos</span><strong>' + n.novos + '</strong></div>' +
    '<div class="num alerta"><span>Aguardando contato há +24 h</span><strong>' + n.aguardando + '</strong></div>' +
    '<div class="num"><span>Visitas agendadas</span><strong>' + n.visitas + '</strong></div>' +
    '<div class="num"><span>Vendidos no mês</span><strong>' + n.vendidosNoMes + '</strong></div></div>' +
    '<div class="filtros" id="chips">' + chips + '</div>' +
    '<div class="filtros"><select id="f-slug" aria-label="Imóvel">' + opEmp + '</select>' +
    '<select id="f-fonte" aria-label="Origem">' + opFonte + '</select>' +
    '<label class="sr">De <input id="f-de" type="date" value="' + h(f.de) + '"></label>' +
    '<label class="sr">Até <input id="f-ate" type="date" value="' + h(f.ate) + '"></label></div>' +
    '<div class="barra"><span class="sub">' + lista.length + (lista.length === 1 ? ' lead' : ' leads') + '</span>' +
    '<button type="button" id="exportar">Exportar para planilha</button></div>' +
    (lista.length
      ? '<ul class="cards">' + cartoes + '</ul><table class="tabela"><thead><tr><th>Nome</th><th>Imóvel</th><th>Origem</th><th>Fase</th><th>Chegou</th></tr></thead><tbody>' + linhas + '</tbody></table>'
      : '<p class="vazio">Nenhum lead com esses filtros.</p>')
  );

  document.getElementById('chips').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-fase]');
    if (!b) return;
    estado.filtros.fase = b.dataset.fase;
    desenhar();
  });
  const ligar = (id, chave) => document.getElementById(id).addEventListener('change', (ev) => { estado.filtros[chave] = ev.target.value; desenhar(); });
  ligar('f-slug', 'slug'); ligar('f-fonte', 'fonte'); ligar('f-de', 'de'); ligar('f-ate', 'ate');
  document.getElementById('exportar').addEventListener('click', () => {
    baixar('leads-chiado.csv', gerarCsv(lista, nomeFase, nomeEmp), 'text/csv;charset=utf-8');
  });
}
```

Acrescentar ao final de `painel.css` a classe usada nos rótulos de data (visualmente compactos): `.sr{ flex-direction:row; align-items:center; gap:6px; font-weight:400; font-size:13px; color:var(--muted); }`.

- [ ] **Passo 12: criar `site/painel/js/main.js`** (rotas de ficha e pessoa carregam sob demanda; elas nascem nas Tarefas 7 e 8).

```js
import * as api from './api.js';
import { app, estado, mensagemErro, h } from './ui.js';
import { telaLogin } from './tela-login.js';
import { telaLista } from './tela-lista.js';

async function carregarBase() {
  const [fases, motivos, emp] = await Promise.all([
    api.listarFases(),
    api.listarMotivos(),
    fetch('/data/empreendimentos.json').then((r) => r.json()),
  ]);
  estado.fases = fases;
  estado.motivos = motivos;
  estado.empreendimentos = emp.items || [];
}

async function rotear() {
  const hash = location.hash || '#/';
  const ficha = hash.match(/^#\/lead\/([0-9a-f-]{36})$/i);
  if (ficha) return (await import('./tela-ficha.js')).telaFicha(ficha[1]);
  if (hash === '#/pessoa') return (await import('./tela-pessoa.js')).telaPessoa();
  return telaLista();
}

async function iniciarApp() {
  try {
    if (!(await api.ehUsuarioPainel())) {
      await api.sair();
      return telaLogin(iniciarApp, 'Esta conta não tem acesso ao painel.');
    }
    await carregarBase();
  } catch (e) {
    app.innerHTML = '<p class="erro">' + h(mensagemErro(e)) + '</p>';
    return;
  }
  window.removeEventListener('hashchange', rotear);
  window.addEventListener('hashchange', rotear);
  rotear();
}

async function boot() {
  try {
    await api.iniciar();
  } catch (e) {
    app.innerHTML = '<p class="erro">O painel não está configurado.</p>';
    return;
  }
  if (await api.sessao()) return iniciarApp();
  telaLogin(iniciarApp);
}

boot();
```

- [ ] **Passo 13: `noindex` e `robots`.** Em `site/vercel.json`, dentro de `"headers"`, acrescentar o item:

```json
    {
      "source": "/painel/(.*)",
      "headers": [
        { "key": "X-Robots-Tag", "value": "noindex, nofollow" }
      ]
    },
```

Em `site/robots.txt`, acrescentar a linha `Disallow: /painel/` depois de `Disallow: /admin/`. Validar o JSON: `node -e "JSON.parse(require('fs').readFileSync('site/vercel.json','utf8'));console.log('vercel.json ok')"`.

- [ ] **Passo 14: rodar todos os testes.** `node --test`. Esperado: nenhum falha.
- [ ] **Passo 15: commit e envio da `trabalho`.**

```bash
git add site/api/painel-config.js site/painel site/vercel.json site/robots.txt tests/painel-format.test.mjs
git commit -m "Painel de leads: login e lista com numeros e filtros"
git push origin trabalho
```

- [ ] **Passo 16: testar na prévia** em `https://site-chaido-git-trabalho-chiado.vercel.app/painel/`: (1) a tela de login aparece e a resposta tem `X-Robots-Tag: noindex, nofollow` (`curl -sI .../painel/index.html`); (2) senha errada mostra "E-mail ou senha incorretos."; (3) o usuário cadastrado entra e vê os números e os leads de teste (celular: cartões; computador: tabela); (4) os filtros e o botão de exportar funcionam e o CSV abre no Excel com os acentos certos; (5) o **segundo usuário** da Tarefa 1, passo 7, vê "Esta conta não tem acesso ao painel"; (6) o painel aberto **sem login** (janela anônima) mostra só o login; (7) `curl -s https://site-chaido-git-trabalho-chiado.vercel.app/api/painel-config` devolve `url` e `anonKey` **e não contém** a palavra `service`. Clicar num lead ainda não abre a ficha (Tarefa 7).

---

### Tarefa 7: painel, ficha do lead

**Arquivos:**
- Criar: `site/painel/js/tela-ficha.js`
- Modificar: `site/painel/painel.css`

**Interfaces:**
- Consome (Tarefa 6): `api.buscarLead`, `api.listarEventos`, `api.mudarFase`, `api.anotar`; `estado.fases`, `estado.motivos`, `nomeFase`, `nomeEmp`, `moldura`, `mensagemErro`, `h`; `tempoRelativo`, `telefoneBonito`, `linkWhatsapp`, `linkTelefone`.
- Produz: `telaFicha(id: string) → Promise<void>`, chamada pela rota `#/lead/<id>`.

- [ ] **Passo 1: criar `site/painel/js/tela-ficha.js`.**

```js
import { estado, moldura, mensagemErro, nomeFase, nomeEmp, h } from './ui.js';
import * as api from './api.js';
import { tempoRelativo, telefoneBonito, linkWhatsapp, linkTelefone } from './format.js';

const chaveRascunho = (id) => 'rascunho-nota-' + id;

export async function telaFicha(id) {
  moldura('<p class="carregando">Carregando…</p>');
  let lead;
  let eventos;
  try {
    [lead, eventos] = await Promise.all([api.buscarLead(id), api.listarEventos(id)]);
  } catch (e) {
    return moldura('<p class="erro">' + h(mensagemErro(e)) + '</p>');
  }
  if (!lead) return moldura('<p class="vazio">Lead não encontrado. <a href="#/">Voltar à lista</a></p>');
  desenhar(lead, eventos);
}

function textoEvento(ev) {
  if (ev.tipo === 'nota') return '<strong>Anotação:</strong> ' + h(ev.texto);
  if (ev.tipo === 'retorno') return '<strong>Voltou a preencher o formulário.</strong>' + (ev.texto ? ' Mensagem: ' + h(ev.texto) : '');
  if (!ev.de_fase) return '<strong>Lead criado</strong>';
  const motivo = ev.texto ? ' (' + h(estado.motivos.find((m) => m.id === ev.texto)?.nome ?? ev.texto) + ')' : '';
  return '<strong>Fase:</strong> ' + h(nomeFase(ev.de_fase)) + ' → ' + h(nomeFase(ev.para_fase)) + motivo;
}

function desenhar(lead, eventos, aviso = '') {
  const emp = nomeEmp(lead.empreendimento_slug);
  const origem = [lead.origem_fonte, lead.origem_meio, lead.origem_campanha].filter(Boolean).join(' · ') || 'Direto ou não identificada';
  let rascunho = '';
  try { rascunho = localStorage.getItem(chaveRascunho(lead.id)) || ''; } catch (e) {}

  const fases = estado.fases.map((f) =>
    '<button type="button" class="chip' + (lead.fase === f.id ? ' on' : '') + (f.id === 'perdido' ? ' perigo' : '') + '" data-fase="' + h(f.id) + '">' + h(f.nome) + '</button>').join('');
  const motivos = estado.motivos.map((m) => '<option value="' + h(m.id) + '">' + h(m.nome) + '</option>').join('');
  const historico = eventos.map((ev) =>
    '<li><span class="l2">' + h(new Date(ev.criado_em).toLocaleString('pt-BR')) + '</span><span>' + textoEvento(ev) + '</span></li>').join('');

  moldura(
    '<a class="voltar" href="#/">← Voltar à lista</a>' +
    '<section class="cartao ficha">' +
    '<h1>' + h(lead.nome) + '</h1>' +
    '<p class="sub">' + h(telefoneBonito(lead.telefone)) + ' · chegou ' + h(tempoRelativo(lead.criado_em)) + (lead.retornos ? ' · voltou ' + lead.retornos + 'x' : '') + '</p>' +
    (lead.aviso_email_ok ? '' : '<p class="aviso">O e-mail de aviso deste lead não foi enviado.</p>') +
    '<div class="acoes"><a class="botao primario" href="' + h(linkWhatsapp(lead, emp)) + '" target="_blank" rel="noopener">Chamar no WhatsApp</a>' +
    '<a class="botao" href="' + h(linkTelefone(lead)) + '">Ligar</a></div>' +
    (aviso ? '<p class="erro" role="alert">' + h(aviso) + '</p>' : '') +
    '<dl class="dados"><dt>Interesse</dt><dd>' + h(emp) + '</dd><dt>Veio de</dt><dd>' + h(origem) + '</dd>' +
    (lead.email ? '<dt>E-mail</dt><dd>' + h(lead.email) + '</dd>' : '') +
    (lead.mensagem ? '<dt>Mensagem do cliente</dt><dd>' + h(lead.mensagem) + '</dd>' : '') +
    (lead.fase === 'perdido' && lead.motivo_perda ? '<dt>Motivo da perda</dt><dd>' + h(estado.motivos.find((m) => m.id === lead.motivo_perda)?.nome ?? lead.motivo_perda) + '</dd>' : '') +
    '</dl>' +
    '<h2>Fase da venda</h2><div class="filtros" id="fases">' + fases + '</div>' +
    '<div id="bloco-perda" class="perda" hidden><label>Motivo da perda<select id="motivo">' + motivos + '</select></label>' +
    '<button type="button" id="confirmar-perda" class="primario">Marcar como perdido</button></div>' +
    '<h2>Anotações</h2>' +
    '<form id="form-nota"><label class="sr-bloco">Nova anotação<textarea id="nota" rows="3" maxlength="2000">' + h(rascunho) + '</textarea></label>' +
    '<button type="submit" class="primario">Salvar anotação</button></form>' +
    '<h2>Histórico</h2><ul class="historico">' + historico + '</ul>' +
    '<p class="sub"><a href="#/pessoa">Dados da pessoa (LGPD): exportar ou apagar</a></p>' +
    '</section>'
  );

  async function recarregar(msg) {
    try {
      desenhar(await api.buscarLead(lead.id), await api.listarEventos(lead.id), msg);
    } catch (e) {
      moldura('<p class="erro">' + h(mensagemErro(e)) + '</p>');
    }
  }
  async function aplicar(fase, motivo) {
    try {
      await api.mudarFase(lead.id, fase, motivo);
    } catch (e) {
      console.error(e);
      return recarregar('Não foi possível mudar a fase. Tente de novo.');
    }
    recarregar();
  }

  document.getElementById('fases').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-fase]');
    if (!b || b.dataset.fase === lead.fase) return;
    if (b.dataset.fase === 'perdido') {
      document.getElementById('bloco-perda').hidden = false;
      document.getElementById('motivo').focus();
      return;
    }
    aplicar(b.dataset.fase, null);
  });
  document.getElementById('confirmar-perda').addEventListener('click', () => aplicar('perdido', document.getElementById('motivo').value));

  const campoNota = document.getElementById('nota');
  campoNota.addEventListener('input', () => {
    try { localStorage.setItem(chaveRascunho(lead.id), campoNota.value); } catch (e) {}
  });
  document.getElementById('form-nota').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const texto = campoNota.value.trim();
    if (!texto) return recarregar('Escreva a anotação antes de salvar.');
    try {
      await api.anotar(lead.id, texto);
    } catch (e) {
      console.error(e);
      return; // o rascunho continua guardado; nada se perde
    }
    try { localStorage.removeItem(chaveRascunho(lead.id)); } catch (e) {}
    recarregar();
  });
}
```

- [ ] **Passo 2: estilos da ficha.** Acrescentar ao final de `site/painel/painel.css`:

```css

.voltar{ display:inline-block; margin-bottom:8px; font-size:13px; color:var(--green-800); text-decoration:none; }
.ficha h2{ font-family:'Poppins',sans-serif; font-size:13px; text-transform:none; color:var(--green-800); margin:18px 0 6px; font-weight:600; }
.acoes{ display:flex; gap:8px; margin:12px 0; flex-wrap:wrap; }
.acoes .botao.primario{ flex:1; min-width:180px; }
.aviso{ background:var(--aviso-bg); color:var(--aviso); border-radius:6px; padding:8px 12px; font-size:13px; margin:8px 0; }
.dados{ display:grid; grid-template-columns:auto 1fr; gap:4px 12px; font-size:14px; margin:8px 0; }
.dados dt{ color:var(--muted); }
.chip.perigo{ border-color:var(--perigo); color:var(--perigo); }
.chip.perigo.on{ background:var(--perigo); color:#fff; }
.perda{ display:flex; gap:8px; align-items:flex-end; margin-top:8px; flex-wrap:wrap; }
.perda[hidden]{ display:none; }
.sr-bloco{ margin-bottom:8px; }
.historico{ list-style:none; display:flex; flex-direction:column; gap:8px; font-size:14px; }
.historico li{ display:flex; flex-direction:column; border-bottom:1px solid var(--line); padding-bottom:6px; }
```

- [ ] **Passo 3: rodar os testes.** `node --test`. Esperado: nenhum falha (a ficha é tela e é verificada no navegador).
- [ ] **Passo 4: commit e envio da `trabalho`.**

```bash
git add site/painel/js/tela-ficha.js site/painel/painel.css
git commit -m "Painel de leads: ficha do lead com fase, anotacoes e historico"
git push origin trabalho
```

- [ ] **Passo 5: testar na prévia,** com os leads de teste, no celular e no computador: (1) clicar num lead abre a ficha; (2) os botões de WhatsApp e ligar têm o número certo e a mensagem pronta traz o primeiro nome e o imóvel; (3) mudar a fase para "Contatado" atualiza a ficha, o histórico mostra "Novo → Contatado" e o lead sai do número "Aguardando contato"; (4) "Perdido" pede o motivo antes de aplicar; sem escolher o motivo não muda; com o motivo, a ficha mostra "Motivo da perda"; (5) salvar uma anotação a mostra no histórico, e uma anotação digitada e não salva reaparece depois de recarregar a página; (6) uma anotação com `<b>texto</b>` aparece como texto, sem formatar; (7) para um lead de teste com `aviso_email_ok = false` (alterar no Supabase), a ficha mostra o aviso do e-mail; (8) marcar um lead como "Vendido" faz o número "Vendidos no mês" subir.

---

### Tarefa 8: privacidade e LGPD

**Arquivos:**
- Criar: `site/data/empresa.json`, `site/privacidade.html`, `site/assets/privacidade.js`, `site/painel/js/tela-pessoa.js`
- Modificar: `site/vercel.json`, `site/api/sitemap.js`, `site/painel/painel.css`

**Interfaces:**
- Consome: `api.buscarPessoa`, `api.listarEventos`, `api.apagarLead`; `moldura`, `baixar`, `nomeFase`, `nomeEmp`, `telefoneBonito`, `h`.
- Produz: `telaPessoa()` (rota `#/pessoa`); página pública `/privacidade`.

- [ ] **Passo 1: criar `site/data/empresa.json`** com os dados que o usuário informou na Tarefa 0, passo 4 (o CNPJ já é conhecido). Se algum dado ainda não foi informado, **parar e perguntar**.

```json
{
  "nome_fantasia": "Chiado Construtora e Incorporadora",
  "razao_social": "<razão social informada pelo usuário>",
  "cnpj": "57.026.203/0001-74",
  "endereco": "<endereço informado pelo usuário>",
  "email_privacidade": "<e-mail de privacidade informado pelo usuário>"
}
```

(Os três valores entre `< >` são entradas do usuário, não pendência do plano: devem ser trocados pelos dados reais antes do commit.)

- [ ] **Passo 2: criar `site/assets/privacidade.js`.**

```js
// Preenche os dados da empresa na política de privacidade a partir de data/empresa.json.
fetch('data/empresa.json', { cache: 'no-store' })
  .then(function (r) { return r.json(); })
  .then(function (e) {
    document.querySelectorAll('[data-empresa]').forEach(function (el) {
      var v = e[el.getAttribute('data-empresa')];
      if (v) el.textContent = v;
    });
    var mail = document.getElementById('link-email');
    if (mail && e.email_privacidade) mail.href = 'mailto:' + e.email_privacidade;
  })
  .catch(function () {});
```

- [ ] **Passo 3: criar `site/privacidade.html`.** É um texto base; **um advogado deve revisar antes de a página ir ao ar** (isso consta na Tarefa 9).

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Política de Privacidade | Chiado Construtora</title>
<meta name="description" content="Como a Chiado Construtora e Incorporadora trata os dados pessoais de quem entra em contato pelo site.">
<link rel="icon" type="image/png" href="assets/logo-icon.png">
<link rel="canonical" href="https://www.chiadoconstrutora.com.br/privacidade">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
<div class="topbar">
  <div class="wrap topbar-inner">
    <a class="logo" href="/"><img class="logo-topbar-img" src="assets/logo-topbar.png" width="300" height="98" alt="Chiado Construtora e Incorporadora"></a>
    <a class="btn btn-dark btn-sm" href="/">Voltar ao site</a>
  </div>
</div>

<main id="conteudo" tabindex="-1">
<div class="wrap" style="max-width:760px; padding:48px 20px 72px;">
  <h1 style="font-size:clamp(30px,5vw,42px); color:var(--green-900);">Política de Privacidade</h1>
  <p style="margin-top:12px; color:rgba(27,33,24,0.72);">Esta política explica como tratamos os dados de quem nos contata pelo site, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>

  <h2 style="margin-top:32px; font-size:22px;">Quem é o responsável pelos dados</h2>
  <p style="margin-top:8px;"><span data-empresa="nome_fantasia">Chiado Construtora e Incorporadora</span>, razão social <span data-empresa="razao_social"></span>, CNPJ <span data-empresa="cnpj">57.026.203/0001-74</span>, com sede em <span data-empresa="endereco"></span>.</p>

  <h2 style="margin-top:32px; font-size:22px;">Quais dados coletamos</h2>
  <p style="margin-top:8px;">Quando você preenche o formulário de interesse: nome, WhatsApp, e-mail (opcional), mensagem (opcional) e o empreendimento de seu interesse. Também registramos a página em que você estava e de onde veio (por exemplo, Instagram ou Google), para sabermos qual divulgação funciona. Guardamos a data e a hora em que você aceitou esta política.</p>
  <p style="margin-top:8px;">Não pedimos CPF, renda nem documentos.</p>

  <h2 style="margin-top:32px; font-size:22px;">Para que usamos</h2>
  <p style="margin-top:8px;">Para entrar em contato com você, por WhatsApp, telefone ou e-mail, sobre os empreendimentos da Chiado, e para acompanhar o atendimento até a venda. Não vendemos nem cedemos seus dados para divulgação de terceiros.</p>

  <h2 style="margin-top:32px; font-size:22px;">Base legal</h2>
  <p style="margin-top:8px;">O seu consentimento, dado ao marcar a caixa do formulário. Você pode retirá-lo a qualquer momento.</p>

  <h2 style="margin-top:32px; font-size:22px;">Com quem os dados passam</h2>
  <p style="margin-top:8px;">Usamos serviços que guardam ou transportam os dados em nosso nome: Supabase (banco de dados), Vercel (hospedagem do site) e Resend (envio de e-mail). Eles só tratam os dados para nos prestar esses serviços.</p>

  <h2 style="margin-top:32px; font-size:22px;">Por quanto tempo guardamos</h2>
  <p style="margin-top:8px;">Pelo tempo necessário para o atendimento e para cumprir obrigações legais. Dados de quem não avançou no atendimento são apagados ou anonimizados depois de um período sem contato.</p>

  <h2 style="margin-top:32px; font-size:22px;">Seus direitos</h2>
  <p style="margin-top:8px;">Você pode pedir, a qualquer momento: confirmação de que tratamos seus dados, acesso a eles, correção, anonimização, exclusão, informação sobre com quem compartilhamos e a retirada do consentimento. Para isso, escreva para <a id="link-email" href="#" style="text-decoration:underline;"><span data-empresa="email_privacidade">o e-mail de privacidade da empresa</span></a>. Respondemos no prazo da lei.</p>

  <h2 style="margin-top:32px; font-size:22px;">Cookies</h2>
  <p style="margin-top:8px;">O site não usa cookies de rastreamento. Guardamos no seu navegador, apenas durante a visita, de onde você veio, para registrar a origem do seu contato.</p>

  <h2 style="margin-top:32px; font-size:22px;">Mudanças nesta política</h2>
  <p style="margin-top:8px;">Se esta política mudar, o texto de consentimento do formulário também muda e você será convidado a aceitar de novo.</p>
  <noscript><p style="margin-top:24px;">Para ver os dados completos da empresa, ative o JavaScript ou fale conosco pelo WhatsApp (13) 99777-0974.</p></noscript>
</div>
</main>

<footer>
  <div class="wrap">
    <div class="footer-bottom">
      <span>© 2026 Chiado Construtora &amp; Incorporadora — Praia Grande/SP</span>
      <span>CNPJ 57.026.203/0001-74</span>
    </div>
  </div>
</footer>
<script src="assets/privacidade.js"></script>
</body>
</html>
```

- [ ] **Passo 4: endereço `/privacidade`, sitemap e robots.** (a) Em `site/vercel.json`, no array `"rewrites"`, acrescentar `{ "source": "/privacidade", "destination": "/privacidade.html" }`. (b) Em `site/api/sitemap.js`, logo depois de `const urls = [SITE_URL + '/'];`, acrescentar `urls.push(SITE_URL + '/privacidade');`. (c) Validar o JSON do `vercel.json` como na Tarefa 6, passo 13.
- [ ] **Passo 5: criar `site/painel/js/tela-pessoa.js`.**

```js
import { moldura, baixar, nomeFase, nomeEmp, h } from './ui.js';
import * as api from './api.js';
import { telefoneBonito } from './format.js';

export function telaPessoa() {
  moldura(
    '<section class="cartao"><h1>Dados da pessoa</h1>' +
    '<p class="sub">Busque por telefone ou e-mail para exportar ou apagar os dados de uma pessoa (LGPD).</p>' +
    '<form id="form-busca" class="busca"><input name="termo" required placeholder="Telefone ou e-mail" aria-label="Telefone ou e-mail"><button class="primario" type="submit">Buscar</button></form>' +
    '<div id="resultado" role="status" aria-live="polite"></div></section>'
  );

  const resultado = document.getElementById('resultado');

  async function buscar(termo) {
    resultado.innerHTML = '<p class="sub">Buscando…</p>';
    let leads;
    try {
      leads = await api.buscarPessoa(termo);
    } catch (e) {
      console.error(e);
      resultado.innerHTML = '<p class="erro">Não foi possível buscar. Tente de novo.</p>';
      return;
    }
    if (!leads.length) {
      resultado.innerHTML = '<p class="vazio">Nenhum cadastro com esse dado.</p>';
      return;
    }
    resultado.innerHTML =
      '<ul class="historico">' +
      leads.map((l) =>
        '<li><strong>' + h(l.nome) + '</strong><span class="l2">' + h(telefoneBonito(l.telefone)) + ' · ' + h(l.email || 'sem e-mail') + ' · ' + h(nomeEmp(l.empreendimento_slug)) + ' · ' + h(nomeFase(l.fase)) + '</span>' +
        '<span class="acoes"><button type="button" data-exportar="' + h(l.id) + '">Exportar dados</button>' +
        '<button type="button" class="perigo" data-apagar="' + h(l.id) + '" data-nome="' + h(l.nome) + '">Apagar dados</button></span></li>').join('') +
      '</ul>';
    resultado.dataset.termo = termo;
    resultado._leads = leads;
  }

  document.getElementById('form-busca').addEventListener('submit', (ev) => {
    ev.preventDefault();
    buscar(new FormData(ev.target).get('termo'));
  });

  resultado.addEventListener('click', async (ev) => {
    const exportar = ev.target.closest('[data-exportar]');
    const apagar = ev.target.closest('[data-apagar]');
    if (exportar) {
      const lead = resultado._leads.find((l) => l.id === exportar.dataset.exportar);
      try {
        const eventos = await api.listarEventos(lead.id);
        baixar('dados-' + lead.id + '.json', JSON.stringify({ lead, eventos }, null, 2), 'application/json');
      } catch (e) {
        console.error(e);
        resultado.insertAdjacentHTML('afterbegin', '<p class="erro">Não foi possível exportar. Tente de novo.</p>');
      }
    }
    if (apagar) {
      if (!window.confirm('Apagar todos os dados de ' + apagar.dataset.nome + '? Isso não pode ser desfeito.')) return;
      try {
        await api.apagarLead(apagar.dataset.apagar);
      } catch (e) {
        console.error(e);
        resultado.insertAdjacentHTML('afterbegin', '<p class="erro">Não foi possível apagar. Tente de novo.</p>');
        return;
      }
      buscar(resultado.dataset.termo);
    }
  });
}
```

- [ ] **Passo 6: estilos.** Acrescentar ao final de `site/painel/painel.css`:

```css

.busca{ display:flex; gap:8px; margin:12px 0; }
.busca input{ flex:1; }
button.perigo{ border-color:var(--perigo); color:var(--perigo); }
.historico .acoes{ margin:6px 0 0; }
```

- [ ] **Passo 7: rodar todos os testes e validar o JSON.** `node --test` e o `node -e` do `vercel.json`. Esperado: nenhum teste falha e `vercel.json ok`.
- [ ] **Passo 8: commit e envio da `trabalho`.**

```bash
git add site/data/empresa.json site/privacidade.html site/assets/privacidade.js site/painel/js/tela-pessoa.js site/painel/painel.css site/vercel.json site/api/sitemap.js
git commit -m "Politica de privacidade e acoes de LGPD (exportar e apagar dados da pessoa)"
git push origin trabalho
```

- [ ] **Passo 9: testar na prévia:** (1) `/privacidade` abre com os dados da empresa preenchidos e o link do e-mail funciona; o link "Política de Privacidade" do formulário abre essa página; (2) `/sitemap.xml` lista `/privacidade`; (3) no painel, `Dados da pessoa`: buscar por telefone (só dígitos) e por e-mail acha o lead de teste; **Exportar** baixa um JSON com o lead e o histórico; **Apagar**, depois de confirmar, remove o lead e o histórico dele; cancelar na confirmação não apaga nada.

---

### Tarefa 9: fechamento e checklist antes de colocar no ar

**Arquivos:**
- Modificar: `resumo-tecnico-sessao.md`, `CLAUDE.md` (se algo mudou), este plano e o desenho (marcar o que foi feito)

- [ ] **Passo 1: verificação de segredos.** Rodar na raiz do repositório e conferir o esperado:

```bash
git grep -n "SERVICE_ROLE" -- site
```

Esperado: aparece **só** em `site/api/_lib/supabase.js` (e em comentários dessa mesma pasta). Nada em `site/painel`, `site/assets` nem `site/data`.

```bash
git grep -nE "eyJ[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]{20,}|re_[A-Za-z0-9]{20,}" -- .
```

Esperado: **nenhuma linha** (nenhuma chave dentro do repositório).

- [ ] **Passo 2: todos os testes.** `node --test`. Esperado: nenhum falha. Pedir ao usuário que rode também `node --test tests/rls.test.mjs` com as três variáveis `TESTE_*` definidas no terminal dele (as chaves não passam pelo chat). Esperado: 6 testes passam.
- [ ] **Passo 3: roteiro completo na prévia, de ponta a ponta,** no celular e no computador, com dado fictício: formulário → lead novo no painel → e-mail de aviso → WhatsApp → mudar fase → anotar → "Aguardando contato" some → perdido com motivo → exportar CSV → exportar e apagar dados da pessoa (LGPD) → sair e entrar de novo. Confirmar também: o site público (home, `/imovel/carmo`, `/imovel/garrett`, sitemap) segue igual ao de antes, exceto pelo formulário e pelo link da política.
- [ ] **Passo 4: antes de entrar no ar (decisões do usuário).** Confirmar com o usuário, uma a uma: (a) **plano do Supabase** (o plano gratuito pausa por inatividade e tem backup limitado; o Pro custa US$ 25/mês pelo plano do Financeiro, valor a reconfirmar no site oficial); (b) **Vercel Pro na equipe Chiado** antes de o painel entrar em produção, porque o plano grátis não permite uso comercial; (c) **revisão do texto de `/privacidade` por um advogado**; (d) e-mail de privacidade e razão social corretos em `site/data/empresa.json`.
- [ ] **Passo 5: limpar os dados de teste do banco.** O usuário roda no SQL Editor do Supabase (apaga só leads e controle de envios; os leads reais ainda não existem): `truncate public.leads, public.envios_recentes cascade;`. Conferir: `select count(*) from public.leads;` deve dar `0`.
- [ ] **Passo 6: atualizar os documentos.** `resumo-tecnico-sessao.md`: seção 5 (painel de leads) passa de "em desenho" para "construído, aguardando o ok para ir ao ar" e a seção 7 ganha o registro da sessão; atualizar `docs/superpowers/specs/...` se alguma decisão mudou durante a construção; marcar este plano como executado.
- [ ] **Passo 7: commit e envio da `trabalho`.**

```bash
git add resumo-tecnico-sessao.md docs
git commit -m "Painel de leads: verificacao final e documentos atualizados"
git push origin trabalho
```

- [ ] **Passo 8: perguntar ao usuário** "podemos colocar no ar?". Só com o ok claro ("podemos colocar no ar"): trazer o `main` para a `trabalho` (`git merge origin/main`, por causa das edições do `/admin`), conferir que nada mudou depois da validação, juntar no `main` sem merge forçado (`--ff-only`), enviar, esperar a Vercel publicar e conferir o site oficial (home, `/imovel/carmo`, `/privacidade`, `/sitemap.xml`, `/painel/` e um lead de verdade enviado pelo celular do usuário, que será o primeiro lead real).

---

## Cobertura do desenho

| Seção do desenho | Onde está no plano |
|---|---|
| 3. Escopo da versão 1 | Tarefas 1 a 8 |
| 4. Arquitetura (função, painel, sem pacotes) | Tarefas 3, 4, 6 e restrições globais |
| 5. Modelo de dados | Tarefa 1 (com `vendido_em`, `fases`, `motivos_perda`, ajustes da Tarefa 0) |
| 6. Segurança (RLS, chave de serviço, login fechado, escape, noindex, anti-robô) | Tarefas 0, 1, 2, 4, 6, 7, 9 |
| 7. LGPD (consentimento, dados mínimos, `/privacidade`, exportar e apagar, sem cookies) | Tarefas 1, 5, 8, 9 |
| 8. Formulário | Tarefa 5 |
| 9. `POST /api/lead` | Tarefas 2, 3 e 4 |
| 10. Painel (login, lista, ficha, dados da pessoa) | Tarefas 6, 7 e 8 |
| 11. E-mail de aviso | Tarefas 3 e 4 |
| 12. Erros e falhas | Tarefas 4, 5, 6, 7 e 8 (mensagens e testes) |
| 13. Testes | `tests/*.test.mjs`, roteiros nas prévias e Tarefa 9 |
| 14. Entrega em etapas | Tarefas 1 a 9 |
| 15. O que o usuário providencia | Tarefa 0 |

## Fora desta versão (cada item é um ciclo próprio depois)

Aviso por WhatsApp; contagem de acessos; anúncios; controle de unidades; tela para atribuir leads a vários vendedores (o campo `atribuido_a` já existe); aviso de cookies (entra com a contagem de acessos); apagamento automático de leads antigos.
