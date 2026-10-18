# Ferramentas de teste (não fazem parte do site)

Esta pasta fica **fora de `site/`**, então não é publicada. Serve para testar o painel de leads **sem depender do
Supabase de verdade**. Nenhuma ferramenta usa chave real, e nunca devem receber uma.

> `node --test` (na raiz do repositório) roda os testes automáticos de `tests/*.test.mjs`. **Não** roda estas ferramentas:
> elas são rodadas à mão, como abaixo. Precisa do Node 22 ou mais novo.

## 1. `banco-cenarios.mjs`: confere o banco e as regras de acesso

Roda `supabase/migrations/0001_leads.sql` e `0002_visitas.sql` num Postgres de teste em memória (PGlite) que imita o Supabase (papéis
`anon`, `authenticated` e `service_role`, `auth.uid()` e as permissões padrão) e confere **57 cenários** (42 do banco de leads e 15 do contador de visitas): visitante sem
acesso, lead repetido que não duplica, limite de envios por IP, fases, "perdido" exigindo motivo, `vendido_em`,
usuário fora de `usuarios_painel` sem acesso a nada, apagar uma pessoa levando o histórico.

```bash
cd tests/ferramentas
npm i --no-save @electric-sql/pglite     # só na primeira vez; a pasta node_modules não vai para o GitHub
node banco-cenarios.mjs                  # esperado no fim: "57 ok, 0 falhas"
```

Rode de novo **sempre que mudar a migração** (e crie uma migração nova, `0003_...sql`, em vez de editar as que já
foram aplicadas no Supabase).

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

## 4. `gerar-cena-video.mjs`: cena de vídeo com pessoas a partir de uma foto (não é teste)

Usado para a capa do Carmo (18/10/2026). Manda a foto e o texto para a página pública e grátis do Wan 2.2 no Hugging Face
(`zerogpu-aoti/wan2-2-fp8da-aoti-faster`) e baixa o vídeo (832×480, 16 quadros por segundo, sem marca d'água). Não usa conta nem chave.

```bash
node tests/ferramentas/gerar-cena-video.mjs midia/carmo-videos/fotos-16x9/4-varanda.jpg midia/carmo-videos/videos/4-varanda-v2.mp4 5 "Static camera. ..."
```

A cota grátis é curta (cerca de 3 cenas de 5 s por dia, por endereço de internet; renova 24 h depois do primeiro uso). Os textos de cada cena estão em
`midia/carmo-videos/LEIA-ME.txt`. Juntar as cenas num vídeo só precisa do ffmpeg (`npm install ffmpeg-static` numa pasta temporária, fora do projeto).

## O que estas ferramentas NÃO provam
O Supabase de verdade, o login real, o e-mail real e a Vercel só se provam na **prévia** (`site-chaido-git-trabalho-chiado.vercel.app`) e,
no fim, no site oficial. As ferramentas pegam erros de lógica e de tela antes de chegar lá.
