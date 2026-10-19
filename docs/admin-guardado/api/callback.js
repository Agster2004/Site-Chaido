// Segunda etapa do login: o GitHub manda o navegador de volta pra cá com um
// "code" de uso único. Aqui a gente troca esse code por um token de acesso
// e devolve pra janela do painel administrativo (que ficou esperando).
export default async function handler(req, res) {
  const { code, error, error_description } = req.query;

  if (error) {
    res.status(400).send(`Erro de autorização do GitHub: ${error_description || error}`);
    return;
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).send(
      'Faltou configurar OAUTH_CLIENT_ID e/ou OAUTH_CLIENT_SECRET no projeto da Vercel.'
    );
    return;
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const data = await tokenResponse.json();

    if (data.error) {
      res.status(400).send(`Erro ao trocar o código pelo token: ${data.error_description || data.error}`);
      return;
    }

    const payload = JSON.stringify({ token: data.access_token, provider: 'github' });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!doctype html>
      <html>
        <body>
          <script>
            (function() {
              function receiveMessage(e) {
                window.opener.postMessage(
                  'authorization:github:success:${payload}',
                  e.origin
                );
                window.removeEventListener('message', receiveMessage, false);
              }
              window.addEventListener('message', receiveMessage, false);
              window.opener.postMessage('authorizing:github', '*');
            })();
          </script>
          Pode fechar esta janela.
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Erro inesperado no login: ' + err.message);
  }
}
