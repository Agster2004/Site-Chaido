# Painel de leads da Chiado Construtora — desenho da versão 1

Data: 03/10/2026 · Projeto: Site-Chaido (separado do Site Financeiro) · Estado: aprovado em 03/10/2026 e construído na branch `trabalho` (ainda não está no ar); ver `resumo-tecnico-sessao.md` e o plano em `docs/superpowers/plans/2026-10-03-painel-leads-plano.md`

## 1. Objetivo

A Chiado Construtora vende casas de condomínio em Praia Grande/SP e está começando do
zero: sem CRM, sem planilha de leads, sem anúncios e sem medição. Hoje o site só tem um
botão de WhatsApp, que não guarda quem chamou nem de onde a pessoa veio.

A visão completa é um painel para captar leads, ver acessos, divulgar imóveis, impulsionar
vendas e fazer tráfego pago. São cinco projetos independentes. Este documento cobre **só o
primeiro: captar leads e acompanhar a venda**. Ordem dos projetos: 1 (leads) → 2 (acessos)
→ 5 (tráfego pago) → 3 (divulgação) → 4 (impulsionar vendas). Cada um tem o seu próprio
ciclo de desenho, plano e construção.

## 2. Decisões já tomadas com o usuário

| Tema | Decisão |
|---|---|
| Caminho | Painel próprio no site, com banco de dados e login (não planilha, não CRM pronto) |
| Banco | Supabase, **projeto novo e só do Chiado** (ex.: `chiado-leads`, região São Paulo), de preferência numa organização separada da do Financeiro |
| Usuários | Começa com 1 pessoa; o sistema já nasce preparado para mais |
| Avisos de lead novo | E-mail e painel na versão 1; WhatsApp numa segunda fase |
| Funil | Novo → Contatado → Visita agendada → Proposta → Vendido, mais Perdido a qualquer momento |
| Lead repetido | Mesmo telefone não cria outro lead: registra que a pessoa voltou |
| Separação | Nada do Site Financeiro é tocado; nenhum dado nem chave é compartilhado entre os dois |

## 3. Escopo

**Entra na versão 1**
- Formulário de interesse na home e na página de cada imóvel.
- Função no servidor que valida e grava o lead (`/api/lead`).
- Banco no Supabase com leads e histórico.
- E-mail de aviso a cada lead novo.
- Painel em `/painel`: login, lista com filtros e números rápidos, detalhe do lead com
  fase, anotações e histórico.
- Página de política de privacidade (`/privacidade`) e ações de LGPD (exportar e apagar
  os dados de uma pessoa).

**Fora da versão 1** (cada item vira um ciclo próprio depois)
aviso por WhatsApp; contagem de acessos; anúncios; controle de unidades livres e vendidas;
tela para atribuir leads a vários vendedores (o campo "atendido por" já existe no banco);
aviso de cookies (só entra junto com a medição de acessos).

## 4. Arquitetura

```
Visitante ──► formulário (site) ──► POST /api/lead ──► Supabase (tabela leads)
                                          │
                                          └──► e-mail de aviso (Resend)

Você ──► /painel (login) ──► Supabase (leitura e edição, só usuário logado)
```

- O site continua estático (HTML, CSS e JS puros, sem etapa de build), na Vercel.
- `/api/lead` roda como função da Vercel, no mesmo estilo de `api/imovel.js` e
  `api/sitemap.js`. Fala com o Supabase por `fetch` na API REST dele, **sem instalar
  pacotes**, para o repositório continuar sem `package.json`.
- O painel é uma página estática em `painel/index.html` e usa a biblioteca `supabase-js`
  carregada de `cdn.jsdelivr.net`, só para login e consultas. Quem lê e edita os leads é
  o usuário logado, sob as regras de acesso do banco (seção 6).
- O formulário **nunca fala direto com o banco**. Só `/api/lead` grava leads novos, usando
  a chave de serviço, que fica apenas nas variáveis de ambiente da Vercel.
- Tudo vive no repositório do Site-Chaido: pastas `painel/`, `api/` (novas funções) e
  `docs/`. Nada no Site Financeiro.

## 5. Modelo de dados

**`leads`**

| Campo | Tipo | Observação |
|---|---|---|
| id | uuid | chave primária |
| criado_em, atualizado_em | timestamptz | |
| nome | texto, obrigatório | |
| telefone | texto, obrigatório, **único** | guardado normalizado (`+55DDDNÚMERO`); base da regra de lead repetido |
| email | texto, opcional | |
| mensagem | texto, opcional | máx. 1000 caracteres |
| empreendimento_slug | texto, opcional | `garrett`, `carmo`, ou vazio na home |
| fase | texto | `novo` (padrão), `contatado`, `visita_agendada`, `proposta`, `vendido`, `perdido` |
| motivo_perda | texto, opcional | obrigatório quando a fase é `perdido`: `preco`, `localizacao`, `sem_retorno`, `comprou_outro`, `outro` |
| atribuido_a | uuid, opcional | usuário do painel; sem tela na versão 1 |
| origem_fonte, origem_meio, origem_campanha | texto, opcionais | lidos de `utm_source`, `utm_medium`, `utm_campaign` |
| pagina_origem | texto | página onde o formulário foi enviado |
| referrer | texto, opcional | de onde o visitante veio |
| retornos | inteiro, padrão 0 | quantas vezes a mesma pessoa voltou a preencher |
| ultimo_contato_em | timestamptz, opcional | atualizado ao mudar a fase ou anotar |
| vendido_em | timestamptz, opcional | preenchido quando a fase vira vendido; base do número "vendidos no mês" |
| consentimento_em | timestamptz, obrigatório | |
| consentimento_versao | texto, obrigatório | liga ao texto exato mostrado |
| aviso_email_ok | booleano | falso se o e-mail de aviso falhou |

**`lead_eventos`** (histórico): id, lead_id (apaga junto com o lead), criado_em, tipo
(`nota`, `mudanca_fase`, `retorno`), texto, de_fase, para_fase, autor (uuid, opcional).

**`fases`** e **`motivos_perda`**: tabelas de apoio (id, nome, ordem) com a lista de fases do funil e de motivos de perda. Mudar ou incluir uma fase passa a ser uma linha nova na tabela, sem alterar vários arquivos.

**`textos_consentimento`**: versao (chave), texto, criado_em. Cada lead guarda a versão que viu.

**`usuarios_painel`**: user_id (chave), nome, criado_em. Quem está nesta tabela pode usar o painel.

**`envios_recentes`**: ip_hash, criado_em. Serve só para limitar envios; é limpa
automaticamente de tempos em tempos. Não guarda o IP em texto.

## 6. Segurança e acesso

- **Regras de acesso do banco (RLS) ligadas em todas as tabelas.** Visitante anônimo: nenhuma
  política, ou seja, não lê nem grava nada pelo banco. Usuário autenticado **e presente em
  `usuarios_painel`**: lê e edita `leads` e `lead_eventos`. `textos_consentimento` é de leitura
  para qualquer um (o formulário mostra o texto) e escrita só por usuário do painel.
- **Chave de serviço** (`SUPABASE_SERVICE_ROLE_KEY`) só na Vercel, usada só por `/api/*`,
  nunca enviada ao navegador. A chave pública (`SUPABASE_ANON_KEY`) vai no painel e só
  funciona dentro das regras acima.
- **Login:** cadastro público desativado no Supabase Auth; só entra quem eu/você cadastrar;
  senha forte exigida. Verificação em duas etapas fica para depois.
- **Texto digitado nunca vira código:** nome, mensagem e anotações são escapados na tela do
  painel e no e-mail. Nenhum HTML vindo do visitante é interpretado.
- **O painel não entra no Google:** `Disallow: /painel/` no `robots.txt` e cabeçalho
  `X-Robots-Tag: noindex` em `/painel/*`.
- **Anti-robô no formulário:** (1) campo-isca invisível; (2) envio feito em menos de 3 segundos
  é rejeitado; (3) no máximo 5 envios por hora por IP (guardado só como hash em
  `envios_recentes`). Se ainda houver abuso, entra um teste "não sou robô" (Cloudflare
  Turnstile) num ciclo futuro.

## 7. LGPD

- **Consentimento explícito:** caixa **desmarcada** com texto que diz a finalidade (contato
  sobre os imóveis), o responsável (Chiado Construtora, CNPJ 57.026.203/0001-74) e o link para
  a política. Sem marcar, o envio não acontece. Guardamos a versão do texto, a data e a hora.
- **Dados mínimos:** nome e WhatsApp obrigatórios; e-mail e mensagem opcionais. Não pedimos CPF
  nem renda.
- **`/privacidade`:** página com texto base escrito por mim; **revisão por advogado antes de
  publicar**. Cita os parceiros que tratam os dados: Supabase (banco), Vercel (hospedagem),
  Resend (e-mail).
- **Direitos do titular:** no painel, ação separada **"Dados da pessoa"**: busca por telefone ou
  e-mail, **exporta** os dados em arquivo e **apaga** o lead e o histórico dele, com confirmação.
- **Retenção:** na versão 1 não há apagamento automático. Sugestão para depois: apagar ou
  anonimizar leads perdidos ou sem retorno após 24 meses.
- **Sem cookies de rastreamento na versão 1.** Os parâmetros do link (UTM) ficam no
  `sessionStorage` do navegador até o envio do formulário. O aviso de cookies entra com a
  medição de acessos.

## 8. Formulário de interesse

- **Onde:** seção "Quero saber mais" na home e no final de cada página de imóvel
  (`/imovel/<slug>`), com o imóvel já selecionado.
- **Campos:** nome\*, WhatsApp\* (máscara brasileira), e-mail, mensagem, caixa de consentimento\*,
  mais o campo-isca escondido.
- **Origem:** ao abrir qualquer página, o site guarda no `sessionStorage` o primeiro
  `utm_source/medium/campaign` que aparecer, o referrer e a página de entrada, e envia junto.
- **Resposta ao visitante:** sucesso mostra "Recebemos seu contato" e um botão para continuar
  no WhatsApp. Erro mostra "Não conseguimos enviar" **com o botão de WhatsApp**, e o texto
  digitado permanece no formulário.
- **O botão de WhatsApp que já existe continua** e não é removido.
- **Acessibilidade:** rótulos, erros ligados aos campos e foco no primeiro erro, seguindo o
  padrão do restante do site.

## 9. `POST /api/lead`

1. Aceita só `POST` com JSON e só do próprio domínio.
2. Rejeita se o campo-isca vier preenchido, se o envio foi rápido demais ou se o IP passou do
   limite (responde como se tivesse dado certo, para não ensinar o robô).
3. Valida: nome (2 a 120 caracteres), telefone brasileiro válido (normaliza para `+55…`), e-mail
   com formato válido se vier, mensagem até 1000 caracteres, `empreendimento_slug` existente
   em `data/empreendimentos.json` ou vazio, consentimento verdadeiro e com versão vigente.
4. **Telefone novo:** grava o lead e um evento. **Telefone já existente:** não cria outro lead,
   soma 1 em `retornos` e registra um evento de retorno com a mensagem nova, se houver.
5. Envia o e-mail de aviso. Se falhar, o lead já está salvo e fica marcado com
   `aviso_email_ok = falso`.
6. Responde `200` em caso de sucesso, `400` com a lista de campos inválidos, `500` se o banco
   falhar (sem detalhes técnicos para o visitante).

## 10. Painel (`/painel`)

Feito primeiro para celular, e também usável no computador. Segue o visual do site (verde e dourado).

- **Login:** e-mail e senha.
- **Lista:** números no topo (novos, aguardando contato há mais de 24 h, visitas agendadas,
  vendidos no mês). Lista do mais recente para o mais antigo, com filtro por fase,
  empreendimento, origem e data. Leads novos aparecem destacados. Botão para exportar a lista
  em CSV. No celular os leads viram cartões empilhados; no computador, uma tabela.
- **Detalhe do lead:** dados e origem; botões **Chamar no WhatsApp** (com mensagem de
  apresentação pronta) e **Ligar**; seletor de fase (ao escolher **Perdido**, pede o motivo);
  anotações com data e hora; histórico de tudo que mudou; contador de retornos.
- **Dados da pessoa (LGPD):** exportar e apagar, com confirmação.
- **Não é aplicativo de loja:** abre no navegador, precisa de internet e não envia notificação
  push. É possível pôr um atalho na tela inicial do celular.

## 11. E-mail de aviso

Enviado pelo Resend, para a lista em `LEAD_NOTIFY_EMAILS`. Conteúdo: nome, WhatsApp, imóvel de
interesse, mensagem, origem e um botão que chama no WhatsApp. Para não cair em spam, o domínio
`chiadoconstrutora.com.br` precisa ser configurado no Resend (registros no DNS). Até lá, o envio
sai de um endereço padrão do serviço, que tem mais chance de cair no spam.

## 12. Erros e falhas

- Falha ao salvar: o visitante vê a mensagem com o botão de WhatsApp; nada se perde.
- Falha no e-mail: o lead está salvo; o painel mostra "aviso não enviado" no lead.
- Painel sem internet ou com erro: mensagem clara; a anotação em digitação é guardada
  localmente até ser salva.
- Lead repetido e dados inválidos tratados como na seção 9.

## 13. Testes

- **Automáticos** para `/api/lead`: consentimento obrigatório, telefone inválido, lead repetido,
  campo-isca, limite por IP, slug inexistente e falha do banco.
- **Teste das regras de acesso do banco**, num projeto de teste: anônimo não lê nada; usuário
  logado, mas fora de `usuarios_painel`, não lê nada; usuário do painel lê e edita.
- **Teste de tela no navegador** (celular e computador): login, filtro, mudar fase, perdido com
  motivo, anotação, exportar, apagar com confirmação.
- **Ambiente separado:** projeto de teste no Supabase e prévia da Vercel; nenhum dado real
  antes da publicação. Nenhum teste aponta para o projeto do Financeiro.
- **Teste com o usuário:** enviar um lead real do celular, receber o e-mail e ver o lead no painel.

## 14. Entrega em etapas

Cada etapa em branch própria, com prévia da Vercel; nada entra no `main` sem ok do usuário.

1. Banco (tabelas e regras), `/api/lead` e e-mail de aviso, testados sem tela.
2. Formulário nas páginas do site, na prévia.
3. Painel: login, lista e detalhe.
4. `/privacidade` e ações de LGPD.
5. Publicação no `main`, com ok do usuário.

## 15. O que o usuário precisa providenciar

- No Supabase, **criar um projeto novo só do Chiado** (região São Paulo, de preferência numa
  organização separada), e decidir o plano. Pelo que sei, o gratuito pode pausar por
  inatividade e tem backup limitado; recomendo o plano pago para guardar leads de venda.
  Os valores atuais serão confirmados antes da decisão.
- Criar conta no Resend e informar **quem controla o DNS** de `chiadoconstrutora.com.br`.
- Informar os e-mails que recebem o aviso e o do primeiro usuário do painel.
- Informar razão social, endereço e e-mail para pedidos de privacidade (para `/privacidade`).
- **Variáveis de ambiente**, coladas pelo próprio usuário na Vercel (nunca por chat):
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
  `LEAD_NOTIFY_EMAILS`, `LEAD_FROM_EMAIL`, `IP_HASH_SALT` (texto aleatório usado só para guardar o IP como hash). `SITE_URL` já existe como opção.

## 16. Decisões que ficam com o usuário mais adiante

Não bloqueiam a revisão deste desenho. Cada uma tem um valor padrão sugerido.

- Plano do Supabase: pago (recomendado) ou gratuito.
- Prazo de retenção de leads parados: 24 meses (sugerido).
- E-mail da empresa para pedidos de privacidade.
