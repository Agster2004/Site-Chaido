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
- Não há testes automáticos no repositório. Nas etapas feitas, testei com um servidor local que imita
  as regras do `vercel.json` e com `curl` na prévia da Vercel.

## 4. Feito até agora (03/10/2026)

- **Etapa 1** (no ar, commits `d381e05`, `fb873da`): prévia de compartilhamento por empreendimento,
  imagens e logos menores, lightbox em WebP, cache, redirecionamento.
- **Etapa 2** (no ar, commit `1ac5569`): `sitemap.xml`, `robots.txt`, JSON-LD (construtora na home;
  Residence + BreadcrumbList nos imóveis), link "Pular para o conteúdo", `<main>`, `aria-expanded` no
  menu, ícones com `aria-hidden`, `scroll-margin-top`, correção do `$`.
- Branches `melhorias-etapa1` e `melhorias-etapa2` já foram apagadas (tudo está no `main`). Depois também foram
  apagadas `docs-continuidade` e `painel-leads` (nada se perdeu: tudo está na `trabalho`). Hoje existem só `main`
  (site no ar) e `trabalho` (branch de trabalho nos dois computadores).

## 5. Painel de leads (desenho aprovado e plano escrito; nada construído)

- Parte 1 de 5 do plano "painel da Chiado": **captar leads e acompanhar a venda**. As outras, nesta
  ordem: 2 acessos do site → 5 tráfego pago → 3 divulgação → 4 impulsionar vendas.
- Desenho completo: `docs/superpowers/specs/2026-10-03-painel-leads-design.md` (neste repositório).
- Decisões: painel próprio em `/painel`, banco **Supabase em projeto novo só do Chiado** (o Financeiro
  usa outro projeto, nunca misturar dados nem chaves), usuários começando com 1, avisos por e-mail e
  painel (WhatsApp numa segunda fase), funil Novo → Contatado → Visita agendada → Proposta → Vendido
  (+ Perdido), lead com o mesmo telefone não duplica.
- **Status (03/10/2026, fim do dia):** desenho **aprovado** pelo usuário (ele viu uma simulação visual das telas e
  pediu só trocar o nome do número para "Aguardando contato há +24 h", já feito no desenho). **Plano de
  implementação escrito**: `docs/superpowers/plans/2026-10-03-painel-leads-plano.md` (10 tarefas, 0 a 9; testes
  do código do plano rodados fora do repositório: 39 testes, 33 passaram, 0 falharam, 6 pulados que dependem das
  chaves do Supabase). **Nada foi construído**: só começa quando o usuário disser "pode construir".
- O plano acrescenta ao desenho: tabelas `fases` e `motivos_perda`, coluna `vendido_em` e a variável
  `IP_HASH_SALT` (a Tarefa 0 do plano atualiza o desenho com isso).
- Antes de entrar no ar: decidir o plano do Supabase (Pro: US$ 25/mês pelo plano do Financeiro, valor a
  reconfirmar), assinar a Vercel Pro na equipe Chiado (o plano grátis não permite uso comercial) e revisar a
  `/privacidade` com um advogado. Durante a construção só existe 1 projeto Supabase (o gratuito permite 2 e o
  Financeiro usa 1); os leads de teste são apagados antes de ir ao ar.
- O usuário precisa providenciar: projeto novo no Supabase (região São Paulo), conta no Resend e quem
  controla o DNS de `chiadoconstrutora.com.br`, e-mails do aviso, dados da empresa para `/privacidade`.
  Chaves entram direto na Vercel, **nunca pelo chat**.

## 6. Pendências e próximos passos

- **Painel de leads:** esperar o "pode construir" do usuário. Antes disso, o usuário faz a Tarefa 0 do plano:
  projeto novo no Supabase (organização e projeto só do Chiado, região São Paulo), conta no Resend com o domínio
  verificado (DNS no Registro.br), dados para `/privacidade` (razão social, endereço, e-mail de privacidade),
  e-mails do aviso de lead e do primeiro usuário, e as variáveis na Vercel (Preview e Production).
- Na execução, escolher o modo: uma tarefa por vez com revisão entre elas (recomendado) ou tudo na mesma conversa.
- Cadastrar `sitemap.xml` no Google Search Console (ação do usuário, na conta Google dele).
- Testar a prévia do link no WhatsApp com o site já publicado.
- Opcionais: reduzir o escopo do login do painel `/admin` (hoje `repo,user`) e adicionar `state` — risco de
  travar o acesso; legenda no vídeo do Garrett; tirar o `?slug=` duplicado do redirect; medição oficial do
  PageSpeed (a cota gratuita estava esgotada); limite de tamanho de imagem no `admin/config.yml`.

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

## 8. Regras de trabalho

- Só mexer neste projeto; nunca no Site Financeiro (repositório, pasta, banco ou chaves).
- Mudanças em branch própria, com prévia da Vercel; **`main` só com ok explícito do usuário**.
- Commits e explicações em português. Nunca pedir nem receber senhas ou chaves pelo chat.
- **Rotina diária, em 2 computadores, sempre na branch `trabalho`:** começar com "puxe do github" (mostra onde parou e confere se o `main` tem edições do `/admin`) e terminar com "envie para o github" (atualiza este arquivo, faz commit e push **da branch atual**; no `main` o Claude para e pergunta, porque publica o site). Detalhes no `CLAUDE.md`.
- No fim de cada sessão: atualizar a seção 7 (e as seções 4 a 6 se algo mudou) antes de encerrar.
