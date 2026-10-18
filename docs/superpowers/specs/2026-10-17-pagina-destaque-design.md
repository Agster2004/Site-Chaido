# Página do empreendimento no estilo "destaque" (desenho)

Data: 17/10/2026. Aprovado pelo usuário ("pode construir, mas não publique nada antes de vermos"). Referência: página do
Costa Esmeralda da GMV Incorporadora (`gmvincorporadora.com.br/empreendimento.php?id=62`).

## O que é
Uma segunda forma da página `/imovel/<slug>`, ligada por empreendimento com `"layout": "destaque"` no `empreendimentos.json`
(ou "Estilo da página" no `/admin`). Quem não tem o campo continua com a página antiga. Hoje só o **Carmo** usa; o **Garrett**
pode passar a usar só preenchendo os campos (decisão do usuário).

## Seções (cada uma só aparece se tiver os dados)
1. **Capa** em tela cheia (vídeo no computador; versão leve no celular desde 18/10/2026; fotos como reserva), com selos de bairro e status, nome grande, endereço e botões
   "Quero saber mais" e WhatsApp. Campos: `capa_video`, `capa_video_celular`, `capa_slides`, `capa_nota`, `bairro`, `tag_label`.
2. **O empreendimento** (escura): parágrafos de `sobre` (ou `descricao`) e a **faixa de características** com ícones
   (`caracteristicas`: `icone` = casa, suite, banheiro, area ou vaga, e `texto`).
3. **Galeria** (clara): a `galeria` de sempre, em **carrossel lateral** (desde 18/10/2026, como na GMV): 2 fotos e um pedaço da terceira no computador, com setas e arrastar;
   1 foto e um pedaço da próxima no celular. Tocar abre o visualizador. Capa com `capa_nota` ("Imagens ilustrativas") no canto.
4. **O projeto** (clara 2): diferenciais e tabela de unidades.
4b. **Plantas** (clara, seção própria desde 18/10/2026): `plantas` com `grupo` (casa), `nome` (andar), `src`, `webp`. Com mais de um grupo, um botão por casa e os andares
   em carrossel lateral; embaixo, área e vagas da unidade de mesmo nome. Zoom ao tocar.
5. **Explore a região** (escura): `mapa.endereco` e `mapa.texto`. O mapa do Google **só carrega quando a pessoa toca em
   "Ver o mapa aqui"** (não envia dados ao Google antes disso e a página fica leve); há também o botão "Abrir no Google Maps".
6. **Andamento da obra** (clara): `obra.etapas` (`nome`, `percentual`), `obra.total` (vazio = média) e `obra.atualizado_em`.
7. **Formulário** (verde): o mesmo formulário de leads, ao lado das linhas do painel lateral e do botão do WhatsApp. Âncora `#interesse`.
8. **Outros empreendimentos** (clara 2): cartões dos demais empreendimentos da lista, automático.

## Arquivos
`site/assets/detalhe-destaque.js` (monta a página), `render.js` (decide qual página usar e entrega as partes prontas),
`style.css` (bloco "PÁGINA DESTAQUE", classes `dd-`), `imovel.html` (script novo), `admin/config.yml` (campos novos).

## Fora desta etapa
- **Baixar o book**: precisa do PDF e de uma função que só libera o arquivo depois do cadastro (o PDF não pode ficar aberto em
  `site/`). Pede desenho próprio.
- **"Cliente final ou Corretor"** no formulário: mexe no banco e no painel de leads. Pede desenho próprio.
- **Pessoas no vídeo da capa**: trechos gerados de graça no Hugging Face (Wan 2.2); as 5 cenas prontas (18/10/2026) e o vídeo em
  `midia/carmo-videos/carmo-capa-com-pessoas.mp4`. Ainda não é a capa; ao trocar, acrescentar "imagens ilustrativas" sobre a capa.

## Dados que faltam do Carmo
Plantas (imagens), percentuais da obra e o PDF do book. Confirmar com o usuário se o Carmo tem 3 banheiros (hoje a faixa diz "Lavabo").
