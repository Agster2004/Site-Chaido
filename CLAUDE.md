# Site Chiado (institucional) — instruções para o Claude

Este repositório é só o **Site Chiado** (vitrine e captação de clientes da Chiado Construtora). O Site
Financeiro é a gestão financeira da mesma empresa, mas em outro repositório, e **nunca** deve ser
alterado nem misturado com este (código, banco Supabase, chaves, documentos).

O usuário trabalha em **2 computadores**. Por isso o que precisa valer nos dois fica escrito aqui e em
`resumo-tecnico-sessao.md`, que viajam pelo GitHub (a memória do Claude fica só em cada computador).

## Branch de trabalho: `trabalho` (a mesma nos dois computadores)

No Chiado o `main` é o **site no ar**, então o dia a dia **não** acontece nele. Os dois computadores ficam
sempre na branch **`trabalho`**: "puxe" e "envie" movem a `trabalho`, como o usuário faz no Financeiro com o
`main`. A prévia dela fica em `site-chaido-git-trabalho-chiado.vercel.app`. O `main` só recebe a `trabalho`
quando o usuário diz "podemos colocar no ar" (ver Regras).

**Atenção:** o painel `/admin` grava **direto no `main`** (edições de empreendimentos vão ao ar sem prévia).
Essas edições **não aparecem sozinhas** na `trabalho`: o git as guarda em outra branch. Por isso o "puxe do
github" confere o `main` (passo 4) e traz as novidades para a `trabalho`.

## A rotina do usuário (seguir sempre nesta ordem)

1. **"puxe do github"**: traz o que foi feito no outro computador.
2. O usuário manda **ler os `.md`**: ler e dizer onde paramos.
3. Trabalho do dia.
4. **"terminei de trabalhar" / "atualize os arquivos .md"**: salvar nos `.md` tudo que foi feito.
5. **"envie para o github"**: commit e push da branch atual.

Cada passo é independente: se o usuário pedir só um deles, fazer só aquele. Os detalhes de cada passo estão abaixo.

## Comando "puxe do github" (começo do trabalho)

Quando o usuário enviar a mensagem exata **"puxe do github"**, execute automaticamente, sem pedir confirmação:

1. `git fetch --prune` e `git status -sb` (dizer em qual branch está).
2. Se houver alterações locais não commitadas, **não puxe**: mostre o que há e avise (para não sobrescrever nada).
3. `git pull --ff-only` na branch atual. Se a branch ainda não existe no GitHub, diga isso.
4. **Confira o `main`:** `git log --oneline HEAD..origin/main`. Se o `main` tiver commits que a branch atual não
   tem (por exemplo, edições feitas pelo `/admin`), liste-os, diga o que mudou (ex.: `data/empreendimentos.json`)
   e **pergunte** se pode trazê-los (`git merge origin/main`). Em conflito, pare e avise.
5. `git log -1`, e liste branches do GitHub que ainda não existem neste computador, se houver. Se a branch atual
   não for a `trabalho`, avise.
6. Leia a última entrada da seção 7 do `resumo-tecnico-sessao.md` e dê um resumo curto (poucas frases) do que
   foi feito no outro computador e **em que ponto o trabalho parou**.

Vale só para esse gatilho exato e só para fetch/pull sem merge forçado. Não cobre rebase, reset nem outras
operações destrutivas. Se o pull gerar conflito, pare e avise em vez de tentar resolver.

## Comando "envie para o github" (fim do trabalho)

Quando o usuário enviar a mensagem exata **"envie para o github"**, execute automaticamente, sem pedir confirmação:

1. Atualize `resumo-tecnico-sessao.md` (entrada da sessão na seção 7 e, se algo mudou, as seções 4 a 6), para o
   outro computador saber onde parou.
2. `git status`. **Se a branch atual for `main`, pare e pergunte:** no Chiado um push no `main` publica o site
   oficial na hora. Em branch própria, siga.
3. Confira o que vai entrar. **Nunca** adicione chaves, arquivos `.env`, arquivos temporários ou de teste soltos,
   nem nada fora deste projeto; se aparecer algo suspeito, pare e pergunte.
4. `git add` dos arquivos do projeto e `git commit -m "..."`, com mensagem clara em português baseada nas
   alterações (diff/status) e as linhas de atribuição padrão do Claude Code.
5. `git push` (use `git push -u origin <branch>` se a branch ainda não existe no GitHub).

Vale só para esse gatilho exato e só para add/commit/push da **branch atual**. Não cobre force-push, reset,
apagar branch, merge nem push no `main`.

## Rotina de continuidade (todo dia, nos dois computadores)

**Ao começar a sessão** (antes de qualquer outra coisa, mesmo sem o usuário pedir): ler os `.md` do projeto
e dizer em poucas linhas o que foi feito e onde paramos:
- `resumo-tecnico-sessao.md`: estado atual, como o site funciona, pendências e o registro por sessão.
- Os documentos de desenho e plano em andamento, em `docs/superpowers/specs/` e `docs/superpowers/plans/`
  (hoje: `2026-10-03-painel-leads-design.md` e `2026-10-03-painel-leads-plano.md`), e outros `.md` que o
  resumo indicar como ativos.

**Ao terminar o dia** (quando o usuário disser que terminou, que vai parar, ou enviar "envie para o github"):
**atualizar os `.md` antes de encerrar**, para salvar tudo que foi conversado e feito:
- seção 7 do `resumo-tecnico-sessao.md`: o que foi conversado, decidido e feito na sessão, e onde parou;
- seções 4 a 6 do resumo, se algo mudou (feito, painel de leads, pendências);
- o documento de desenho/plano ativo, se alguma decisão mudou.

Assim o próximo dia, em qualquer computador, começa atualizado. Não encerrar a sessão sem isso.

## Ao começar uma mudança
Trabalhe na `trabalho`. Se estiver no `main`, mude para a `trabalho` (`git checkout trabalho`) antes de alterar
qualquer coisa. Uma mudança grande ou experimental pode ter branch própria a partir da `trabalho`, avisando o usuário.

## Regras
- Tudo em português (conversa, commits, documentos).
- **Fluxo de publicação:** trabalhar sempre na `trabalho` (que é a prévia) → enviar a branch → testar tudo na
  prévia da Vercel → o usuário aprova → só então juntar no `main` (o site oficial) e conferir no ar.
  **Nunca juntar no `main` sem ok explícito do usuário.** Depois de juntar, apagar a branch só se o usuário pedir.
- **Gatilho para colocar no ar:** quando tudo estiver feito, testado e validado na branch, o Claude pergunta
  "podemos colocar no ar?", ou o próprio usuário diz **"podemos colocar no ar"** (ou "pode colocar no ar" /
  "pode subir no main"). Essa frase é o ok para juntar **aquela branch** no `main`. Então o Claude:
  1. confere que a branch está atualizada e sem mudanças novas depois da validação (se houver, avisa e pergunta);
  2. traz o `main` para a branch (`git merge origin/main`, por causa das edições do `/admin`), confere de novo
     e só então junta no `main` sem merge forçado (`--ff-only`) e envia;
  3. espera a Vercel publicar, confere o site oficial e conta o resultado, inclusive o que não conseguiu verificar.
  Respostas vagas ("foi", "ok", "beleza") **não** valem como ok para o `main`: nesse caso, perguntar de novo.
  O ok vale só para a branch validada; outra branch pede novo ok. Não se aplica ao Site Financeiro.
- Não construir back-end nem criar contas/serviços sem o usuário dizer "pode construir"; o desenho tem de estar
  aprovado antes. (O "pode construir" do painel de leads, parte 1, foi dado em 03/10/2026; as próximas partes
  — acessos, anúncios, divulgação, impulsionar vendas — pedem desenho e "pode construir" próprios.)
- Nunca pedir nem receber senhas ou chaves pelo chat; o usuário cola as variáveis direto na Vercel.
- **Cada sessão mexe só no seu projeto.** Aqui é só o Site Chiado; não ler nem alterar o Site Financeiro sem o
  usuário autorizar expressamente naquele momento.
- Domínio oficial: `https://www.chiadoconstrutora.com.br`.
- Site sem build: HTML/CSS/JS puros e funções da Vercel que usam só `fetch`.
- **Tudo dentro de `site/` é público na internet.** Guias, planos, notas e qualquer arquivo interno ficam fora dela
  (em `docs/`, na raiz ou em `supabase/`). Antes de criar ou mover um arquivo para `site/`, pergunte: pode qualquer
  pessoa ler isto?
