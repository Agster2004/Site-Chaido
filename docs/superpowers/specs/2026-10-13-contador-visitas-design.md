# Contador de visitas no painel (desenho)

Data: 13/10/2026. Aprovado pelo usuário ("pode construir a opção 2"). Parte do plano "acessos do site".

## Por quê
O Vercel Analytics gratuito (Hobby) não mostra a quebra por UTM; isso exige Pro + Web Analytics Plus (US$ 10/mês). O contador
próprio dá, de graça e dentro do painel, as visitas por dia e por origem (instagram/bio, anúncio pago, Google, direto) e a
conversão (leads ÷ visitas).

## O que é uma "visita"
Uma sessão do navegador, contada **uma vez**, na página em que a pessoa entrou. Quem abre várias páginas na mesma visita conta 1.
Robôs e prévias de link (WhatsApp, Facebook etc.) não contam. A equipe pode se excluir abrindo o site uma vez com `?nao_contar=1` (`?nao_contar=0` desfaz); a marca fica no navegador e vale só para aquele endereço.

## Onde conta
**Só no site oficial** (`www.chiadoconstrutora.com.br` e `chiadoconstrutora.com.br`). O navegador (`utm.js`, `enderecoContavel`) só envia a contagem nesses endereços e o
servidor (`api/visita.js`, `hostContavel`) também ignora qualquer outro (204, sem gravar). Assim a prévia da Vercel e os testes não entram nos números.
`VISITA_HOSTS` (variável) aceita endereços extras só para testes e simulações locais.

## Dados
Tabela `visitas_diarias (dia, caminho, fonte, meio, campanha, total)`, uma linha por combinação por dia (fuso de São Paulo).
**Nenhum dado pessoal:** sem IP, sem nome, sem cookie. Origem = UTM do link; sem UTM, o site de origem (meio `referencia`); sem nada, direto.
Proteções: só caminhos conhecidos (`/`, `/privacidade`, `/imovel/<slug>`); textos limpos e cortados; depois de 500 combinações no dia, as
novas origens entram juntas como `outros`.

## Fluxo
`utm.js` (navegador) -> `POST /api/visita` (função na Vercel, valida e ignora robôs) -> `registrar_visita` (só `service_role`) -> tabela.
O painel lê a tabela com a chave pública, sob as regras de acesso (RLS): só `usuarios_painel`.
Se o banco estiver fora do ar, a visita só não é contada; o visitante nunca vê erro (resposta 204).

## Painel
Tela `#/visitas`: hoje, 7 dias, 30 dias, conversão (30 dias), por dia (7 dias), de onde vêm (30 dias), páginas de entrada (30 dias).

## Limites conhecidos
- Os números não batem exatamente com os do Vercel Analytics (cada um conta de um jeito; filtro de robôs por user-agent não é perfeito).
- Quem abre o site direto pela primeira vez e só conta como visita na sessão em que entrou; voltar depois conta de novo.
- Leitura de 30 dias no painel segue o limite padrão de 1000 linhas do Supabase (basta para o volume atual).
- Entra no site oficial só com o "podemos colocar no ar" do painel; a migração `0002_visitas.sql` precisa ser aplicada no Supabase antes.
