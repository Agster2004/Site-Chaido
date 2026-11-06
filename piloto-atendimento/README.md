# Piloto local do atendimento da Chiado

Execute `node piloto-atendimento/servidor.mjs` na raiz do projeto e abra http://127.0.0.1:8791.

Use o login de teste `will` com a senha `chiado-piloto-local`. Clique em **Simular IA** para carregar a conversa pronta ou em **Simular cliente** para começar uma conversa em branco e digitar suas próprias mensagens. No modo cliente, respostas simuladas usam regras simples para Carmo e Garrett, e pedidos como visita ou preço entram na fila. Você pode assumir na hora ou simular um pedido de visita para ver a fila de pendências. Depois de assumir, envie uma resposta de teste para conferir a autoria.

Por padrão, o servidor escuta apenas neste computador e guarda sessões e conversas em memória. O modo sem modelo usa respostas por regras. O modo com Ollama já foi testado localmente. A configuração para hospedagem privada já prevê SQLite, contas individuais e Ollama remoto. Publicação, WhatsApp e Telegram estão pendentes. Veja o [estado e os próximos passos](../docs/atendimento-ia-chiado.md#estado-em-06112026).

Com Ollama rodando em 127.0.0.1:11434, inicie com `CHIADO_MODELO_LOCAL=<modelo-instalado> node piloto-atendimento/servidor.mjs` e abra **Simular cliente**. Esse modo usa o histórico e uma seleção dos dados do catálogo. Quando o modelo está indisponível, o painel sinaliza a falha e encaminha o atendimento.

## Trabalhar nos dois computadores

Use a branch `trabalho` nos dois computadores. No início da sessão, puxe do GitHub. No fim, envie as alterações do piloto, do [escopo](../docs/atendimento-ia-chiado.md) e do [catálogo do site](../site/data/empreendimentos.json) na mesma branch. O atendimento com IA relê o catálogo local a cada resposta. Depois do pull, as alterações da ficha já valem para a próxima resposta. Para alterações no código do servidor, reinicie o piloto.

O GitHub sincroniza os arquivos versionados. O Ollama e o modelo precisam estar disponíveis em cada computador. Sem configurar SQLite, as conversas de teste ficam em memória. As sessões sempre ficam em memória. Mantenha credenciais reais fora do repositório.

Para usar o Qwen local no macOS:

```sh
CHIADO_MODELO_LOCAL=qwen2.5:3b node piloto-atendimento/servidor.mjs
```

No Windows, pelo PowerShell:

```powershell
$env:CHIADO_MODELO_LOCAL = 'qwen2.5:3b'
node piloto-atendimento/servidor.mjs
```

Execute `node --test tests/piloto-chiado.test.mjs` para rodar a bateria de regressão local.

## Ambiente privado online

Use Node.js 24, uma única instância do servidor e um volume persistente para o SQLite. Configure as variáveis no gerenciador de segredos da hospedagem:

- `CHIADO_ORIGEM` com a origem HTTPS do painel.
- `CHIADO_HOST=0.0.0.0` atrás do proxy HTTPS da hospedagem e `PORT` com a porta interna.
- `CHIADO_CONTAS` com um objeto JSON de logins individuais e senhas distintas de pelo menos 16 caracteres.
- `CHIADO_BANCO` com o caminho absoluto do banco no volume persistente.
- `CHIADO_MODELO_LOCAL` com o nome do modelo e `CHIADO_OLLAMA_URL` com a origem do serviço Ollama remoto. Use rede privada ou HTTPS com autenticação via `CHIADO_OLLAMA_TOKEN`.

O comando de início é `node piloto-atendimento/servidor.mjs`. As conversas sobrevivem a reinícios e os atendentes precisam entrar novamente. Uma conversa cuja resposta foi interrompida por reinício aparece na fila humana. Esta configuração prepara o painel de simulação. A hospedagem e a integração com WhatsApp ainda precisam ser configuradas.
