# Publicando o site da Chiado na Vercel

Este site é só HTML/CSS/JS estático + duas funções pequenas (em `/api`) que
existem só para o login do painel administrativo funcionar. Siga na ordem.

## 1. Subir o código pro GitHub

Crie um repositório (ex: `chiado-site`) e suba a pasta inteira pra lá.

## 2. Criar um "OAuth App" no GitHub (necessário só por causa do painel)

A Vercel não tem um sistema de login pronto como a Netlify tem — por isso
esse site inclui duas funções próprias (`api/auth.js` e `api/callback.js`)
que fazem essa ponte. Pra elas funcionarem, você precisa cadastrar um "app"
de autenticação no GitHub (leva 2 minutos, é gratuito):

1. Acesse **github.com/settings/developers** → aba **OAuth Apps** → **New OAuth App**
2. Preencha:
   - **Application name**: `Chiado Construtora - Painel` (ou o nome que quiser)
   - **Homepage URL**: `https://SEU-SITE.vercel.app` (o link do seu site na Vercel)
   - **Authorization callback URL**: `https://SEU-SITE.vercel.app/api/callback`
3. Clique em **Register application**
4. Copie o **Client ID** que aparece
5. Clique em **Generate a new client secret** e copie o valor (só aparece uma vez — guarde num lugar seguro)

## 3. Publicar na Vercel

1. Acesse **vercel.com**, crie conta gratuita (pode usar login do GitHub)
2. **Add New** → **Project** → selecione o repositório `chiado-site`
3. Não precisa mexer em nenhuma configuração de build — a Vercel detecta sozinha
4. Clique em **Deploy**

## 4. Configurar as variáveis de ambiente

Depois do primeiro deploy (mesmo que ainda não tenha o domínio final):

1. No projeto da Vercel, vá em **Settings** → **Environment Variables**
2. Adicione duas variáveis:
   - `OAUTH_CLIENT_ID` → cole o Client ID do passo 2
   - `OAUTH_CLIENT_SECRET` → cole o Client Secret do passo 2
3. Salve e vá em **Deployments** → nos "..." do último deploy → **Redeploy**
   (as variáveis novas só valem a partir de um redeploy)

## 5. Atualizar o admin/config.yml com o link real

Abra `admin/config.yml` e troque:
- `SEU-USUARIO/SEU-REPOSITORIO` → o caminho real do seu repositório (ex: `willsilva/chiado-site`)
- `https://SEU-SITE.vercel.app` → o link real que a Vercel te deu

Suba essa alteração pro GitHub (isso já atualiza o site sozinho, a Vercel republica automaticamente).

## 6. Atualizar a Authorization callback URL do GitHub (se o link mudou)

Se o link final da Vercel for diferente do que você usou no passo 2, volte em
**github.com/settings/developers**, edite o OAuth App, e corrija a
**Authorization callback URL** pro link certo + `/api/callback`.

## 7. Acessar o painel

Acesse `https://SEU-SITE.vercel.app/admin/`, clique em **Login with GitHub**,
autorize o acesso, e pronto — o painel abre.

---

### Se algo der errado

- **"Faltou configurar a variável de ambiente..."** → volta no passo 4, confirme
  que salvou as duas variáveis e fez o redeploy depois.
- **Login abre e fecha sem entrar** → confira se a Authorization callback URL
  do GitHub (passo 2 ou 6) bate exatamente com `https://SEU-SITE.vercel.app/api/callback`.
- **"Not Found" ao acessar /admin** → confirme que a pasta `admin/` foi
  realmente enviada pro GitHub junto com o resto do site.
