// Roda supabase/migrations/0001_leads.sql e 0002_visitas.sql num Postgres de teste (PGlite, em memória) que imita o Supabase
// (papéis anon/authenticated/service_role, auth.uid(), permissões padrão) e confere as regras de acesso.
// Como rodar: veja tests/ferramentas/LEIAME.md
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';

const db = new PGlite();
const sqlMigracao = fs.readFileSync(new URL('../../supabase/migrations/0001_leads.sql', import.meta.url), 'utf8');
let ok = 0;
let falha = 0;
const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';

const marca = (nome, cond, extra = '') => {
  if (cond) { ok++; console.log('ok    ', nome); } else { falha++; console.log('FALHA ', nome, extra); }
};

async function como(papel, sub, fn) {
  await db.exec('set role ' + papel);
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [sub || '']);
  try { return await fn(); } finally { await db.exec('reset role'); }
}

const erro = async (fn) => { try { await fn(); return null; } catch (e) { return e.message; } };

// ambiente imitando o Supabase
await db.exec(
  "create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;" +
  "create schema auth;" +
  "create table auth.users (id uuid primary key, email text);" +
  "create function auth.uid() returns uuid language sql stable as $f$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $f$;" +
  "grant usage on schema public, auth to anon, authenticated, service_role;" +
  "grant select on auth.users to authenticated, service_role;" +
  "alter default privileges in schema public grant all on tables to anon, authenticated, service_role;" +
  "alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;" +
  "insert into auth.users values ('" + A + "', 'a@x.com'), ('" + B + "', 'b@x.com');"
);
await db.exec(sqlMigracao);
marca('migração roda sem erro', true);
await db.exec(fs.readFileSync(new URL('../../supabase/migrations/0002_visitas.sql', import.meta.url), 'utf8'));
marca('migração 0002 (visitas) roda sem erro', true);

const cont = async (t) => (await db.query('select count(*)::int c from public.' + t)).rows[0].c;
marca('6 fases, 5 motivos e 1 consentimento', (await cont('fases')) === 6 && (await cont('motivos_perda')) === 5 && (await cont('textos_consentimento')) === 1);

const lead = (tel, extra = {}) => JSON.stringify({ nome: 'Maria Souza', telefone: tel, consentimento_versao: 'v1', ...extra });

await como('anon', null, async () => {
  marca('anônimo não lê leads', (await db.query('select * from public.leads')).rows.length === 0);
  marca('anônimo não insere lead', !!(await erro(() => db.query("insert into public.leads (nome, telefone, consentimento_em, consentimento_versao) values ('x','+5513900000000', now(), 'v1')"))));
  marca('anônimo não executa registrar_lead', !!(await erro(() => db.query('select public.registrar_lead($1::jsonb)', [lead('+5513900000001')]))));
  marca('anônimo não executa permitir_envio', !!(await erro(() => db.query("select public.permitir_envio('h', 5)"))));
  marca('anônimo lê o consentimento v1', (await db.query('select versao from public.textos_consentimento')).rows.length === 1);
  marca('anônimo não lê fases', (await db.query('select * from public.fases')).rows.length === 0);
  marca('anônimo não executa mudar_fase', !!(await erro(() => db.query("select public.mudar_fase('" + A + "', 'contatado')"))));
});

let id1;
await como('service_role', null, async () => {
  const r1 = (await db.query('select public.registrar_lead($1::jsonb) r', [lead('+5513900000001', { empreendimento_slug: 'carmo', origem_fonte: 'instagram' })])).rows[0].r;
  id1 = r1.id;
  marca('registrar_lead cria lead novo', r1.novo === true && !!r1.id);
  const r2 = (await db.query('select public.registrar_lead($1::jsonb) r', [lead('+5513900000001', { mensagem: 'voltei' })])).rows[0].r;
  marca('mesmo telefone não duplica e aponta para o mesmo lead', r2.novo === false && r2.id === r1.id);
  marca('retornos = 1 e só 1 lead', (await db.query('select retornos from public.leads where id=$1', [id1])).rows[0].retornos === 1 && (await cont('leads')) === 1);
  const ev = (await db.query('select tipo, de_fase, para_fase, texto from public.lead_eventos where lead_id=$1', [id1])).rows;
  marca('eventos: criação e retorno', ev.length === 2 && ev.some((e) => e.tipo === 'mudanca_fase' && e.de_fase === null && e.para_fase === 'novo') && ev.some((e) => e.tipo === 'retorno' && e.texto === 'voltei'));
  marca('telefone inválido é recusado', !!(await erro(() => db.query('select public.registrar_lead($1::jsonb)', [lead('13900000002')]))));
  marca('versão de consentimento inexistente é recusada', !!(await erro(() => db.query('select public.registrar_lead($1::jsonb)', [lead('+5513900000003', { consentimento_versao: 'v9' })]))));
  const lim = [];
  for (let i = 0; i < 6; i++) lim.push((await db.query("select public.permitir_envio('ip1', 5) p")).rows[0].p);
  marca('permitir_envio: 5 sim e a 6ª não', lim.slice(0, 5).every(Boolean) && lim[5] === false);
  marca('limite é por IP (outro IP passa)', (await db.query("select public.permitir_envio('ip2', 5) p")).rows[0].p === true);
  await db.query('update public.leads set aviso_email_ok=false where id=$1', [id1]);
  marca('aviso_email_ok pode ser marcado falso', (await db.query('select aviso_email_ok from public.leads where id=$1', [id1])).rows[0].aviso_email_ok === false);
});

await db.exec("insert into public.usuarios_painel (user_id, nome) values ('" + A + "', 'William')");

await como('authenticated', A, async () => {
  marca('eh_usuario_painel = true para A', (await db.query('select public.eh_usuario_painel() v')).rows[0].v === true);
  marca('A lê leads, fases e motivos', (await db.query('select * from public.leads')).rows.length === 1 && (await db.query('select * from public.fases')).rows.length === 6 && (await db.query('select * from public.motivos_perda')).rows.length === 5);
  await db.query("select public.mudar_fase($1, 'contatado')", [id1]);
  const l = (await db.query('select fase, ultimo_contato_em from public.leads where id=$1', [id1])).rows[0];
  marca('mudar_fase atualiza a fase e o último contato', l.fase === 'contatado' && l.ultimo_contato_em !== null);
  const ev = (await db.query("select de_fase, para_fase, autor from public.lead_eventos where lead_id=$1 and tipo='mudanca_fase' and de_fase is not null", [id1])).rows;
  marca('histórico registra novo → contatado com o autor', ev.length === 1 && ev[0].de_fase === 'novo' && ev[0].para_fase === 'contatado' && ev[0].autor === A);
  marca('perdido sem motivo é recusado', !!(await erro(() => db.query("select public.mudar_fase($1, 'perdido')", [id1]))));
  marca('fase continua contatado após a recusa', (await db.query('select fase from public.leads where id=$1', [id1])).rows[0].fase === 'contatado');
  await db.query("select public.mudar_fase($1, 'perdido', 'preco')", [id1]);
  marca('perdido com motivo grava o motivo', (await db.query('select motivo_perda from public.leads where id=$1', [id1])).rows[0].motivo_perda === 'preco');
  await db.query("select public.mudar_fase($1, 'vendido')", [id1]);
  const v = (await db.query('select fase, motivo_perda, vendido_em from public.leads where id=$1', [id1])).rows[0];
  marca('vendido grava vendido_em e limpa o motivo', v.fase === 'vendido' && v.vendido_em !== null && v.motivo_perda === null);
  await db.query("select public.mudar_fase($1, 'proposta')", [id1]);
  marca('sair de vendido limpa vendido_em', (await db.query('select vendido_em from public.leads where id=$1', [id1])).rows[0].vendido_em === null);
  await db.query("insert into public.lead_eventos (lead_id, tipo, texto, autor) values ($1, 'nota', 'ligou', $2)", [id1, A]);
  marca('A insere anotação como ele mesmo', true);
  marca('A não consegue anotar em nome de B', !!(await erro(() => db.query("insert into public.lead_eventos (lead_id, tipo, texto, autor) values ($1, 'nota', 'x', $2)", [id1, B]))));
  marca('A não lê envios_recentes', (await db.query('select * from public.envios_recentes')).rows.length === 0);
  marca('A não executa registrar_lead', !!(await erro(() => db.query('select public.registrar_lead($1::jsonb)', [lead('+5513900000009')]))));
  marca('A não insere lead direto', !!(await erro(() => db.query("insert into public.leads (nome, telefone, consentimento_em, consentimento_versao) values ('x','+5513900000008', now(), 'v1')"))));
  marca('A só vê o próprio registro em usuarios_painel', (await db.query('select user_id from public.usuarios_painel')).rows.every((r) => r.user_id === A));
});

await como('authenticated', B, async () => {
  marca('eh_usuario_painel = false para B', (await db.query('select public.eh_usuario_painel() v')).rows[0].v === false);
  marca('B não lê leads', (await db.query('select * from public.leads')).rows.length === 0);
  marca('B não lê eventos', (await db.query('select * from public.lead_eventos')).rows.length === 0);
  marca('B não lê fases', (await db.query('select * from public.fases')).rows.length === 0);
  marca('B não muda fase', !!(await erro(() => db.query("select public.mudar_fase($1, 'contatado')", [id1]))));
  marca('B não insere anotação', !!(await erro(() => db.query("insert into public.lead_eventos (lead_id, tipo, texto, autor) values ($1, 'nota', 'x', $2)", [id1, B]))));
  const del = await db.query('delete from public.leads where id=$1', [id1]);
  marca('B não apaga lead (0 linhas)', del.affectedRows === 0);
});

await como('authenticated', A, async () => {
  const del = await db.query('delete from public.leads where id=$1', [id1]);
  marca('A apaga o lead (LGPD)', del.affectedRows === 1);
});
marca('apagar o lead leva o histórico junto', (await cont('lead_eventos')) === 0 && (await cont('leads')) === 0);

// ---- 0002: contador de visitas ----
const visita = (extra = {}) => JSON.stringify({ caminho: '/', fonte: 'instagram', meio: 'bio', campanha: '', ...extra });
const linhasVisitas = async () => (await db.query('select * from public.visitas_diarias order by caminho, fonte')).rows;

await como('anon', null, async () => {
  marca('visitas: anônimo não lê', (await db.query('select * from public.visitas_diarias')).rows.length === 0);
  marca('visitas: anônimo não grava direto', !!(await erro(() => db.query("insert into public.visitas_diarias (dia, caminho, total) values (current_date, '/', 1)"))));
  marca('visitas: anônimo não executa registrar_visita', !!(await erro(() => db.query('select public.registrar_visita($1::jsonb)', [visita()]))));
});

await como('service_role', null, async () => {
  await db.query('select public.registrar_visita($1::jsonb)', [visita()]);
  await db.query('select public.registrar_visita($1::jsonb)', [visita()]);
  await db.query('select public.registrar_visita($1::jsonb)', [visita({ caminho: '/imovel/carmo', fonte: '', meio: '' })]);
  const l = await linhasVisitas();
  marca('visitas: soma na mesma linha (2) e cria outra para outra página/origem', l.length === 2 && l.find((r) => r.caminho === '/' && r.fonte === 'instagram').total === 2 && l.find((r) => r.caminho === '/imovel/carmo').total === 1);
  const hoje = (await db.query("select (now() at time zone 'America/Sao_Paulo')::date d")).rows[0].d.toISOString().slice(0, 10);
  marca('visitas: o dia é o de São Paulo', l.every((r) => new Date(r.dia).toISOString().slice(0, 10) === hoje));
  await db.query('select public.registrar_visita($1::jsonb)', [JSON.stringify({ caminho: 'x'.repeat(300), fonte: 'y'.repeat(300) })]);
  const g = (await linhasVisitas()).find((r) => r.caminho.startsWith('xxx'));
  marca('visitas: textos longos são cortados (120 e 50)', g.caminho.length === 120 && g.fonte.length === 50);
  await db.query('select public.registrar_visita($1::jsonb)', [JSON.stringify({})]);
  marca('visitas: corpo vazio vira "/" sem origem', (await linhasVisitas()).some((r) => r.caminho === '/' && r.fonte === '' && r.total === 1));
  // limite de 500 combinações por dia: as novas origens entram como "outros"
  await db.exec("insert into public.visitas_diarias (dia, caminho, fonte, total) select (now() at time zone 'America/Sao_Paulo')::date, '/', 'origem' || g, 1 from generate_series(1, 600) g");
  await db.query('select public.registrar_visita($1::jsonb)', [visita({ fonte: 'inventada-1' })]);
  await db.query('select public.registrar_visita($1::jsonb)', [visita({ fonte: 'inventada-2' })]);
  const o = (await db.query("select total from public.visitas_diarias where fonte = 'outros'")).rows;
  marca('visitas: passou de 500 combinações no dia, as novas viram "outros"', o.length === 1 && o[0].total === 2);
  marca('visitas: origem já existente continua somando mesmo com o limite', (await (async () => {
    await db.query('select public.registrar_visita($1::jsonb)', [visita()]);
    return (await db.query("select total from public.visitas_diarias where caminho = '/' and fonte = 'instagram' and meio = 'bio'")).rows[0].total === 3;
  })()));
});

await como('authenticated', A, async () => {
  marca('visitas: usuário do painel lê', (await db.query('select * from public.visitas_diarias')).rows.length > 0);
  marca('visitas: usuário do painel não grava direto', !!(await erro(() => db.query("insert into public.visitas_diarias (dia, caminho, total) values (current_date, '/z', 1)"))));
  marca('visitas: usuário do painel não apaga', (await db.query('delete from public.visitas_diarias')).affectedRows === 0);
  marca('visitas: usuário do painel não executa registrar_visita', !!(await erro(() => db.query('select public.registrar_visita($1::jsonb)', [visita()]))));
});
await como('authenticated', B, async () => {
  marca('visitas: conta sem permissão não lê', (await db.query('select * from public.visitas_diarias')).rows.length === 0);
});

console.log('\n' + ok + ' ok, ' + falha + ' falhas');
process.exit(falha ? 1 : 0);
