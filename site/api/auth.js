// Primeira etapa do login do painel: manda o navegador para a tela de
// autorização do GitHub. Precisa das variáveis de ambiente OAUTH_CLIENT_ID
// e OAUTH_CLIENT_SECRET configuradas no projeto da Vercel (veja docs/README-VERCEL.md).
export default function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;

  if (!clientId) {
    res.status(500).send(
      'Faltou configurar a variável de ambiente OAUTH_CLIENT_ID no projeto da Vercel.'
    );
    return;
  }

  const host = req.headers.host;
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo,user',
  });

  res.writeHead(302, {
    Location: `https://github.com/login/oauth/authorize?${params.toString()}`,
  });
  res.end();
}
