# Resumo técnico — Site Chiado (institucional)

Arquivo de continuidade entre sessões. **Ler no início de cada sessão e atualizar no fim**
(seção 7 = registro por sessão). Vale só para o Site Chiado.

**Relação com o Site Financeiro:** os dois projetos são da mesma empresa (Chiado Construtora). Este é a
vitrine e a captação de clientes; o Site Financeiro é a gestão financeira interna da construtora (obras,
lançamentos, contas, vendas por unidade). Ficam em repositórios, bancos e chaves **separados e nunca se
misturam**. Qualquer ligação entre os dois no futuro (por exemplo, uma venda fechada no painel de leads
virar venda no financeiro) é uma decisão à parte, tomada com o usuário e desenhada antes.

## COMECE POR AQUI (estado em 13/10/2026)

**Antes de tudo, em qualquer computador:** este projeto trabalha na branch **`trabalho`**, não no `main` (o `main` é o
site no ar). Este arquivo e o `CLAUDE.md` **só existem na `trabalho`**. Se você não os vê, está no `main`: rode
`git fetch` e `git checkout trabalho` (uma vez só) e depois use "puxe do github" normalmente.

**Os dois branches: o que cada um tem (conferido em 04/10/2026)**

| | `main` | `trabalho` |
|---|---|---|
| Para que serve | O **site oficial no ar** (`www.chiadoconstrutora.com.br`). O `/admin` grava aqui | Onde **trabalhamos**; gera a **prévia** (`site-chaido-git-trabalho-chiado.vercel.app`) |
| Último commit | `61b86b6` medição de visitas (Vercel Web Analytics, no ar desde 13/10/2026) | o mais recente da `trabalho` (`git log -1`); já contém o `main` |
| O que tem | Só a pasta `site/`: vitrine, imóveis, `sitemap.xml`, `robots.txt`, imagens leves | Tudo do `main` **mais** formulário, painel `/painel`, `/privacidade`, banco (`supabase/`), `tests/`, `docs/`, este resumo e o `CLAUDE.md` |
| Este resumo e o `CLAUDE.md` | **Não existem** | Existem |
| Como muda | Só com o seu **"podemos colocar no ar"** | Commits normais ("envie para o github") |

A `trabalho` está à frente do `main` (confira: `git log --oneline origin/main..trabalho`). O `main` pode ter
commits que a `trabalho` não tem (edições do `/admin`): o "puxe do github" confere isso. **Este arquivo fica na raiz da `trabalho`;
no outro computador, deixe a pasta sempre na `trabalho`.**

**O que está pronto**
1. **Site no ar (`main`):** vitrine com os empreendimentos Garrett e Carmo, imagens leves, prévia certa ao compartilhar
   (`/imovel/<slug>`), `sitemap.xml`, `robots.txt`, dados estruturados e acessibilidade básica (Etapas 1 e 2).
2. **Painel de leads (`trabalho`, ainda NÃO no ar):** formulário "Quero saber mais" na home e nos imóveis; banco no Supabase;
   painel `/painel` com login, lista com números e filtros, ficha do lead (fase, anotações, histórico) e "Dados da pessoa"
   (exportar e apagar, LGPD); `/privacidade`. Testado no Supabase real e na prévia
   `site-chaido-git-trabalho-chiado.vercel.app`.

**Onde paramos:** tudo do painel está construído e testado, e o aviso por e-mail (Resend) está funcionando. A medição de visitas já
está no ar (`main`). Falta **colocar o painel no ar**, e isso depende de decisões e ações suas (itens 2 a 4 abaixo).

**O que ficou pendente, nesta ordem**
1. ~~**Resend (e-mail de aviso de lead)**~~ **FEITO em 07 e 09/10/2026:** DNS verificado, variáveis na Vercel e aviso testado e
   recebido nos dois e-mails. (Texto original: adicionar DNS no Registro.br, verificar, criar a chave e colar as três variáveis.)
   Detalhes na seção 7 (entradas de 05/10 e 07/10 a 13/10/2026).
2. **Plano do Supabase** (o gratuito pausa por inatividade; Pro US$ 25/mês), **Vercel Pro** (o Hobby não é para uso
   comercial) e **advogado** lendo `/privacidade`.
3. **Apagar os leads de teste** e fazer o **teste final** no celular e no computador.
4. O seu **"podemos colocar no ar"**: só então a `trabalho` entra no `main`.

**Depois:** cadastrar o `sitemap.xml` no Google Search Console; próximos projetos do plano maior (acessos do site, tráfego
pago, divulgação, impulsionar vendas), cada um com desenho e "pode construir" próprios. Detalhes nas seções 5 e 6.

**Passo a passo e motivos:** a seção 9 explica **como fazer** cada coisa (Supabase, Vercel, Resend, testes, publicar) e a seção 10, **por que decidimos assim**. As conversas NÃO sincronizam entre os computadores; só o que está escrito nos arquivos do repositório.

**Rotina (2 computadores):** "puxe do github" → mandar ler os `.md` → trabalhar → "terminei de trabalhar, atualize os .md"
→ "envie para o github". Regras completas no `CLAUDE.md`.

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
| (fim de `index.html` e `imovel.html`) | Duas linhas do script do Vercel Web Analytics (`/_vercel/insights/script.js`); só funciona em deploys feitos depois de ligar o Analytics na Vercel |
| `privacidade.html`, `assets/privacidade.js`, `data/empresa.json` | Política de privacidade (dados da empresa escritos na página e no JSON) |
| `assets/utm.js`, `assets/lead-form.js`, `data/consentimento.json` | Formulário de interesse, origem da visita e texto de consentimento (`v1`) |
| `api/lead.js`, `api/_lib/*.js` | Recebe o lead (`POST /api/lead`): validação, anti-robô, Supabase e e-mail (Resend) |
| `api/painel-config.js` | Entrega ao painel a URL e a chave **pública** do Supabase |
| `api/keep-alive.js` | Leitura diária em `fases` para o Supabase gratuito não pausar; chamada pelo cron do `vercel.json` (`0 12 * * *`). Cron só roda em **Produção** (o `main`), não nas prévias. Aceita `CRON_SECRET` se existir |
| `painel/` (`index.html`, `painel.css`, `js/*.js`) | Painel de leads em `/painel` (login, lista, ficha, dados da pessoa); `noindex` |

Fora de `site/` (não vão para o site): `supabase/migrations/0001_leads.sql` (banco), `tests/*.test.mjs` (`node --test`), `tests/ferramentas/` (banco de teste e servidores simulados; veja o `LEIAME.md` de lá), `docs/` (desenho, plano e `docs/README-VERCEL.md`, o passo a passo original de publicação), `CLAUDE.md` e este resumo. **Tudo que está dentro de `site/` é público na internet**: por isso o `README-VERCEL.md` saiu de lá em 03/10/2026.

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
- Testes automáticos: `node --test` na raiz (sem instalar nada; 50 testes, 44 passam e 6 são pulados porque precisam de
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
- **Estado (03/10/2026):** Tarefas 1 a 8 do plano **construídas e testadas** na branch `trabalho` (à frente do `main`: veja `git log --oneline origin/main..trabalho`); a Tarefa 9 (verificação final) foi feita, falta decidir/fazer os itens abaixo antes de ir ao ar.
  **O site oficial (`main`) ainda NÃO tem o formulário, o `/painel` nem o `/privacidade`.**
- **O que existe:** banco no Supabase (projeto `Chiado Leads`, organização `Chiado Site`, São Paulo) com
  `supabase/migrations/0001_leads.sql` aplicada e o usuário William liberado em `usuarios_painel`; funções
  `/api/lead`, `/api/painel-config` e `/api/sitemap` (com `/privacidade`); formulário "Quero saber mais" na home e nas
  páginas dos imóveis; painel `/painel` (login, lista com 4 números e filtros, exportar CSV, ficha do lead com
  fase/anotações/histórico, "Dados da pessoa" com exportar e apagar); `/privacidade`; 50 testes automáticos
  (`node --test`: 44 passam, 6 pulados que precisam de chaves: `tests/rls.test.mjs`).
- **Verificado no Supabase real:** contagens 6/5/1/1 (fases, motivos, consentimento, usuário); RLS ligada nas 7
  tabelas; visitante sem permissão nas funções `registrar_lead` e `permitir_envio`; lead enviado pelo celular gravado;
  repetir o telefone soma `retornos`; login, lista, mudar fase, anotar e exportar pelo painel (arquivo JSON com lead e
  histórico). **Não verificado no real:** e-mail de aviso chegando (Resend pendente), apagar uma pessoa, conta sem
  permissão (só simulado), `tests/rls.test.mjs` com chaves. As telas foram testadas em celular e computador num
  Supabase simulado local e na prévia da Vercel.
- **Variáveis na Vercel (Production e Preview):** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (Config),
  `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT` (Secret), e desde 09/10/2026 `RESEND_API_KEY` (Secret), `LEAD_FROM_EMAIL` e
  `LEAD_NOTIFY_EMAILS` (`contato@chiadoconstrutora.com.br` e `cv.cvwill@gmail.com`). A `SUPABASE_URL` foi colada com `/rest/v1` no fim; o código aceita (`urlBase`), pode ficar.
  O código aceita os dois formatos de chave do Supabase (antigas JWT e novas `sb_secret_`).
- **Resend (CONCLUÍDO em 07 e 09/10/2026):** conta `cv.cvwill@gmail.com`, domínio `chiadoconstrutora.com.br` **Verified** (TXT
  `resend._domainkey`, CNAME `rsend` e CNAME `send` no Registro.br; `_dmarc` opcional, não criado); **"Enable Receiving" fica
  desligado** (o MX do domínio é do Google). Aviso de lead testado de ponta a ponta na prévia: chegou nos dois e-mails.
  Falta só decidir se o `LEAD_NOTIFY_EMAILS` definitivo é esse (hoje: `contato@` e `cv.cvwill@gmail.com`).
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
1. ~~**Resend**~~ **FEITO** (07 e 09/10/2026): DNS verificado, `RESEND_API_KEY`, `LEAD_FROM_EMAIL` e `LEAD_NOTIFY_EMAILS` na Vercel e
   e-mail de aviso testado na prévia (Tarefa 4, passo 9). Resta decidir os destinatários definitivos de `LEAD_NOTIFY_EMAILS`.
2. **Plano do Supabase:** o gratuito pausa por inatividade e tem backup limitado; **Pro US$ 25/mês por organização** (conferido em
   supabase.com/pricing em 13/10/2026). Decisão atual: seguir no gratuito com o keep-alive e rever o Pro antes de ir ao ar.
3. **Vercel Pro** na equipe Chiado (o plano Hobby atual não permite uso comercial): **US$ 20/mês por assento de desenvolvedor**, com
   US$ 20 de crédito de uso e assentos de visualização gratuitos (conferido em vercel.com/pricing em 13/10/2026). Orçamento em PDF:
   `docs/orcamento-infraestrutura-site-chiado.pdf` (total US$ 45/mês, cerca de R$ 225,59 pela cotação de 13/10/2026; sem o Web Analytics Plus).
4. **Advogado** revisa `/privacidade` (texto base; prazo de guarda sem número; sugestão: 24 meses).
5. **Apagar os leads de teste** (SQL Editor): `truncate public.leads, public.envios_recentes cascade;`.
6. Teste final no celular e no computador e o **"podemos colocar no ar"**; depois, conferir o site oficial.

## 6. Pendências e próximos passos

- **Para ir ao ar:** os itens 2 a 6 da seção 5 ("Antes de colocar no ar"); o item 1 (Resend) já está feito.
- **Frase sobre a medição de visitas (sem cookies) em `/privacidade`**, ao colocar o painel no ar.
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

- Documentos sincronizados e enviados ao GitHub (resumo, `CLAUDE.md`, desenho, plano e o guia de publicação).
- Descoberto que o `site/README-VERCEL.md` era **público** (tudo dentro de `site/` é publicado) e a nota nova com nomes de
  variáveis iria junto. O arquivo foi movido com `git mv` para `docs/README-VERCEL.md` (commit `038266c`); na prévia o
  endereço antigo dá 404 e o resto segue funcionando. No site oficial o guia antigo continua público até a `trabalho` ir
  ao ar. **Regra:** nada interno (guias, planos, notas) vai dentro de `site/`.

### 04/10/2026
- No outro computador a sincronização deixou o usuário confuso: o resumo e o `CLAUDE.md` **só existem na `trabalho`** (na raiz
  do `main` só há `site/`) e as conversas e a memória do Claude **não sincronizam entre computadores**. Soluções: bloco
  "COMECE POR AQUI" no topo deste resumo (com a tabela do que cada branch tem), instrução para deixar o outro computador
  sempre na `trabalho` (`git fetch` e `git checkout trabalho`, uma vez só) e passar para os arquivos do repositório tudo o que
  só existia na conversa.
- Guardadas no repositório as ferramentas de teste que estavam numa pasta temporária: `tests/ferramentas/` (banco de teste com
  42 cenários e dois servidores simulados, com `LEIAME.md`), mais um `.gitignore` na raiz (`node_modules/`).
- Acrescentadas as seções 9 (como fazer: testes, Supabase, Vercel, Resend, publicar) e 10 (por que decidimos assim).
- **Nada novo foi colocado no ar.** Pendências inalteradas (seção 5): Resend/DNS, plano do Supabase, Vercel Pro, advogado,
  apagar leads de teste, teste final e o "podemos colocar no ar".

### 05/10/2026
- Computador trocado: feitos `git fetch` e `git checkout trabalho`; este computador passou a ficar na `trabalho` (commit `e9442c5`).
- **DNS do Resend no Registro.br (em andamento).** O DNS do domínio é do próprio Registro.br (servidores `d.sec.dns.br` e
  `e.sec.dns.br`); o MX do domínio raiz é do Google (`smtp.google.com`): por isso **"Enable Receiving" fica desligado** no Resend.
  Estado conferido por consulta aos servidores do Registro.br:
  - CNAME `send` -> `send.forge.rmta.net` e CNAME `rsend` -> `rsend-sae1.forge.rmta.net`: **no ar**.
  - TXT `resend._domainkey` (chave DKIM, valor `p=MIGf...`): **ainda NÃO existe nesse nome.** O valor foi colocado por engano
    no **domínio raiz** (TXT em `chiadoconstrutora.com.br`). **Falta criar** um TXT com Nome `resend._domainkey` e o mesmo valor.
    Só depois de o Resend verificar o domínio, remover o TXT do raiz (conferir antes por consulta).
  - TXT `_dmarc`: não criado (opcional; usar o valor do Resend, em `p=none`).
  - Erro que apareceu ao criar os CNAMEs: campo **Nome vazio** (tentava criar no domínio raiz, que já tem A, MX e TXT). Nome certo:
    só `send` / `rsend`, sem o domínio.
  - Registros que **não** se mexe: A do raiz, MX do Google, TXT `_vercel`, CNAME `www` (Vercel).
- Como saber se deu certo: no Resend, *Domains* -> o domínio -> *Verify DNS Records*; tudo verde = **Verified**. Depois, criar a API
  key só de envio e colar na Vercel `RESEND_API_KEY`, `LEAD_FROM_EMAIL` e `LEAD_NOTIFY_EMAILS`.
- **Onde parou:** retomar amanhã pela criação do TXT `resend._domainkey` e a verificação no Resend. Nada novo no ar.

### 07/10/2026 e 09/10/2026
- **Resend concluído.** 07/10: o TXT `resend._domainkey` foi criado no Registro.br (a chave `p=` que estava no domínio raiz foi
  editada para o nome certo; o TXT do raiz saiu), conferido por consulta aos dois servidores (`d.sec.dns.br`, `e.sec.dns.br`), e o
  domínio `chiadoconstrutora.com.br` ficou **Verified** no Resend. O TXT `_dmarc` continua **não criado** (opcional).
- 09/10: criada no Resend a API key só de envio e salvas na Vercel (Production e Preview) `RESEND_API_KEY` (Secret),
  `LEAD_FROM_EMAIL` (`Chiado leads <leads@chiadoconstrutora.com.br>`) e `LEAD_NOTIFY_EMAILS` (`contato@chiadoconstrutora.com.br` e
  `cv.cvwill@gmail.com`; o código separa por vírgula, `api/_lib/email.js`). Redeploy da **prévia** (não da Produção) a partir do
  commit `beb3cf0`, porque variável nova só vale depois de um novo deploy.
- **Teste real do aviso:** lead de teste enviado por `POST /api/lead` na prévia (nome "Teste Claude (pode apagar)", telefone
  `11900000000`, origem `teste-claude`) → resposta 200 e **o e-mail de aviso chegou nos dois endereços**. Fica verificado no real o
  que antes era só simulado. O lead de teste está no Supabase e entra na limpeza dos leads de teste.
- Dúvidas respondidas: medir visitas por dia/mês (opções: Vercel Web Analytics, GA4, Plausible/Umami; recomendado começar pelo Vercel
  Web Analytics, sem cookies, e somar o GA4 quando começar o tráfego pago) e como o Claude ajuda no tráfego pago (estrutura, textos,
  UTMs, pixels e leitura de resultados; contas, cartão e orçamento são do usuário). Ambos são projetos novos do plano maior e pedem
  desenho e "pode construir". A medição só vale a partir do dia em que é ligada.
- Anotado: `OAUTH_CLIENT_SECRET` aparece na Vercel com "Needs Attention" (valor visível, sem Sensitive); não mexido, ver depois.
- **Medição de visitas NO AR (13/10/2026, `main` em `61b86b6`).** Vercel Web Analytics (plano Hobby: 50.000 eventos/mês, 30 dias de
  histórico, sem UTM; UTM e 12 meses exigem Pro + complemento Web Analytics Plus, US$ 10/mês). Duas linhas de script no fim de
  `site/index.html` e `site/imovel.html` (cobre `/imovel/<slug>`). Sem cookies. Feito na branch `analytics-visitas` a partir do `main`,
  testado na prévia e publicado com o "podemos colocar no ar" do usuário (push `--ff-only`); conferido no ar: home, `chiadoconstrutora.com.br`,
  `/imovel/carmo` e `/_vercel/insights/script.js` (200). O `main` foi trazido para a `trabalho` (merge `4a49c68`, sem conflito).
  **Armadilha:** o script só é servido por deploys feitos DEPOIS de ligar o Analytics no painel da Vercel (antes dava 404): é
  preciso um Redeploy (da Preview, não da Produção). A branch `analytics-visitas` continua no GitHub (apagar só se o usuário pedir).
  **Pendente:** frase sobre a medição sem cookies em `/privacidade` (que só existe na `trabalho`).
- **Tráfego pago:** anúncios no Instagram levam **direto para o WhatsApp** (número `(13) 99777-0974`, WhatsApp Business); uma pessoa cuida do
  acompanhamento. Por isso o formulário e o painel de leads não participam do fluxo dos anúncios. Plano: mensagem pré-preenchida diferente
  por anúncio (origem), etiquetas padrão no WhatsApp Business, e a medição de visitas acima. Ideias de dois sites de referência
  (Murray Lançamentos e HLA Construtora): dados práticos nos cards (entrada, renda necessária, distância do mar, ano de entrega),
  selo de status e "atualizado em", UTMs nos links dos anúncios, e blog como projeto à parte; filtros só com muitos imóveis. Nada disso
  foi construído ainda (pedem desenho e "pode construir"), à exceção da medição de visitas.
- **Supabase pausou por inatividade (aconteceu de verdade, ~13/10/2026).** O projeto `Chiado Leads` (organização `Chiado Site`, plano
  Free) ficou pausado; o endereço do projeto deixou de resolver no DNS (NXDOMAIN) e o formulário/painel da prévia pararam. Dados
  seguros; a tela do Supabase diz que dá para retomar até 16/11/2027. Retomado pelo usuário com **Resume project** (gratuito); depois de
  alguns minutos o login (`/auth/v1/health`) voltou a responder 200 (antes, 502 enquanto subia). O site oficial e os anúncios (que vão ao
  WhatsApp) não foram afetados. **Lição:** confirma o risco do plano gratuito; Pro (a partir de US$ 25/mês por organização, conferido em
  supabase.com/pricing) nunca pausa. Cuidado: o outro projeto do Supabase (`chiado-financeiro-teste`, organização `Chiado Construtora`) é
  do Site Financeiro e não se mexe.
- **Decisão: seguir no plano gratuito do Supabase por enquanto** (Pro a partir de US$ 25/mês por organização fica para antes de ir ao ar).
  Construído o **keep-alive** (pedido "pode construir", 13/10/2026): `site/api/keep-alive.js` (GET; lê `fases?select=id&limit=1`; 401 se
  `CRON_SECRET` existir e não bater; 500 sem vazar detalhes), `ler()` em `api/_lib/supabase.js`, `crons` diário em `site/vercel.json` e
  `tests/keep-alive.test.mjs` (5 testes; total 50, 44 passam, 6 pulados). Testado na prévia: `GET /api/keep-alive` -> 200 `{"ok":true}`,
  `POST` -> 405. Commit `7ac41d8` na `trabalho`. **Limite importante:** o cron só dispara no deploy de Produção; como o `main` ainda não
  tem este código, **só funciona sozinho depois do "podemos colocar no ar"** do painel. Alternativa oferecida (não decidida): publicar antes
  só um keep-alive mínimo no `main`, em pacote separado. O Supabase não garante que a leitura conte como atividade (relato da comunidade).
- **Orçamento em PDF para apresentar** (`docs/orcamento-infraestrutura-site-chiado.pdf`, 2 páginas, gerado com reportlab; fica em `docs/`, fora
  do site público): Supabase Pro US$ 25 + Vercel Pro US$ 20 = **US$ 45/mês (US$ 540/ano)**; estimativa em reais pela cotação do dólar comercial
  de venda de 13/10/2026 às 11h02 (**R$ 5,0130**, AwesomeAPI; a PTAX do dia ainda não tinha saído, a última era 09/10: R$ 4,9892): **R$ 225,59/mês,
  R$ 2.707,02/ano** (Supabase R$ 125,33; Vercel R$ 100,26). O quadro de resumo mostra US$ e R$ lado a lado. Decidido **não incluir o Web Analytics
  Plus** (US$ 10/mês; só serve para UTM e histórico de 24 meses, e os anúncios vão ao WhatsApp, sem passar pelo site); dá para contratar depois.
  Fora do orçamento: IOF/impostos, Resend (gratuito, preço não verificado), anúncios, renovação do domínio e revisão do advogado. Se for
  reapresentar, atualizar a cotação (o script que gera o PDF não está no repositório).
- **Onde parou:** item 1 de "Antes de colocar no ar" feito (Resend). Faltam os itens 2 a 6 da seção 5 (no item 2, a decisão atual é ficar no
  plano gratuito do Supabase com o keep-alive, e rever o Pro antes de ir ao ar). Medição de visitas no ar; keep-alive pronto na `trabalho`.

## 8. Regras de trabalho

- Só mexer neste projeto; nunca no Site Financeiro (repositório, pasta, banco ou chaves).
- Mudanças em branch própria, com prévia da Vercel; **`main` só com ok explícito do usuário**.
- Commits e explicações em português. Nunca pedir nem receber senhas ou chaves pelo chat.
- **Rotina diária, em 2 computadores, sempre na branch `trabalho`:** começar com "puxe do github" (mostra onde parou e confere se o `main` tem edições do `/admin`) e terminar com "envie para o github" (atualiza este arquivo, faz commit e push **da branch atual**; no `main` o Claude para e pergunta, porque publica o site). Detalhes no `CLAUDE.md`.
- No fim de cada sessão: atualizar a seção 7 (e as seções 4 a 6 se algo mudou) antes de encerrar.

## 9. Como fazer (passo a passo)

### Testes
- **Todos os testes automáticos:** `node --test` na raiz do repositório (50 testes; 6 ficam "pulados" porque pedem chaves).
- **Banco (42 cenários) e telas do painel/formulário sem o Supabase real:** `tests/ferramentas/LEIAME.md`.
- **Acesso ao Supabase real, de fora (opcional):** no terminal do próprio usuário, defina `TESTE_SUPABASE_URL`,
  `TESTE_ANON_KEY` e `TESTE_SERVICE_KEY` e rode `node --test tests/rls.test.mjs`. As chaves nunca vão para o chat nem para arquivos.
- **Na prévia:** depois de cada `git push` da `trabalho`, a Vercel gera `site-chaido-git-trabalho-chiado.vercel.app` em cerca de
  30 segundos; testar `/painel/`, `/privacidade`, o formulário em `/imovel/carmo` e `curl` nas funções `/api/*`.

### Supabase (organização `Chiado Site`, projeto `Chiado Leads`, região São Paulo)
- **Rodar SQL:** ícone `>_` na barra da esquerda (SQL Editor) → *New query* → colar → *Run*. Pode aparecer "Potential issue /
  destructive operations" por causa de um `delete` dentro de uma função: confirmar. Sucesso aparece como "Success. No rows returned".
- **Conferir o banco (esperado 6, 5, 1, 1):** `select (select count(*) from public.fases) as fases, (select count(*) from
  public.motivos_perda) as motivos, (select count(*) from public.textos_consentimento) as consentimentos, (select count(*)
  from public.usuarios_painel) as usuarios;`
- **Ver os leads:** `select criado_em, nome, telefone, empreendimento_slug, fase, origem_fonte, retornos, aviso_email_ok from
  public.leads order by criado_em desc;`
- **Criar um usuário do painel:** *Authentication → Users → Add user → Create new user* (e-mail, senha forte, "Auto Confirm User"
  marcado) e depois liberar: `insert into public.usuarios_painel (user_id, nome) select id, 'Nome' from auth.users where email =
  'email@exemplo.com';` (o "Success" não diz quantas linhas entraram: conferir com a consulta de contagem).
- **Cadastro aberto desligado:** *Authentication → Sign In / Providers → "Allow new users to sign up"* desligado.
- **Chaves e endereço:** *Project Settings → API Keys* ("Publishable"/"Secret", ou "anon"/"service_role" no formato antigo) e
  *Project Settings → Data API* (endereço do projeto). **Nunca** em captura de tela, no chat ou em arquivo do repositório.
- **Apagar os leads de teste (antes de ir ao ar):** `truncate public.leads, public.envios_recentes cascade;`.
- **Mudar o banco:** crie uma migração nova (`supabase/migrations/0002_...sql`), rode `banco-cenarios.mjs`, faça backup (exportar
  `leads` em CSV pelo painel do Supabase) e só então rode no Supabase.

### Vercel (projeto `site-chaido`, equipe Chiado, plano Hobby)
- **Variável de ambiente:** *Settings → Environment Variables → Add Environment Variable*. Tipo **Config** para valores públicos
  (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) e **Secret** para os demais (`SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`, chaves do Resend).
  *Environments*: **Production e Preview**. Variável nova só vale a partir de um novo deploy. Clicar em *Redeploy* só quando for ao ar.
- **Gerar o `IP_HASH_SALT`** (no PowerShell do próprio usuário, nunca no chat; copiar sem tirar captura):
  `$b = New-Object byte[] 24; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); ($b | ForEach-Object { $_.ToString('x2') }) -join ''`
- **Ver o que as funções registraram:** painel da Vercel → *Logs*, ou pelo Claude (`get_runtime_logs`). Os erros mostram status, rota,
  código e mensagem do Supabase, sem dados de pessoas.
- **Voltar atrás se algo der errado no ar:** *Overview → Instant Rollback* na Vercel (volta o site oficial ao deploy anterior) e, no
  git, `git revert` do commit no `main`.

### Resend (conta `cv.cvwill@gmail.com`)
- *Domains → Add Domain* → `chiadoconstrutora.com.br` (região São Paulo). Ele mostra os registros de DNS: TXT `resend._domainkey`,
  CNAME `rsend`, CNAME `send` e, opcional, TXT `_dmarc` (só se ainda não existir um). Copiar os valores pelo **ícone de copiar** (a tela
  os mostra cortados). **Não ligar "Enable Receiving"** (pediria um MX no domínio principal e poderia derrubar o e-mail da empresa).
- Antes de adicionar, olhar a zona atual no Registro.br para não duplicar nem apagar nada. Depois: "I've added the records", esperar
  verificar, criar uma *API key* só de envio e colar na Vercel como `RESEND_API_KEY`; `LEAD_FROM_EMAIL` (ex.: `Chiado leads
  <leads@chiadoconstrutora.com.br>`, endereço que só envia) e `LEAD_NOTIFY_EMAILS` (um ou vários, separados por vírgula).

### Colocar no ar
1. Fazer os 6 itens de "Antes de colocar no ar" (seção 5).
2. O usuário diz **"podemos colocar no ar"**. O Claude então traz o `main` para a `trabalho` (`git merge origin/main`, por causa das
   edições do `/admin`), confere que nada mudou depois da validação, junta no `main` com `--ff-only`, envia, espera a Vercel publicar e
   confere o site oficial: home, `/imovel/carmo`, `/privacidade`, `/sitemap.xml`, `/painel/` e um lead real enviado pelo celular.
3. Depois do ar: cadastrar o `sitemap.xml` no Google Search Console e testar a prévia do link no WhatsApp.

## 10. Por que decidimos assim

- **`trabalho` e `main`:** o `main` é o site no ar (cada push publica) e o `/admin` grava direto nele. Trabalhar numa branch própria
  protege o site, dá uma prévia para testar e deixa o "puxe/envie" igual nos dois computadores. O `main` só recebe com o ok do usuário.
- **Supabase só do Chiado, separado do Financeiro:** dados, acessos e cobrança não se misturam, e um vendedor futuro vê só os leads.
- **O formulário nunca fala com o banco:** só `/api/lead` grava, com a chave de servidor (que só existe na Vercel). Assim ninguém de fora
  consegue gravar ou ler leads pelo navegador.
- **Regras de acesso (RLS) em todas as tabelas:** o painel usa só a chave pública, e o banco decide quem lê. Sem política = ninguém acessa.
  `registrar_lead` e `permitir_envio` só rodam pelo servidor.
- **Telefone único e `retornos`:** a mesma pessoa que volta a preencher não vira outro lead; fica registrado que ela voltou.
- **Anti-robô em duas camadas:** campo-isca invisível (robô recebe "sucesso" falso e nada é gravado) e limite de 5 envios por hora por IP
  (guardado só como código embaralhado, `IP_HASH_SALT`). Envio em menos de 3 s devolve erro, e não sucesso falso, porque pode ser uma
  pessoa com preenchimento automático e o lead não pode se perder em silêncio.
- **LGPD:** consentimento desmarcado, nome e WhatsApp obrigatórios, versão e data do consentimento guardadas, exportar e apagar os dados
  de uma pessoa no painel. O texto `v1` é igual no site e no banco (há teste).
- **`urlBase`:** a tela "Data API" do Supabase mostra o endereço com `/rest/v1`; o código aceita com ou sem isso (erro PGRST125).
- **CSV:** textos digitados por visitantes começam com apóstrofo se começarem com `= + - @` (proteção contra fórmulas de planilha); o
  telefone é isento porque o banco só aceita `+55` e dígitos.
- **Tudo dentro de `site/` é público:** por isso guias e planos ficam em `docs/`.
- **Resend com domínio verificado:** o remetente de teste (`onboarding@resend.dev`) só envia para o dono da conta; para a equipe receber,
  o domínio precisa estar verificado.
- **Supabase Pro e Vercel Pro antes de ir ao ar:** o gratuito do Supabase pausa por inatividade e tem backup limitado; o Hobby da Vercel
  não permite uso comercial.
