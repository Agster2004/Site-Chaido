# Resumo técnico — Site Chiado (institucional)

Arquivo de continuidade entre sessões. **Ler no início de cada sessão e atualizar no fim**
(seção 7 = registro por sessão). Vale só para o Site Chiado.

**Relação com o Site Financeiro:** os dois projetos são da mesma empresa (Chiado Construtora). Este é a
vitrine e a captação de clientes; o Site Financeiro é a gestão financeira interna da construtora (obras,
lançamentos, contas, vendas por unidade). Ficam em repositórios, bancos e chaves **separados e nunca se
misturam**. Qualquer ligação entre os dois no futuro (por exemplo, uma venda fechada no painel de leads
virar venda no financeiro) é uma decisão à parte, tomada com o usuário e desenhada antes.

## COMECE POR AQUI (estado em 17/10/2026; último "no ar" em 13/10/2026)

> **NO AR desde 13/10/2026:** a `trabalho` foi publicada no `main` (commit `ddb4082`, avanço simples) com o "podemos colocar no ar" do usuário. O site
> oficial agora tem formulário, `/painel`, `/privacidade`, contador de visitas, origem no WhatsApp e keep-alive. No momento da publicação `main` e `trabalho` estavam no mesmo
> commit (`ddb4082`); depois a `trabalho` andou à frente com o ajuste do menu, o botão "Quero saber mais" e a trava de contagem só no site oficial, publicados nos "podemos colocar no ar" seguintes (seção 7, "Ajustes depois de ir ao ar"); confira sempre com `git log --oneline origin/main..trabalho`; o `main` passa a ter também este resumo, o `CLAUDE.md`, `docs/`, `tests/` e `supabase/` (fora de `site/`, não ficam públicos). Detalhes e
> o que ainda falta: veja "O que ficou pendente" e a seção 7 (entrada "13/10/2026, no ar"). Onde o texto abaixo disser "ainda NÃO no ar", leia "agora no ar".

> **Em andamento (17 e 18/10/2026), NADA disto está no `main` (site oficial); tudo está na `trabalho` e na prévia da Vercel** (`site-chaido-git-trabalho-chiado.vercel.app/imovel/carmo`).
> O usuário pediu **não publicar nada antes de ver**.
> 1. **Página do Carmo no estilo da GMV** ("layout destaque"): capa grande, seções escuras e claras, faixa de características, **galeria em carrossel lateral**, diferenciais e casas,
>    **plantas das 5 casas** (um botão por casa, 3 andares em carrossel), mapa (carrega no clique), andamento da obra (escondido até chegarem os percentuais), formulário e outros empreendimentos.
>    Desenho: `docs/superpowers/specs/2026-10-17-pagina-destaque-design.md`.
> 2. **Capa com pessoas** (5 cenas geradas de graça no Hugging Face): é a capa do Carmo na prévia (`site/assets/carmo-capa-pessoas.mp4`), com "Imagens ilustrativas" no canto; o usuário achou "ótimo".
>    No celular toca uma versão leve (`carmo-capa-pessoas-celular.mp4`, 1,4 MB); com "economizar dados", só fotos. O vídeo antigo, só com fotos, continua em `site/assets/carmo-capa.mp4`.
> **Próximo:** o usuário revisa a página toda na prévia; faltam os percentuais da obra, o book, confirmar 3 banheiros, decidir o Garrett no estilo novo e pedir ao arquiteto a correção dos rótulos
> das garagens das casas 2 e 5. Depois, o "podemos colocar no ar". Detalhes na seção 7 (entradas "17/10/2026" e "18/10/2026") e na seção 6.

**Antes de tudo, em qualquer computador:** este projeto trabalha na branch **`trabalho`**, não no `main` (o `main` é o
site no ar). Este arquivo e o `CLAUDE.md` **só existem na `trabalho`**. Se você não os vê, está no `main`: rode
`git fetch` e `git checkout trabalho` (uma vez só) e depois use "puxe do github" normalmente.

**Os dois branches: o que cada um tem (conferido em 13/10/2026)**

| | `main` | `trabalho` |
|---|---|---|
| Para que serve | O **site oficial no ar** (`www.chiadoconstrutora.com.br`). O `/admin` grava aqui | Onde **trabalhamos**; gera a **prévia** (`site-chaido-git-trabalho-chiado.vercel.app`) |
| Último commit | `ee80abf` (13/10/2026): painel completo, contador de visitas (só conta no site oficial), menu com a aba Visitas ao lado de Leads e botão "Quero saber mais" | o mais recente da `trabalho` (`git log -1`); igual ao `main` até o próximo ajuste |
| O que tem | A pasta `site/` (vitrine, imóveis, formulário, `/painel`, `/privacidade`, funções `api/`, `sitemap.xml`, `robots.txt`) e, fora dela, `supabase/`, `tests/`, `docs/`, este resumo e o `CLAUDE.md` | O mesmo que o `main`, mais o que estiver sendo feito e ainda não foi publicado |
| Este resumo e o `CLAUDE.md` | Existem (desde que a `trabalho` entrou no `main`) | Existem |
| Como muda | Só com o seu **"podemos colocar no ar"** | Commits normais ("envie para o github") |

A `trabalho` está à frente do `main` (confira: `git log --oneline origin/main..trabalho`). O `main` pode ter
commits que a `trabalho` não tem (edições do `/admin`): o "puxe do github" confere isso. **Este arquivo fica na raiz da `trabalho`;
no outro computador, deixe a pasta sempre na `trabalho`.**

**O que está pronto**
1. **Site no ar (`main`):** vitrine com os empreendimentos Garrett e Carmo, imagens leves, prévia certa ao compartilhar
   (`/imovel/<slug>`), `sitemap.xml`, `robots.txt`, dados estruturados e acessibilidade básica (Etapas 1 e 2).
2. **Painel de leads (NO AR desde 13/10/2026):** formulário "Quero saber mais" na home e nos imóveis; banco no Supabase;
   painel `/painel` com login, lista com números e filtros, ficha do lead (fase, anotações, histórico) e "Dados da pessoa"
   (exportar e apagar, LGPD; na ficha há os botões **Exportar dados** e **Apagar dados**); `/privacidade`. Testado no Supabase real e na prévia
   `site-chaido-git-trabalho-chiado.vercel.app`.
3. **Contador de visitas dentro do painel (NO AR desde 13/10/2026):** tela `#/visitas` com visitas hoje, 7 e 30 dias, por dia, por origem
   (instagram/bio, anúncio pago, Google, direto), por página de entrada e conversão em lead. Migração `0002_visitas.sql` **já aplicada** no
   Supabase e verificada (13/10/2026). Equipe se exclui abrindo o site uma vez com `?nao_contar=1`. Seção "Contagem de visitas" na `/privacidade`.
4. **Origem na mensagem do WhatsApp (`trabalho`):** quem entra por link com UTM (ex.: bio do Instagram) e clica em um botão de WhatsApp do site envia
   "(origem: instagram/bio)" na mensagem. Só vale no oficial depois do "podemos colocar no ar".
5. **Keep-alive do Supabase (`trabalho`):** `api/keep-alive.js` + cron diário; só roda em Produção, então só funciona sozinho depois do "podemos colocar no ar".
6. **Medição de visitas da Vercel (`main`, no ar):** Vercel Web Analytics (plano Hobby, sem UTM).

**Onde paramos (13/10/2026):** tudo do painel, do contador de visitas e do aviso por e-mail está construído e testado na `trabalho`. A
medição de visitas da Vercel já está no ar (`main`). Falta **colocar o painel no ar**, e isso depende de decisões e ações suas (itens 2 a 4 abaixo).
Material pronto para apresentar/enviar: `docs/orcamento-infraestrutura-site-chiado.pdf` (US$ 45/mês) e
`docs/politica-privacidade-para-revisao-juridica.pdf` (para o advogado). Os anúncios do Instagram vão direto ao WhatsApp Business (não passam pelo site).

**O que ficou pendente, nesta ordem**
1. ~~**Resend (e-mail de aviso de lead)**~~ **FEITO em 07 e 09/10/2026:** DNS verificado, variáveis na Vercel e aviso testado e
   recebido nos dois e-mails. (Texto original: adicionar DNS no Registro.br, verificar, criar a chave e colar as três variáveis.)
   Detalhes na seção 7 (entradas de 05/10 e 07/10 a 13/10/2026).
2. **Plano do Supabase** (o gratuito pausa por inatividade, e já pausou uma vez; Pro US$ 25/mês; decisão atual: seguir no gratuito com o
   keep-alive e rever antes de ir ao ar), **Vercel Pro** (o Hobby não é para uso comercial; US$ 20/mês por assento) e **advogado** lendo a
   `/privacidade` (levar o PDF `docs/politica-privacidade-para-revisao-juridica.pdf`, que lista 13 pontos de dúvida).
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
| `assets/hero-slides.js`, `assets/carmo-capa-pessoas.mp4`, `assets/carmo-capa-pessoas-celular.mp4`, `assets/carmo-capa.mp4`, `assets/carmo-capa-1..5.(jpg|webp)` | Capa em movimento da página do Carmo (vídeo com pessoas no computador, versão leve no celular, fotos em apresentação como reserva); só aparece em quem tem `capa_video`/`capa_slides` no JSON |
| `assets/detalhe-destaque.js`, `assets/plantas/` | Página "destaque" (`layout: destaque`) e as plantas das casas do Carmo |
| `assets/utm.js`, `assets/lead-form.js`, `data/consentimento.json` | Formulário de interesse, origem da visita e texto de consentimento (`v1`) |
| `api/lead.js`, `api/_lib/*.js` | Recebe o lead (`POST /api/lead`): validação, anti-robô, Supabase e e-mail (Resend) |
| `api/painel-config.js` | Entrega ao painel a URL e a chave **pública** do Supabase |
| `api/visita.js`, `api/_lib/visita.js` | Contador de visitas (`POST /api/visita`): uma por sessão, na página de entrada; só somas por dia, página e origem (sem IP, nome ou cookie). Ignora robôs e prévias de link, só aceita caminhos conhecidos (`/`, `/privacidade`, `/imovel/<slug>`) e responde 204 mesmo se o banco falhar. Grava com `registrar_visita` (migração `0002_visitas.sql`, tabela `visitas_diarias`) |
| `painel/js/tela-visitas.js` | Tela `#/visitas` do painel: visitas hoje, 7 e 30 dias, por dia, por origem, por página de entrada e conversão (leads ÷ visitas em 30 dias) |
| `assets/utm.js` | Guarda a origem da visita na sessão, manda a contagem para `/api/visita` e acrescenta "(origem: ...)" às mensagens dos botões de WhatsApp. Opt-out da equipe: abrir o site uma vez com `?nao_contar=1` (e `?nao_contar=0` desfaz); vale só para aquele navegador e aquele endereço (a prévia e o site oficial são separados); ou `localStorage.setItem('chiado_nao_contar','1')` no console |
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
- **Capa em movimento (17/10/2026):** se o empreendimento tem `capa_slides` (lista de fotos com `src`, `webp` e `foco`, a parte da foto que fica à vista), `render.js` monta a
  capa com as fotos empilhadas e `hero-slides.js` troca uma a cada 5,5 s (fade de 1,4 s e zoom lento). Se tem também `capa_video` (MP4), no computador (largura acima de 760 px) o vídeo entra por cima quando começa a tocar e as fotos param;
  no celular entra `capa_video_celular` (versão leve), se existir (desde 18/10/2026); sem ele, ficam as fotos. Com "economizar dados", só as fotos; com "reduzir movimento", só a primeira foto parada.
  Empreendimento sem esses campos (hoje o Garrett) continua com a capa antiga, uma foto só. Os campos aparecem no `/admin` ("Vídeo da capa", "Vídeo da capa para celular", "Aviso pequeno sobre a capa" e "Capa em apresentação").
  Hoje o Carmo usa o vídeo com pessoas (`carmo-capa-pessoas.mp4`, 20 s, 3,3 MB; celular: `carmo-capa-pessoas-celular.mp4`, 1280×720, 1,4 MB), feito das 5 cenas de `midia/carmo-videos/videos/`.
  O primeiro vídeo do Carmo, só com fotos (27 s, 1920×1080, 3,9 MB, sem som, `carmo-capa.mp4`, guardado como reserva), foi gerado das 5 imagens por script (ffmpeg e sharp numa pasta temporária fora do repositório; nada disso está no projeto).
  Para refazer: precisa do ffmpeg; os cortes 16:9 de cada foto usam um foco vertical (fachadas 62%, piscina base, varanda 66%, sacadas 42%) e a transição é fade de 1,2 s entre cenas de 6,5 s, com zoom lento de 7%. Ordem das cenas: fachada de frente, fachada de lado, piscina, varanda, sacadas. Codificação em duas passadas a 1150 kb/s (dá cerca de 4 MB).
- **Página "destaque" (17/10/2026):** empreendimento com `"layout": "destaque"` usa `assets/detalhe-destaque.js` (seções escuras e claras, classes `dd-` no `style.css`); `render.js` monta as partes comuns
  (capa, diferenciais, unidades, galeria) e entrega a ele. Cada seção nova só aparece se tiver dados (`sobre`, `caracteristicas`, `plantas`, `mapa`, `obra`). O mapa do Google só carrega no clique.
  Sem o campo, vale a página antiga (hoje o Garrett). Detalhes no desenho `docs/superpowers/specs/2026-10-17-pagina-destaque-design.md`.
- **Versão nos arquivos da página do imóvel (18/10/2026):** `imovel.html` carrega `style.css`, `hero-slides.js`, `detalhe-destaque.js` e `render.js` com `?v=AAAAMMDD`, porque a Vercel
  manda o navegador guardar CSS/JS por 1 dia (o usuário via a versão antiga na prévia). **Ao mudar um desses arquivos, trocar o número em `imovel.html`.**
- Sem build e sem `package.json`: HTML/CSS/JS puros e funções da Vercel que usam só `fetch`.
- Testes automáticos: `node --test` na raiz (sem instalar nada; 82 testes, 76 passam e 6 são pulados porque precisam de
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

## 5. Painel de leads (NO AR desde 13/10/2026; o texto desta seção foi escrito antes de publicar)

- Parte 1 de 5 do plano "painel da Chiado": **captar leads e acompanhar a venda**. As outras, nesta
  ordem: 2 acessos do site → 5 tráfego pago → 3 divulgação → 4 impulsionar vendas.
- Desenho: `docs/superpowers/specs/2026-10-03-painel-leads-design.md`. Plano executado:
  `docs/superpowers/plans/2026-10-03-painel-leads-plano.md` (Tarefas 0 a 9).
- Decisões: painel próprio em `/painel`, banco **Supabase em projeto novo só do Chiado** (o Financeiro usa outro
  projeto, nunca misturar dados nem chaves), avisos por e-mail e painel (WhatsApp numa segunda fase), funil
  Novo → Contatado → Visita agendada → Proposta → Vendido (+ Perdido), lead com o mesmo telefone não duplica
  (soma `retornos`).
- **Estado (03/10/2026):** Tarefas 1 a 8 do plano **construídas e testadas** na branch `trabalho` (à frente do `main`: veja `git log --oneline origin/main..trabalho`); a Tarefa 9 (verificação final) foi feita, falta decidir/fazer os itens abaixo antes de ir ao ar.
  *(Escrito antes de publicar: então o `main` ainda não tinha o formulário, o `/painel` nem o `/privacidade`. Agora tem.)*
- **O que existe:** banco no Supabase (projeto `Chiado Leads`, organização `Chiado Site`, São Paulo) com
  `supabase/migrations/0001_leads.sql` aplicada e o usuário William liberado em `usuarios_painel`; funções
  `/api/lead`, `/api/painel-config` e `/api/sitemap` (com `/privacidade`); formulário "Quero saber mais" na home e nas
  páginas dos imóveis; painel `/painel` (login, lista com 4 números e filtros, exportar CSV, ficha do lead com
  fase/anotações/histórico, "Dados da pessoa" com exportar e apagar); `/privacidade`; 82 testes automáticos
  (`node --test`: 76 passam, 6 pulados que precisam de chaves: `tests/rls.test.mjs`).
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
- ~~Frase sobre a medição de visitas em `/privacidade`~~ **feita** (seção "Contagem de visitas", 13/10/2026); o advogado ainda deve revisar a redação.
- **Painel de leads, opcionais:** segundo usuário sem permissão no Supabase real para ver a mensagem de bloqueio;
  `tests/rls.test.mjs` com chaves de teste no terminal do usuário; paginar a lista quando passar de 1000 leads (limite
  padrão do Supabase); aviso por WhatsApp; atribuir leads a vários vendedores (o campo `atribuido_a` já existe);
  apagamento automático de leads antigos.
- Cadastrar `sitemap.xml` no Google Search Console (ação do usuário, na conta Google dele).
- Testar a prévia do link no WhatsApp com o site já publicado.
- Opcionais do site: reduzir o escopo do login do painel `/admin` (hoje `repo,user`) e adicionar `state` — risco de
  travar o acesso; legenda no vídeo do Garrett; tirar o `?slug=` duplicado do redirect; medição oficial do PageSpeed
  (a cota gratuita estava esgotada); limite de tamanho de imagem no `admin/config.yml`.
- **Ideias combinadas, ainda não construídas** (cada uma pede desenho e "pode construir"): dados práticos nos cards dos empreendimentos (entrada,
  renda necessária, distância do mar, ano de entrega) e selo de status com "atualizado em" (inspirado em Murray Lançamentos e HLA Construtora; falta
  decidir o que mostrar publicamente); blog como projeto à parte; textos prontos do WhatsApp Business (saudação, ausência, respostas rápidas do Garrett
  e do Carmo e uma mensagem pré-preenchida diferente por anúncio); `va-disable` para o Vercel Analytics ignorar as visitas da equipe (exigiria mudança no `main`).
- **Perfil somente leitura para quem só acompanha o painel** (hoje todo usuário liberado pode apagar e exportar); pede desenho e "pode construir".
- **Referência da GMV (17/10/2026): CONSTRUÍDA na página "destaque" do Carmo** (faixa, obra, mapa, plantas, visual escuro/claro, outros empreendimentos). Faltam: ~~as imagens das plantas~~ (feitas em 18/10/2026; pedir ao arquiteto a correção dos rótulos das garagens das casas 2 e 5), os **percentuais da obra**,
  confirmar se são **3 banheiros**, e decidir se o **Garrett** também passa ao estilo novo. Ficaram fora (pedem desenho próprio): "baixar o book" e "Cliente final ou Corretor". Texto original da ideia: faixa de características com ícones
  (dormitórios, banheiros, m², vagas; faltam os números do Carmo); andamento da obra com barras por etapa e total (faltam os percentuais e quem atualiza); mapa "Explore a região"
  (falta a localização exata); plantas por unidade com zoom (faltam as imagens); botão "baixar o book" que capta o contato (falta o PDF; ele não pode ficar em `site/` aberto);
  campo "Cliente final ou Corretor" no formulário (mexe no banco e no painel); visual escuro alternando com seções claras e cards arredondados. Sugestão de começar por características, obra e mapa.
- **Capa do Carmo:** decidida em 18/10/2026: vídeo com pessoas nas 5 cenas (`site/assets/carmo-capa-pessoas.mp4`), aprovado pelo usuário na prévia ("ficou ótimo"); a marca d'água "© 2025 Google" da varanda e das sacadas já foi apagada (17/10/2026); o ideal ainda é pedir os renders originais sem ela a quem fez o 3D.
  Depois de ir ao ar, o campo de vídeo já aparece no `/admin`.
- **Opções para antecipar valor sem esperar o painel:** publicar só no `main`, em pacote separado, o `utm.js` (origem no WhatsApp) e/ou um keep-alive mínimo.
- Anotado: `OAUTH_CLIENT_SECRET` aparece na Vercel com "Needs Attention" (valor sem proteção Sensitive); ver com calma.
- No ar, repetir `?nao_contar=1` em cada navegador da equipe no endereço oficial (`https://www.chiadoconstrutora.com.br/?nao_contar=1`).
- Próximos projetos do plano maior: **2 acessos do site** (feito em parte: Vercel Analytics no `main` e contador próprio na `trabalho`), 5 tráfego pago
  (hoje: anúncios no Instagram direto ao WhatsApp), 3 divulgação, 4 impulsionar vendas (cada um com desenho e "pode construir" próprios).

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
- **Ajustes no painel (13/10/2026, na `trabalho`):** o contador "aguardando contato" passou de horas para dias (`textoAguardando`, commit `24fdf98`);
  na ficha do lead, botões separados **Exportar dados** e **Apagar dados** (commit `e9ce098`; o link "Dados da pessoa" do menu continua para buscar
  outra pessoa); a origem do visitante vai na mensagem de WhatsApp dos botões do site (`utm.js`, commit `48f10e4`; link da bio do Instagram:
  `https://www.chiadoconstrutora.com.br/?utm_source=instagram&utm_medium=bio`; só vale no oficial depois do "podemos colocar no ar").
- **Contador de visitas próprio, dentro do painel (pedido "pode construir a opção 2", 13/10/2026).** Motivo: dar a quebra por origem (instagram/bio,
  anúncio pago, Google, direto) que no Vercel Analytics exigiria Pro + Web Analytics Plus (US$ 10/mês). Feito: migração `supabase/migrations/0002_visitas.sql`
  (tabela `visitas_diarias`; função `registrar_visita` só para `service_role`; 500 combinações novas por dia no máximo, o excesso vira "outros"; leitura só
  para `usuarios_painel`), `site/api/visita.js` + `_lib/visita.js`, contagem em `utm.js`, tela `#/visitas` (link "Visitas" no menu), seção "Contagem de
  visitas" na `/privacidade`. Testes: 77 no total (71 passam, 6 pulados), mais `banco-cenarios.mjs` com **57 cenários** (15 novos). Conferido no navegador
  com servidores simulados: o beacon chega em `/api/visita`, só 1 visita por sessão, e a opção de não contar funciona. **Migração 0002 aplicada no Supabase pelo usuário (13/10/2026) e verificada:** a tabela existe (leitura anônima devolve lista vazia pelas regras de acesso) e `registrar_visita` nega execução a anônimo (42501). Uma visita de teste (origem `teste-claude / teste`, página `/privacidade`) apareceu na tela Visitas do painel da prévia: o contador funciona de ponta a ponta. Para limpar o teste: `delete from public.visitas_diarias where fonte = 'teste-claude';`. Os números podem diferir do Vercel Analytics. Material do advogado (`docs/politica-privacidade-para-revisao-juridica.pdf`) regenerado com a nova seção.
- **Onde parou:** item 1 de "Antes de colocar no ar" feito (Resend). Faltam os itens 2 a 6 da seção 5 (no item 2, a decisão atual é ficar no
  plano gratuito do Supabase com o keep-alive, e rever o Pro antes de ir ao ar). Medição de visitas no ar; keep-alive pronto na `trabalho`.

### 13/10/2026, no ar
- **Colocado no ar** por ordem do usuário ("podemos colocar no ar"), seguindo o roteiro: `git fetch`, conferido que o `main` (em `61b86b6`) não tinha nada novo
  além da `trabalho` (nenhuma edição do `/admin`), árvore limpa e 78 testes sem falhas (72 passam, 6 pulados), e `git push origin HEAD:main` como avanço simples
  (`61b86b6..ddb4082`; 34 commits). Sem merge forçado.
- **Conferido no ar (www.chiadoconstrutora.com.br):** `/`, `/imovel/carmo`, `/imovel/garrett`, `/privacidade`, `/painel/`, `/sitemap.xml` (inclui `/privacidade`) e
  `/robots.txt` respondem 200; `GET /api/lead` e `GET /api/visita` dão 405 (só aceitam POST); `GET /api/keep-alive` dá `{"ok":true}` 200, o que prova que as
  variáveis de Produção chegam ao Supabase; o formulário e o `utm.js` (com a contagem) estão na home; o painel tem `X-Robots-Tag: noindex`; consentimento `v1`;
  `/README-VERCEL.md` dá 404 (o guia fica em `docs/`).
- **NÃO verificado no ar (precisa do usuário):** um lead de verdade enviado pelo celular no site oficial (grava no painel e o e-mail de aviso chega); login no
  `/painel` do site oficial; a visita de verdade aparecendo em Visitas; o cron diário do keep-alive disparando (só se vê no dia seguinte, nos Logs da Vercel).
- **Decisões que seguem em aberto, mesmo com o site no ar:** plano do Supabase (segue o gratuito, com keep-alive; já pausou uma vez), Vercel Pro (o Hobby não é para
  uso comercial), revisão do advogado da `/privacidade` (PDF pronto em `docs/`), e **apagar os leads e as visitas de teste** que estão no mesmo banco:
  `truncate public.leads, public.envios_recentes cascade;` e `delete from public.visitas_diarias where fonte = 'teste-claude';`.
- **Como voltar atrás:** na Vercel, *Overview → Instant Rollback* (volta o site ao deploy anterior, de antes do painel); no git, `git revert` do(s) commit(s) no `main`.
- Cadastrar o `sitemap.xml` no Google Search Console e abrir `https://www.chiadoconstrutora.com.br/?nao_contar=1` em cada navegador da equipe continuam como ações do usuário.

### Ajustes depois de ir ao ar (13/10/2026)
- **Publicado no ar em 13/10/2026 (segundo "podemos colocar no ar")**: o `main` foi para `44518dd` (avanço simples, sem nada novo do `/admin`); conferidos no oficial
  `/`, `/painel/`, `/privacidade`, `/imovel/carmo`, `/sitemap.xml`, o menu novo (`ui.js` e `painel.css`), `keep-alive` ok, `GET /api/visita` 405 e o resumo não público (404).
  Neste ponto `main` e `trabalho` estão iguais.
- **Menu do painel:** a aba **Visitas** passou a ficar ao lado de **Leads** (grupo da esquerda), com a aba atual sublinhada em dourado; "Dados da pessoa" e "Sair"
  ficaram à direita e os itens do topo não quebram mais de linha no celular (`site/painel/js/ui.js` e `painel.css`, commit `63e543c`). Testado no painel simulado;
  78 testes sem falhas (72 passam, 6 pulados). (Na hora estava só na prévia; **foi publicado logo em seguida**, veja a linha "Publicado no ar em 13/10/2026 (segundo ...)" acima.)
- Regra reforçada pelo uso: depois de ir ao ar, o fluxo continua o mesmo (mudar na `trabalho`, testar na prévia, esperar o "podemos colocar no ar" para o `main`);
  o `/admin` continua gravando direto no `main`, então o "puxe do github" confere o `main` antes de qualquer publicação.

- **Botão "Quero saber mais" (13/10/2026, NO AR):** o usuário não achava o formulário no site oficial: ele existe (conferido em navegador limpo), mas fica no meio da
  home e nenhum item de cima levava até ele ("Contato" e "Fale conosco" vão ao WhatsApp). Acrescentado o link **Quero saber mais** (`#interesse`) no menu da home e da página dos
  imóveis e um botão no início da home, ao lado de "Ver Residencial Garrett/Carmo" (`site/index.html`, `site/imovel.html`). Testado no navegador (computador e celular): leva ao
  formulário, o menu do celular fecha ao clicar. **Publicado no oficial (terceiro "podemos colocar no ar" do dia, `main` em `91aa9ad`, avanço simples, nada novo do `/admin`)**; conferido no ar: home, imóveis, privacidade, painel e sitemap
  com 200, 2 links `#interesse` na home, 1 no menu do Carmo, keep-alive ok, e o clique do botão no site real desce até o formulário. Se alguém ainda não vir o formulário, pode ser versão antiga no navegador (atualização forçada).

- **Contador só conta no site oficial (13/10/2026, NO AR):** as visitas feitas na prévia da Vercel e em testes estavam sendo somadas às reais (mesmo banco). Agora o
  navegador (`utm.js`, `enderecoContavel`) só manda a visita se o endereço for `www.chiadoconstrutora.com.br` ou `chiadoconstrutora.com.br`, e o servidor (`api/visita.js`,
  `hostContavel`) também ignora qualquer outro endereço (204, sem gravar). `VISITA_HOSTS` (variável, só para testes/simulações; o servidor de simulação usa `localhost:4173`)
  permite endereços extras. 82 testes (76 passam, 6 pulados). **Publicado no oficial (quarto "podemos colocar no ar" do dia, `main` em `ee80abf`, avanço simples, nada novo do `/admin`).** Conferido no ar: home, Carmo, privacidade, painel e sitemap 200; o script
  oficial tem a trava; keep-alive ok; `GET /api/visita` 405; um POST vindo da prévia dá 204 (ignorado). **O usuário zerou a tabela de visitas no Supabase** (`truncate public.visitas_diarias;`)
  para tirar os testes; a aba Visitas deve mostrar 0 até chegarem visitas reais do oficial. Antes de divulgar o link da bio, abrir `?nao_contar=1` nos aparelhos da equipe.

### Segundo usuário do painel (13/10/2026)
- Criado no Supabase (*Authentication → Users*, com "Auto Confirm User") e liberado em `usuarios_painel` o usuário **`contato@chiadoconstrutora.com.br`**, para uma segunda pessoa
  acompanhar o painel. A senha foi definida pelo usuário e **não está em nenhum arquivo nem no chat**. Na primeira tentativa o `insert` não achou o e-mail (nenhuma linha entrou, e o
  Supabase mostrou "Success" mesmo assim); resolvido conferindo `auth.users` e refazendo com o e-mail exato; depois o usuário confirmou que deu certo. Agora há **2 usuários** no painel
  (o do usuário William, `cv.cvwill@gmail.com`, e este).
- **Cuidado combinado:** o acesso é total (inclui apagar leads). Se o objetivo for só acompanhar, a opção é construir um perfil **somente leitura** (regra nova no banco e ajuste dos botões do
  painel; esforço médio; pede "pode construir"). Ainda não foi pedido.

### 17/10/2026 (na `trabalho`, ainda NÃO no ar)
- **"puxe do github":** a `trabalho` trouxe 20 commits do outro computador (tudo o que está nas entradas de 13/10/2026); o `main` não tinha nada que a `trabalho` não tivesse (nenhuma edição do `/admin`);
  existe a branch `analytics-visitas` no GitHub (sem commits além da `trabalho`; parece sobra, não apagada).
- **Conversa:** o usuário mandou o site da GMV Incorporadora (`gmvincorporadora.com.br`) e a página de um empreendimento (`empreendimento.php?id=62`, Costa Esmeralda) como referência. Analisado:
  capa com vídeo de fundo em tela cheia (loop, sem som) sob título grande; seções escuras (`#0d0d0d`) e claras (`#ededed`) alternadas; cards verticais arredondados com a foto inteira; página do empreendimento com
  capa, sobre, galeria, plantas por unidade, mapa, andamento da obra (barras e total), formulário "Cliente final / Corretor" e carrossel de outros empreendimentos. O usuário perguntou se dava para fazer no Carmo (resposta:
  sim, tabela de esforço na seção 6) e, sem ter vídeo, mandou 5 imagens do Carmo.
- **Mal-entendido:** o usuário queria **um arquivo de vídeo** como o da GMV. Primeiro foi feita uma apresentação de fotos feita pelo site (`capa_slides`); ele disse que pedira um vídeo. Com a autorização dele ("só gera o vídeo")
  baixei o `ffmpeg-static` (npm, numa pasta temporária fora do projeto) e gerei o MP4. Lição: quando o usuário pede "vídeo", é arquivo de vídeo; confirmar antes de trocar por outra solução.
- **Feito:** 5 imagens reduzidas a 1600 px (jpg+webp, 100 a 275 KB cada, `carmo-capa-1..5`); `site/assets/hero-slides.js`; `render.js` (capa com `capa_slides` e `capa_video`), `style.css`, `imovel.html` (script novo),
  `admin/config.yml` (campos "Vídeo da capa" e "Capa em apresentação") e `data/empreendimentos.json` (só o Carmo recebeu os campos). Vídeo `carmo-capa.mp4`: 27 s, 1920×1080, 3,9 MB. Conferido no navegador de teste (computador e celular, sem rolagem lateral):
  o vídeo toca (readyState 4, sem erro) e as fotos servem de alternativa. 82 testes (76 passam, 6 pulados). O Garrett não mudou. Foco da foto da piscina corrigido para mostrar a água.
- **Onde parou (primeira parte do dia, já superado; ver o último item desta entrada):** o usuário ainda não viu a capa na prévia (pediu "como eu vejo"; o vídeo foi enviado na conversa e a prévia da Vercel depende do "envie para o github"). Próximo: ver, ajustar (ordem, velocidade, escuro/claro, texto sobre as fotos) e escolher
  o que vem da referência da GMV (seção 6). Nada disto foi para o `main`.
- **Marca d'água apagada (mesmo dia):** a marca "© 2025 Google" (o fundo dos renders veio do Street View) foi apagada da varanda e das sacadas, preenchendo o céu em volta. As fotos `carmo-capa-4` (varanda) e `carmo-capa-5` (sacadas)
  foram trocadas (jpg e webp) e o vídeo `carmo-capa.mp4` foi refeito (27,7 s, 1920×1080, 4,0 MB); as versões limpas em tamanho original ficaram em `midia/carmo-videos/fotos/` (dentro do projeto, fora de `site/`, não é público). Conferido: vídeo toca na página no computador, fotos no celular, 82 testes (76 passam, 6 pulados).
- **Pessoas no vídeo (primeiro plano, depois trocado pela opção grátis do item "Cenas com pessoas" abaixo):** o usuário quer cenas com gente (passando em frente, na piscina, na sacada). Não dá para fazer aqui com qualidade; combinado: ele gera trechos numa IA de imagem para vídeo (Kling, Runway ou Veo; textos sugeridos na conversa:
  fachada de frente com pessoas na calçada, fachada de lado com casal no portão, piscina com gente, varanda com casal) e põe em `midia/carmo-videos/videos/` (a pasta tem `fotos` com as 5 imagens originais numeradas e um `LEIA-ME.txt` com os textos de cada cena); depois eu confiro, monto e troco a capa, com a frase "imagens ilustrativas". A imagem das sacadas fica só como foto.
- **Página do Carmo no estilo da GMV (mesmo dia, "pode construir, mas não publique nada antes de vermos"):** feita a página "destaque" (ver seção 3 e o desenho `2026-10-17-pagina-destaque-design.md`).
  Carmo com `layout: destaque`, `bairro`, 3 parágrafos de `sobre` (só com fatos que já estavam no site), 5 características (5 casas triplex, 2 suítes, lavabo, 92 a 103 m², 1 ou 2 vagas) e `mapa`;
  `plantas` e `obra` vazios (as seções ficam escondidas até chegarem os dados). Campos novos no `/admin`. A foto da galeria `carmo-varanda` (que é a das sacadas) também foi trocada pela versão sem a marca do Google.
  Conferido no navegador: computador e celular (sem rolagem lateral), vídeo da capa, formulário, mapa carregando no clique, obra e plantas com dados de exemplo (não salvos), Garrett sem mudança; 82 testes (76 passam, 6 pulados).
  Criado `.claude/launch.json` (servidor de simulação do formulário na porta 4173) para abrir o site no navegador do app.
- **Cenas com pessoas, de graça (mesmo dia):** geradas no Hugging Face (página pública "Wan 2.2 I2V 14B Fast", `zerogpu-aoti/wan2-2-fp8da-aoti-faster`, sem conta, sem marca d'água; modelo Wan 2.2 com licença Apache 2.0)
  a partir das fotos 16:9 de `midia/carmo-videos/fotos-16x9/`: fachada de frente (duas pessoas e um cachorro, 5 s), fachada de lado (casal e ciclista, 5 s) e piscina (uma pessoa nadando, 3 s; a 5 s já não cabia na cota), em `midia/carmo-videos/videos/` (832×480, 16 qps). Prédio, portão e letreiro ficaram fiéis; a IA não pôs a mulher na espreguiçadeira.
  Por que não Kling: o grátis tem marca d'água, baixa resolução e não permite uso comercial; o pago custa cerca de US$ 10 por mês (conferido em sites de terceiros, 17/10/2026). Rodar no computador (AMD RX 9070 XT) é possível mas instável no Windows.
  Como gerar: abrir no Chrome a página do Hugging Face, enviar a foto de `fotos-16x9/`, colar o texto em inglês da cena, duração 5 s, "Generate Video", baixar o MP4 do resultado.
  A **cota grátis sem conta acabou** depois de 3 cenas ("Try again in 24h"; com uma conta grátis do Hugging Face, feita pelo usuário, a cota aumenta). **Faltam varanda e sacadas** com pessoas
  (o usuário pediu também as sacadas; ideias: casal na grade da varanda com café; alguém saindo na sacada de cima e outra pessoa na poltrona de baixo). A foto `fotos-16x9/5-sacadas.jpg` já está pronta.
  Rascunho montado: `midia/carmo-videos/carmo-capa-com-pessoas-rascunho.mp4` (20 s, 1920×1080, 3,3 MB; as 3 cenas com pessoas + varanda e sacadas como fotos animadas). **Ainda não substitui a capa**; o usuário vai ver e decidir.
- **Onde parou (fim do dia 17/10/2026):** nada no `main`; tudo enviado à `trabalho` no GitHub no fim do dia (prévia: `site-chaido-git-trabalho-chiado.vercel.app/imovel/carmo`). Em aberto, nesta ordem: (1) o usuário ver a página destaque e o rascunho com pessoas
  (no computador: `http://localhost:4173/imovel.html?slug=carmo` com o servidor de simulação, ou a prévia da Vercel depois do envio); (2) gerar varanda e sacadas com pessoas quando a cota renovar e remontar o vídeo;
  (3) decidir se o rascunho vira a capa (trocar `site/assets/carmo-capa.mp4`) e pôr "imagens ilustrativas"; (4) dados do Carmo: plantas, percentuais da obra, book, 3 banheiros?; (5) Garrett no estilo novo?
  **No outro computador:** as ferramentas de vídeo (ffmpeg-static, sharp) ficavam numa pasta temporária, não no projeto; para remontar o vídeo é preciso instalá-las de novo numa pasta temporária (`npm install ffmpeg-static sharp`).
  **Cuidado:** se alguém editar o Carmo pelo `/admin` antes de isto ir ao ar, o JSON do `main` muda e o "puxe do github" vai precisar juntar com cuidado (`site/data/empreendimentos.json`).

### 18/10/2026 (na `trabalho`, ainda NÃO no ar)
- **Cenas que faltavam com pessoas:** com a cota grátis renovada, geradas a varanda (casal com café; a mulher senta na poltrona) e as sacadas (mulher sai na sacada de cima), 5 s cada, em `midia/carmo-videos/videos/`.
  O Chrome não estava conectado, então a geração foi feita direto pela interface de programação da página do Hugging Face (`/gradio_api`), com o script `tests/ferramentas/gerar-cena-video.mjs`
  (uso: `node gerar-cena-video.mjs <foto.jpg> <saida.mp4> <segundos> "<texto>"`; precisa só do Node; a cota é a mesma, por endereço de internet).
- **Vídeo completo:** `midia/carmo-videos/carmo-capa-com-pessoas.mp4` (20 s, 1920×1080, 3,3 MB): fachada de frente, fachada de lado, piscina (3 s em câmera lenta), varanda e sacadas, todas com pessoas, transição de 1 s.
  O rascunho de 17/10 foi apagado (substituído). **Ainda não é a capa do site**: se o usuário aprovar, copiar para `site/assets/carmo-capa.mp4` e pôr "imagens ilustrativas" sobre a capa.
- **Onde parou (meio do dia 18/10/2026, já superado; ver o último item):** o usuário viu o vídeo e disse **"quero ajustar o vídeo antes de usar na capa"**, sem dizer ainda o quê. Opções oferecidas: ordem das cenas, tempo de cada cena,
  refazer uma cena com outro texto (gasta a cota grátis, cerca de 3 cenas por dia), transição, brilho/contraste/tom e emenda suave do fim com o começo (o vídeo repete na capa).
  Tudo de hoje (cenas, vídeo completo, script e textos) foi enviado à `trabalho` no GitHub em 18/10/2026; nada dentro de `site/` mudou, então a prévia ficou igual. Nada no `main`.
- **Vídeo com pessoas na capa da prévia (mesmo dia, pedido do usuário "colocar o vídeo na capa da prévia pra ver como fica"):** copiado para `site/assets/carmo-capa-pessoas.mp4` e o Carmo passou a usar
  `capa_video: assets/carmo-capa-pessoas.mp4` (o vídeo antigo, só com fotos, continua em `site/assets/carmo-capa.mp4` para voltar se quiser). Campo novo `capa_nota` ("Imagens ilustrativas"), mostrado pequeno no canto de cima
  da capa da página destaque e editável no `/admin` ("Aviso pequeno sobre a capa"). No celular a capa continua com as fotos (sem pessoas). Conferido no navegador local: o vídeo toca no computador e a frase aparece; 82 testes (76 passam, 6 pulados).
  O usuário viu na prévia (no computador) e disse **"ficou ótimo"**. Ainda NÃO no ar: falta o "podemos colocar no ar" (e, antes, decidir o que mais da página destaque entra).
- **Galeria em carrossel lateral (mesmo dia, pedido do usuário, "igual naquele site"):** a galeria da página destaque deixou de ser grade e virou carrossel que desliza para o lado,
  como o da GMV (que usa Owl Carousel; aqui é rolagem nativa, sem biblioteca): no computador 2 fotos e um pedaço da terceira, setas e arrastar com o mouse; no celular 1 foto e um pedaço da próxima,
  arrastando com o dedo. Tocar na foto continua abrindo a foto ampliada. Código em `detalhe-destaque.js` (`iniciarCarrossel`) e `style.css` (`.dd-carrossel`, `.dd-trilho`, `.dd-seta`). Enviado à prévia; o usuário não via a mudança
  por causa do cache do navegador, resolvido com o número de versão nos arquivos (ver seção 3).
- **Plantas das 5 casas (mesmo dia):** o usuário mandou as plantas humanizadas (`Downloads/Mídia RES. CARMO/Plantas Humanizadas`, só neste computador): para cada casa, Térreo (garagem), 1º e 2º pavimento,
  15 imagens. Reduzidas a até 1800 px em `site/assets/plantas/carmo-casaN-{terreo,1pav,2pav}.{jpg,webp}` (30 a 185 KB cada). No JSON, `plantas` ganhou o campo `grupo` ("Casa 1"...),
  também no `/admin`. Na página destaque virou uma seção própria "Conheça a planta de cada casa": um botão por casa e os 3 andares em carrossel lateral (3 lado a lado no computador,
  1 e um pedaço no celular), com área e vagas da casa embaixo (vêm de `unidades`) e zoom ao tocar. Versão dos arquivos trocada para `?v=20261018b`. Enviado à prévia.
  **Erros de texto nas imagens do arquiteto (não corrigidos, avisar o usuário):** na planta da garagem da Casa 2 está escrito "Á. EXCL. COBERTA CASA 01" e na da Casa 5, "Á. EXC. COBERTA CASA 02". (Avisado ao usuário.)
- **Onde parou (fim do dia 18/10/2026):** tudo enviado à `trabalho` e na prévia (commit das plantas: `7fca7f4`); nada no `main`. O usuário aprovou a capa com pessoas.
  Em aberto: (1) o usuário revisar a página destaque inteira na prévia (carrossel da galeria e plantas são novos); (2) percentuais da obra; (3) book em PDF (pede desenho próprio para liberar só depois do cadastro);
  (4) confirmar 3 banheiros na faixa de características; (5) Garrett no estilo novo?; (6) rótulos errados nas plantas das garagens 2 e 5 (arquiteto); (7) "podemos colocar no ar".
- **Vídeo também no celular (mesmo dia, pergunta do usuário "no celular o vídeo da capa não roda?"):** criada a versão leve `site/assets/carmo-capa-pessoas-celular.mp4` (1280×720, 1,4 MB) e o campo
  `capa_video_celular` (também no `/admin`). `hero-slides.js`: no computador usa `capa_video`; no celular, `capa_video_celular` (se não houver, só fotos); com "economizar dados" ou "reduzir movimento", só fotos.
  No celular o vídeo aparece recortado no meio (tela em pé); as pessoas aparecem. Versão dos arquivos `?v=20261018c`. Conferido no navegador local em tamanho de celular: toca a versão leve, sem erro. Enviado à prévia. Os .md foram revisados e enviados no fim do dia; todas as fotos, vídeos e plantas do projeto estão no GitHub.
  **No outro computador:** as plantas originais e as mídias do Carmo estão só em `Downloads/Mídia RES. CARMO` deste computador; as versões do site já estão no projeto (`site/assets/plantas/`).

## 8. Regras de trabalho

- Só mexer neste projeto; nunca no Site Financeiro (repositório, pasta, banco ou chaves).
- Mudanças em branch própria, com prévia da Vercel; **`main` só com ok explícito do usuário**.
- Commits e explicações em português. Nunca pedir nem receber senhas ou chaves pelo chat.
- **Rotina diária, em 2 computadores, sempre na branch `trabalho`:** começar com "puxe do github" (mostra onde parou e confere se o `main` tem edições do `/admin`) e terminar com "envie para o github" (atualiza este arquivo, faz commit e push **da branch atual**; no `main` o Claude para e pergunta, porque publica o site). Detalhes no `CLAUDE.md`.
- No fim de cada sessão: atualizar a seção 7 (e as seções 4 a 6 se algo mudou) antes de encerrar.

## 9. Como fazer (passo a passo)

### Testes
- **Todos os testes automáticos:** `node --test` na raiz do repositório (82 testes; 6 ficam "pulados" porque pedem chaves).
- **Banco (42 cenários) e telas do painel/formulário sem o Supabase real:** `tests/ferramentas/LEIAME.md`.
- **Acesso ao Supabase real, de fora (opcional):** no terminal do próprio usuário, defina `TESTE_SUPABASE_URL`,
  `TESTE_ANON_KEY` e `TESTE_SERVICE_KEY` e rode `node --test tests/rls.test.mjs`. As chaves nunca vão para o chat nem para arquivos.
- **Na prévia:** depois de cada `git push` da `trabalho`, a Vercel gera `site-chaido-git-trabalho-chiado.vercel.app` em cerca de
  30 segundos; testar `/painel/`, `/privacidade`, o formulário em `/imovel/carmo` e `curl` nas funções `/api/*`.

### Supabase (organização `Chiado Site`, projeto `Chiado Leads`, região São Paulo)
- **Rodar SQL:** ícone `>_` na barra da esquerda (SQL Editor) → *New query* → colar → *Run*. Pode aparecer "Potential issue /
  destructive operations" por causa de um `delete` dentro de uma função: confirmar. Sucesso aparece como "Success. No rows returned".
- **Migração 0002 (visitas):** copiar o conteúdo de `supabase/migrations/0002_visitas.sql`, colar no SQL Editor e rodar (sucesso: "Success. No rows returned"). Conferir: `select count(*) from public.visitas_diarias;` (0 no começo). A `0001` já foi aplicada; nunca rodar de novo.
- **Conferir o banco (esperado 6, 5, 1, 1):** `select (select count(*) from public.fases) as fases, (select count(*) from
  public.motivos_perda) as motivos, (select count(*) from public.textos_consentimento) as consentimentos, (select count(*)
  from public.usuarios_painel) as usuarios;`
- **Ver os leads:** `select criado_em, nome, telefone, empreendimento_slug, fase, origem_fonte, retornos, aviso_email_ok from
  public.leads order by criado_em desc;`
- **Criar um usuário do painel:** *Authentication → Users → Add user → Create new user* (e-mail, senha forte, "Auto Confirm User"
  marcado) e depois liberar: `insert into public.usuarios_painel (user_id, nome) select id, 'Nome' from auth.users where email =
  'email@exemplo.com';` (o "Success" não diz quantas linhas entraram: conferir com `select nome from public.usuarios_painel;`).
  **Se o nome não aparecer**, o e-mail do SQL não bate com o do usuário (maiúscula, espaço, `.com` x `.com.br`): rodar
  `select id, email, email_confirmed_at from auth.users order by created_at desc;`, copiar o e-mail exatamente como está e refazer o `insert` com
  `lower(email) = lower('...')`. Se `email_confirmed_at` estiver vazio, faltou "Auto Confirm User". Teste do acesso: janela anônima em `/painel/`.
  **Hoje todo usuário liberado tem acesso total** (ver tudo, mudar fase, anotar, exportar CSV e **apagar leads**); não existe perfil só de leitura.
  Esqueci a senha: não há tela no painel; o admin redefine em *Authentication → Users → o usuário → Send password recovery*.
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
