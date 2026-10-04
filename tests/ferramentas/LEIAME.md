# Ferramentas de teste (não fazem parte do site)

Esta pasta fica **fora de `site/`**, então não é publicada. Serve para testar o painel de leads **sem depender do
Supabase de verdade**. Nenhuma ferramenta usa chave real, e nunca devem receber uma.

> `node --test` (na raiz do repositório) roda os testes automáticos de `tests/*.test.mjs`. **Não** roda estas ferramentas:
> elas são rodadas à mão, como abaixo. Precisa do Node 22 ou mais novo.

## 1. `banco-cenarios.mjs`: confere o banco e as regras de acesso

Roda `supabase/migrations/0001_leads.sql` num Postgres de teste em memória (PGlite) que imita o Supabase (papéis
`anon`, `authenticated` e `service_role`, `auth.uid()` e as permissões padrão) e confere **42 cenários**: visitante sem
acesso, lead repetido que não duplica, limite de envios por IP, fases, "perdido" exigindo motivo, `vendido_em`,
usuário fora de `usuarios_painel` sem acesso a nada, apagar uma pessoa levando o histórico.

```bash
cd tests/ferramentas
npm i --no-save @electric-sql/pglite     # só na primeira vez; a pasta node_modules não vai para o GitHub
node banco-cenarios.mjs                  # esperado no fim: "42 ok, 0 falhas"
```

Rode de novo **sempre que mudar a migração** (e crie uma migração nova, `0002_...sql`, em vez de editar a `0001`, que já
foi aplicada no Supabase).

## 2. `servidor-painel-simulado.mjs`: testa o `/painel` no navegador

Sobe o site em `http://localhost:4173` e um Supabase de mentira em `http://localhost:4174`, com leads de exemplo.

```bash
node tests/ferramentas/servidor-painel-simulado.mjs     # da raiz do repositório
```

Abra `http://localhost:4173/painel/` e entre com `cv.cvwill@gmail.com` e a senha `senha-certa`. Também existe
`outro@exemplo.com` (mesma senha), uma conta **sem** permissão, para ver a mensagem de bloqueio. Dá para testar login,
lista, filtros, exportar CSV, ficha (fase, perdido com motivo, anotação, rascunho), busca por pessoa, exportar e apagar.
`http://localhost:4174/__estado` mostra os dados em memória. Os dados voltam ao início ao reiniciar. Para parar: Ctrl+C.

## 3. `servidor-formulario-simulado.mjs`: testa o formulário com a função real

Sobe o site em `http://localhost:4173` com a função **real** `/api/lead`; só o Supabase e o Resend são simulados.

```bash
node tests/ferramentas/servidor-formulario-simulado.mjs
```

Abra `http://localhost:4173/imovel.html?slug=carmo`, preencha e envie. `http://localhost:4173/__debug` mostra o que a
função mandou ao banco (IP só como código embaralhado) e ao e-mail. Lembre: enviar em menos de 3 segundos depois de abrir
a página devolve erro de propósito (proteção contra robô).

## O que estas ferramentas NÃO provam
O Supabase de verdade, o login real, o e-mail real e a Vercel só se provam na **prévia** (`site-chaido-git-trabalho-chiado.vercel.app`) e,
no fim, no site oficial. As ferramentas pegam erros de lógica e de tela antes de chegar lá.
