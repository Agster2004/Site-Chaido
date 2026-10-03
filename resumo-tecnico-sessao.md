# Resumo técnico — Site Chiado (institucional)

Arquivo de continuidade entre sessões. **Ler no início de cada sessão e atualizar no fim**
(seção 7 = registro por sessão). Vale só para o Site Chiado.

**Relação com o Site Financeiro:** os dois projetos são da mesma empresa (Chiado Construtora). Este é a
vitrine e a captação de clientes; o Site Financeiro é a gestão financeira interna da construtora (obras,
lançamentos, contas, vendas por unidade). Ficam em repositórios, bancos e chaves **separados e nunca se
misturam**. Qualquer ligação entre os dois no futuro (por exemplo, uma venda fechada no painel de leads
virar venda no financeiro) é uma decisão à parte, tomada com o usuário e desenhada antes.

## 1. O que é e onde está

- Site institucional da Chiado Construtora & Incorporadora (Praia Grande/SP). Vende casas de
  condomínio. Dois empreendimentos hoje: **Residencial Garrett** (pronto, 2 unidades) e
  **Residencial Carmo** (em construção, entrega prevista Jan/2027).
- Repositório: `github.com/Agster2004/Site-Chaido` (o nome tem "Chaido" por erro de digitação).
  Pasta local: `C:\Users\Will\Documents\GitHub\Site-Chaido`. Tudo do site fica em `site/`.
- Vercel: projeto `site-chaido` (time "Chiado"). Domínios: **www.chiadoconstrutora.com.br**
  (oficial; o domínio sem www redireciona para ele) e `site-chaido.vercel.app`.
- Publica sozinho a cada push no `main`. Branches geram prévia em
  `site-chaido-git-<branch>-chiado.vercel.app` (prévias levam `X-Robots-Tag: noindex`).

## 2. Estrutura de arquivos (`site/`)

| Caminho | Função |
|---|---|
| `index.html`, `imovel.html` | Páginas. Cards, detalhe do imóvel, nav e galeria são montados no navegador por `assets/render.js` |
| `data/empreendimentos.json` | **Fonte do conteúdo** dos empreendimentos (editada pelo painel `/admin`) |
| `data/empreendimentos.js` | Cópia do JSON só para abrir o site direto do disco (`file://`). O painel não a atualiza |
| `assets/` | `style.css`, `main.js` (menu), `render.js`, `lightbox.js`, `reveal.js`, fotos (jpg+webp), vídeos do Garrett, logos |
| `admin/` | Painel Decap CMS, login por GitHub (`admin/config.yml`) |
| `api/auth.js`, `api/callback.js` | Login OAuth do painel (variáveis `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`) |
| `api/imovel.js` | Serve `/imovel/<slug>` com title, canonical, og:*, JSON-LD e `<base href="/">` |
| `api/sitemap.js` | Gera `/sitemap.xml` a partir do JSON |
| `robots.txt`, `vercel.json` | Robots, redirecionamentos, rewrites e cabeçalhos de cache |
| `README-VERCEL.md` | Passo a passo original de publicação |
| `privacidade.html`, `assets/privacidade.js`, `data/empresa.json` | Política de privacidade (dados da empresa escritos na página e no JSON) |
| `assets/utm.js`, `assets/lead-form.js`, `data/consentimento.json` | Formulário de interesse, origem da visita e texto de consentimento (`v1`) |
| `api/lead.js`, `api/_lib/*.js` | Recebe o lead (`POST /api/lead`): validação, anti-robô, Supabase e e-mail (Resend) |
| `api/painel-config.js` | Entrega ao painel a URL e a chave **pública** do Supabase |
| `painel/` (`index.html`, `painel.css`, `js/*.js`) | Painel de leads em `/painel` (login, lista, ficha, dados da pessoa); `noindex` |

Fora de `site/` (não vão para o site): `supabase/migrations/0001_leads.sql` (banco), `tests/*.test.mjs` (`node --test`), `docs/` (desenho e plano), `CLAUDE.md` e este resumo.

## 3. Como funciona (o que não é óbvio)

- `/imovel/<slug>` é um rewrite (`vercel.json`) para `api/imovel.js`, que busca `imovel.html` e o
  JSON **pelo próprio host** (`fetch`) e injeta as tags. Ler do disco **não funciona** na Vercel
  (deu erro 500 na primeira tentativa). Slug inexistente devolve 404.
- Links antigos `imovel.html?slug=x` redirecionam (308) para `/imovel/x`; o redirect deixa `?slug=x`
  duplicado no fim (cosmético). Os links internos ainda usam o formato antigo, de propósito, para o
  site continuar abrindo direto do disco.
- Domínio oficial usado em canonical/og/sitemap: `https://www.chiadoconstrutora.com.br`, em
  `index.html`, `imovel.html`, `api/imovel.js`, `api/sitemap.js` e `robots.txt`. A variável
  `SITE_URL` (Vercel) sobrescreve nas funções.
- Cache (`vercel.json`): imagens 7 dias, vídeos 7 dias, CSS/JS 1 dia, JSON sem cache. Mudou CSS/JS:
  visitantes recorrentes podem ver a versão antiga por até 24 h.
- `api/imovel.js` usa `replace` com **função** (não texto) porque um `$` na descrição corromperia o HTML.
- Fotos do Carmo foram reduzidas a 1400 px (a página do Carmo foi de 4,3 MB para 1,8 MB). Os originais
  de 2000 px só existem no histórico do git. **Fotos novas enviadas pelo painel não são reduzidas.**
- Sem build e sem `package.json`: HTML/CSS/JS puros e funções da Vercel que usam só `fetch`.
- Testes automáticos: `node --test` na raiz (sem instalar nada; 45 testes, 39 passam e 6 são pulados porque precisam de
  chaves do Supabase: `tests/rls.test.mjs`). Além deles, as telas foram testadas num servidor local com Supabase
  simulado e as funções, com `curl` na prévia da Vercel.

## 4. Feito até agora (03/10/2026)

- **Etapa 1** (no ar, commits `d381e05`, `fb873da`): prévia de compartilhamento por empreendimento,
  imagens e logos menores, lightbox em WebP, cache, redirecionamento.
- **Etapa 2** (no ar, commit `1ac5569`): `sitemap.xml`, `robots.txt`, JSON-LD (construtora na home;
  Residence + BreadcrumbList nos imóveis), link "Pular para o conteúdo", `<main>`, `aria-expanded` no
  menu, ícones com `aria-hidden`, `scroll-margin-top`, correção do `$`.
- Branches `melhorias-etapa1` e `melhorias-etapa2` já foram apagadas (tudo está no `main`). Depois também foram
  apagadas `docs-continuidade` e `painel-leads` (nada se perdeu: tudo está na `trabalho`). Hoje existem só `main`
  (site no ar) e `trabalho` (branch de trabalho nos dois computadores).

## 5. Painel de leads (construído na `trabalho`; ainda NÃO está no ar)

- Parte 1 de 5 do plano "painel da Chiado": **captar leads e acompanhar a venda**. As outras, nesta
  ordem: 2 acessos do site → 5 tráfego pago → 3 divulgação → 4 impulsionar vendas.
- Desenho: `docs/superpowers/specs/2026-10-03-painel-leads-design.md`. Plano executado:
  `docs/superpowers/plans/2026-10-03-painel-leads-plano.md` (Tarefas 0 a 9).
- Decisões: painel próprio em `/painel`, banco **Supabase em projeto novo só do Chiado** (o Financeiro usa outro
  projeto, nunca misturar dados nem chaves), avisos por e-mail e painel (WhatsApp numa segunda fase), funil
  Novo → Contatado → Visita agendada → Proposta → Vendido (+ Perdido), lead com o mesmo telefone não duplica
  (soma `retornos`).
- **Estado (03/10/2026):** Tarefas 1 a 8 do plano **construídas e testadas** na branch `trabalho` (16 commits à
  frente do `main`); a Tarefa 9 (verificação final) foi feita, falta decidir/fazer os itens abaixo antes de ir ao ar.
  **O site oficial (`main`) ainda NÃO tem o formulário, o `/painel` nem o `/privacidade`.**
- **O que existe:** banco no Supabase (projeto `Chiado Leads`, organização `Chiado Site`, São Paulo) com
  `supabase/migrations/0001_leads.sql` aplicada e o usuário William liberado em `usuarios_painel`; funções
  `/api/lead`, `/api/painel-config` e `/api/sitemap` (com `/privacidade`); formulário "Quero saber mais" na home e nas
  páginas dos imóveis; painel `/painel` (login, lista com 4 números e filtros, exportar CSV, ficha do lead com
  fase/anotações/histórico, "Dados da pessoa" com exportar e apagar); `/privacidade`; 45 testes automáticos
  (`node --test`: 39 passam, 6 pulados que precisam de chaves: `tests/rls.test.mjs`).
- **Verificado no Supabase real:** contagens 6/5/1/1 (fases, motivos, consentimento, usuário); RLS ligada nas 7
  tabelas; visitante sem permissão nas funções `registrar_lead` e `permitir_envio`; lead enviado pelo celular gravado;
  repetir o telefone soma `retornos`; login, lista, mudar fase, anotar e exportar pelo painel (arquivo JSON com lead e
  histórico). **Não verificado no real:** e-mail de aviso chegando (Resend pendente), apagar uma pessoa, conta sem
  permissão (só simulado), `tests/rls.test.mjs` com chaves. As telas foram testadas em celular e computador num
  Supabase simulado local e na prévia da Vercel.
- **Variáveis na Vercel (Production e Preview):** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (Config),
  `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT` (Secret). **Faltam** `RESEND_API_KEY`, `LEAD_FROM_EMAIL`,
  `LEAD_NOTIFY_EMAILS`. A `SUPABASE_URL` foi colada com `/rest/v1` no fim; o código aceita (`urlBase`), pode ficar.
  O código aceita os dois formatos de chave do Supabase (antigas JWT e novas `sb_secret_`).
- **Resend:** conta criada com `cv.cvwill@gmail.com`, domínio `chiadoconstrutora.com.br` adicionado; **DNS pendente**
  (o usuário não tinha a senha do Registro.br neste computador): TXT `resend._domainkey`, CNAME `rsend`, CNAME `send`
  e, opcional, TXT `_dmarc`; **deixar "Enable Receiving" desligado**; antes de adicionar, conferir a zona atual no
  Registro.br. O e-mail definitivo que recebe o aviso de lead (`LEAD_NOTIFY_EMAILS`) **ficou em aberto de propósito**;
  nos testes o aviso iria para `cv.cvwill@gmail.com` com o remetente de teste `onboarding@resend.dev`.
- **Dados da empresa em `/privacidade` (confirmados pelo usuário):** CHIADO CONSTRUTORA E INCORPORADORA LTDA - EPP;
  CNPJ 57.026.203/0001-74; Rua Jaú, 955, 2º andar, escritório 26 a 16, CEP 11701-190, Praia Grande/SP; e-mail para
  pedidos de privacidade chiadoconstrutora@gmail.com. Estão em `site/data/empresa.json` e escritos na página.
- **Notas técnicas que não são óbvias:** (1) `/api/lead`: campo-isca preenchido recebe sucesso falso; envio em menos de
  3 s devolve 400 (uma pessoa com preenchimento automático pode tentar de novo); (2) erros do Supabase aparecem nos
  logs da Vercel com status, rota, código e mensagem, nunca `details`; (3) o texto de consentimento `v1` tem de ser
  igual em `site/data/consentimento.json` e na migração (há teste); (4) os arquivos do site usam fim de linha CRLF
  (Windows): edições por script devem preservar; (5) o banco não tem extensão `pgcrypto` (`gen_random_uuid()` é nativo);
  (6) um valor de `IP_HASH_SALT` apareceu numa captura de tela e foi descartado antes de ser salvo; o salvo é outro.

### Antes de colocar no ar (decisões e ações do usuário)
1. **Resend:** adicionar os registros de DNS no Registro.br, verificar o domínio, criar a chave de envio (só envio) e
   colar `RESEND_API_KEY`, `LEAD_FROM_EMAIL` (ex.: `Chiado leads <leads@chiadoconstrutora.com.br>`) e
   `LEAD_NOTIFY_EMAILS` na Vercel; testar o e-mail de aviso na prévia (Tarefa 4, passo 9).
2. **Plano do Supabase:** o gratuito pausa por inatividade e tem backup limitado; Pro US$ 25/mês (valor do plano do
   Financeiro, a reconfirmar).
3. **Vercel Pro** na equipe Chiado (o plano Hobby atual não permite uso comercial).
4. **Advogado** revisa `/privacidade` (texto base; prazo de guarda sem número; sugestão: 24 meses).
5. **Apagar os leads de teste** (SQL Editor): `truncate public.leads, public.envios_recentes cascade;`.
6. Teste final no celular e no computador e o **"podemos colocar no ar"**; depois, conferir o site oficial.

## 6. Pendências e próximos passos

- **Para ir ao ar:** os 6 itens da seção 5 ("Antes de colocar no ar").
- **Painel de leads, opcionais:** segundo usuário sem permissão no Supabase real para ver a mensagem de bloqueio;
  `tests/rls.test.mjs` com chaves de teste no terminal do usuário; paginar a lista quando passar de 1000 leads (limite
  padrão do Supabase); aviso por WhatsApp; atribuir leads a vários vendedores (o campo `atribuido_a` já existe);
  apagamento automático de leads antigos.
- Cadastrar `sitemap.xml` no Google Search Console (ação do usuário, na conta Google dele).
- Testar a prévia do link no WhatsApp com o site já publicado.
- Opcionais do site: reduzir o escopo do login do painel `/admin` (hoje `repo,user`) e adicionar `state` — risco de
  travar o acesso; legenda no vídeo do Garrett; tirar o `?slug=` duplicado do redirect; medição oficial do PageSpeed
  (a cota gratuita estava esgotada); limite de tamanho de imagem no `admin/config.yml`.
- Próximos projetos do plano maior: 2 acessos do site, 5 tráfego pago, 3 divulgação, 4 impulsionar vendas (cada um com
  desenho e "pode construir" próprios).

## 7. Registro por sessão

### 03/10/2026
- Localizado o projeto certo; analisada a base de código; Etapas 1 e 2 feitas, publicadas e verificadas
  em produção; branches apagadas.
- Pasta antiga `Site-Financeiro-main` movida para `C:\Users\Will\Documents\_arquivo\` (sem apagar).
- Definida a regra de separação: Site Chiado e Site Financeiro são repositórios independentes; cada sessão
  mexe só no projeto onde foi aberta.
- Desenho do painel de leads aprovado em 4 partes e escrito em `docs/superpowers/specs/`.
- Criados este arquivo e o `CLAUDE.md`, com a rotina do usuário (puxe do github → ler os .md → trabalhar →
  atualizar os .md → envie para o github), o fluxo branch → prévia → testar → "podemos colocar no ar" → `main`
  e a regra de que cada sessão mexe só no seu projeto.
- Pasta de documentos `docs/` e estes arquivos enviados ao GitHub (branch `docs-continuidade`, depois apagada) e
  criada a branch **`trabalho`**, a branch de trabalho fixa nos dois computadores. Motivo: no Chiado o `main` é o site no ar e
  o `/admin` grava direto nele; a `trabalho` protege o site, e o "puxe do github" confere o `main` e traz as
  edições do `/admin`. Só entra no `main` com o "podemos colocar no ar" do usuário. **No ar: não** (só `.md`).
- Mostrada ao usuário uma simulação visual do painel (lista de leads e ficha, dados fictícios) e confirmado que
  ajustes futuros são fáceis (texto, números, filtros: minutos; campo novo ou fases: médio, com backup antes).
- Plano de implementação escrito (skill `writing-plans`) e checado; o usuário encerrou o dia pedindo para
  atualizar os `.md`. **Fim do dia:** `main` = site no ar, sem mudanças desde a Etapa 2; `trabalho` tem o
  `CLAUDE.md`, este resumo, o desenho e o plano (os `.md` atualizados hoje só vão ao GitHub com o "envie para o
  github" do usuário). **Próximo passo:** o usuário faz a Tarefa 0 do plano e diz "pode construir"; no outro
  computador, abrir uma conversa na pasta raiz do GitHub e pedir para trazer o Site Chiado (branch `trabalho`).

### 03/10/2026 (segunda parte do dia, a partir do "bom dia")
- Tarefa 0 do plano feita com o usuário: organização e projeto no Supabase, cadastro fechado e usuário William, conta
  e domínio no Resend (DNS pendente), dados da empresa, variáveis na Vercel (as do Supabase e a `IP_HASH_SALT`).
- O usuário disse "pode construir" e as Tarefas 1 a 8 foram executadas uma a uma (modo `executing-plans`, com teste
  antes do código), com push da `trabalho` para a prévia e conferência com o usuário no Supabase e no celular.
- Problemas achados e resolvidos: `pgcrypto` indisponível (removido), `SUPABASE_URL` com `/rest/v1` (PGRST125; `urlBase`),
  link do consentimento repetido, envio rápido demais que perdia o lead em silêncio, apóstrofo no telefone do CSV.
- Resultado: formulário, painel (login, lista, ficha, dados da pessoa) e `/privacidade` funcionando na prévia
  `site-chaido-git-trabalho-chiado.vercel.app`; o site oficial segue sem eles.
- Tarefa 9 (verificação): sem chave de servidor fora de `api/_lib/supabase.js`, nenhuma chave no repositório, 45 testes
  (39 passam, 6 pulados). **Próximo passo:** o usuário decide e faz os 6 itens de "Antes de colocar no ar"; só então o
  "podemos colocar no ar".

## 8. Regras de trabalho

- Só mexer neste projeto; nunca no Site Financeiro (repositório, pasta, banco ou chaves).
- Mudanças em branch própria, com prévia da Vercel; **`main` só com ok explícito do usuário**.
- Commits e explicações em português. Nunca pedir nem receber senhas ou chaves pelo chat.
- **Rotina diária, em 2 computadores, sempre na branch `trabalho`:** começar com "puxe do github" (mostra onde parou e confere se o `main` tem edições do `/admin`) e terminar com "envie para o github" (atualiza este arquivo, faz commit e push **da branch atual**; no `main` o Claude para e pergunta, porque publica o site). Detalhes no `CLAUDE.md`.
- No fim de cada sessão: atualizar a seção 7 (e as seções 4 a 6 se algo mudou) antes de encerrar.
