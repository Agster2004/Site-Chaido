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
