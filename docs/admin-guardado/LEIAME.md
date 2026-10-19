# Painel /admin (guardado, desligado)

Desde 19/10/2026 o painel `/admin` (Decap CMS, login pelo GitHub) está **desligado de propósito**: só uma pessoa edita o
site, e o `/admin` gravava direto no `main`. Nada foi apagado; os arquivos ficam aqui, fora de `site/`, então não são públicos
e o endereço `/admin/` dá 404.

## Arquivos guardados
- `index.html` e `config.yml` -> eram `site/admin/` (a `config.yml` já tem os campos novos do Carmo: capa, plantas, mapa, obra).
- `api/auth.js` e `api/callback.js` -> eram `site/api/` (login OAuth do `/admin`).

## Como reativar
1. Na raiz do repositório, na `trabalho`:
   `git mv docs/admin-guardado/index.html site/admin/index.html` (crie `site/admin/` antes),
   `git mv docs/admin-guardado/config.yml site/admin/config.yml`,
   `git mv docs/admin-guardado/api/auth.js site/api/auth.js` e `git mv docs/admin-guardado/api/callback.js site/api/callback.js`.
2. Opcional: voltar `Disallow: /admin/` no `site/robots.txt`.
3. As variáveis `OAUTH_CLIENT_ID` e `OAUTH_CLIENT_SECRET` seguem na Vercel (não foram mexidas). Conferir o OAuth App no GitHub
   (callback `https://www.chiadoconstrutora.com.br/api/callback`). Passo a passo original: `docs/README-VERCEL.md`.
4. Testar na prévia e só então o "podemos colocar no ar". Depois de reativado, o "puxe do github" volta a ser essencial
   (o `/admin` grava direto no `main`).
