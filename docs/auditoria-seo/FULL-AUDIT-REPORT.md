# Auditoria de SEO: Chiado Construtora (22/10/2026)

**Sites analisados:** `https://www.chiadoconstrutora.com.br` (oficial, branch `main`) e
`https://site-chaido-git-trabalho-chiado.vercel.app` (prévia, branch `trabalho`).
**Tipo de negócio detectado:** construtora/incorporadora local (Praia Grande/SP), com captação de leads por WhatsApp e formulário.

> Este arquivo fica fora de `site/` de propósito: não é público.

## Como foi feita (e o que NÃO foi medido)

Rodei a auditoria inline (sem subagentes), com: renderização com e sem JavaScript (Playwright), cabeçalhos HTTP, `robots.txt`,
`sitemap.xml`, 4 páginas de cada endereço (início, Garrett, Carmo, privacidade), dados estruturados, textos alternativos e pesos de arquivos.

**Não medido:**
- **Core Web Vitals / PageSpeed:** a cota gratuita da API do Google estava esgotada (erro 429). Nenhuma nota de desempenho abaixo é medida.
- **Google Search Console, GA4, backlinks, posições no Google, Google Meu Negócio:** sem credenciais ou ferramentas conectadas.
- **Rastreio completo:** o site tem só 4 páginas indexáveis, então o rastreio foi manual.

## Nota geral: ~66 / 100 (estimativa, sem desempenho medido)

| Categoria | Nota | Observação |
|---|---|---|
| SEO técnico | 78 | Base boa; faltam redirecionamento permanente do domínio sem www e cabeçalhos de segurança |
| Qualidade do conteúdo | 60 | Pouco texto; as páginas dos imóveis dependem de JavaScript |
| SEO na página | 72 | Títulos, descrições e canonical certos; links do menu passam por redirecionamento |
| Dados estruturados | 62 | Válidos, mas incompletos para busca local |
| Desempenho | não medido | Há vídeos e imagens pesados no código; ver itens 5 e 6 |
| Preparo para IA | 52 | Páginas dos imóveis vazias para robôs que não rodam JavaScript |
| Imagens | 70 | Alt presente na maioria; faltam dimensões |

## O que já está bom

- HTTPS com HSTS; `www` como endereço oficial; `canonical` correto em todas as páginas.
- `robots.txt` bloqueia `/admin/`, `/painel/` e `/api/`, e declara o sitemap; `/painel/` tem `noindex`.
- **A prévia tem `X-Robots-Tag: noindex` e o canonical aponta para o oficial**, então não gera conteúdo duplicado no Google.
- Títulos e descrições únicos por página; Open Graph e Twitter Card completos.
- Dados estruturados válidos: `GeneralContractor` no início; `Residence` + `BreadcrumbList` nos imóveis.
- `lang="pt-BR"`, link "Pular para o conteúdo", sem erros no console, CNPJ e telefone no rodapé.

## Achados

### Alto

**1. As páginas dos imóveis chegam vazias no HTML original.**
O HTML que o servidor entrega para `/imovel/carmo` e `/imovel/garrett` tem só a palavra "Carregando…", sem `<h1>` e sem texto.
Depois que o JavaScript roda, aparecem o H1 "Residencial Carmo" e o conteúdo (conferido: sem erros). O Google costuma renderizar JavaScript,
mas é mais lento e menos garantido, e **robôs de IA (ChatGPT, Perplexity e similares) em geral não rodam JavaScript e não veem nada**.
Como é a página que vende, isso pesa.
*Correção:* `api/imovel.js` já injeta título e metadados; fazer ele também escrever no HTML o H1, o parágrafo de descrição, endereço e lista de características.

**2. Busca local pouco aproveitada.**
O `GeneralContractor` não tem endereço de rua, coordenadas nem horário; os `Residence` também não têm coordenadas nem oferta.
Não consegui verificar se existe perfil no Google Meu Negócio (sem ferramenta conectada). Para construtora, é a maior fonte de busca local.
*Correção:* completar o schema com `streetAddress`, `geo`, `openingHours` e `email`; criar/confirmar o perfil no Google Meu Negócio com o mesmo nome e telefone do site.

### Médio

**3. Links do menu passam por redirecionamento.**
O menu e os cartões apontam para `imovel.html?slug=carmo`, que redireciona (308) para `/imovel/carmo`. Funciona, mas gasta rastreio e dilui sinal.
*Correção:* apontar direto para `/imovel/carmo` e `/imovel/garrett`.

**4. `chiadoconstrutora.com.br` (sem www) redireciona com 307 (temporário).**
O correto é permanente (308/301) para consolidar o endereço oficial. Costuma ser configuração do domínio na Vercel (painel), não do código.

**5. Imagens sem dimensões e com alt vazio (visto na prévia do Carmo novo).**
- 49 de 51 imagens sem `width`/`height` (risco de a página "pular" ao carregar).
- 16 imagens com `alt=""`. Se forem só decorativas (por exemplo, repetidas no carrossel), está certo; **não verifiquei a origem de cada uma**.
*Correção:* conferir quais são conteúdo (precisam de alt) e colocar `width`/`height` nas imagens do carrossel e das plantas.

**6. Mídia pesada no repositório.**
`garrett-tour-interna.mp4` (11 MB), `garrett-tour.mp4` (9,8 MB), `carmo-capa.mp4` (4 MB), `carmo-capa-pessoas.mp4` (3,3 MB).
Não medi se carregam antes da hora. Garantir `preload="none"` ou carregamento só ao clicar nos vídeos fora da capa, e confirmar com PageSpeed quando a cota voltar.

**7. Pouco texto e pouca prova de confiança.**
O início tem cerca de 1.460 caracteres. Faltam textos sobre os bairros (Tupy, Ocian), o processo de compra e depoimentos/obras entregues com nome.
Não há página por bairro nem por tema ("apartamento perto da praia em Praia Grande"). Isso limita o que o site pode aparecer no Google.

**8. Cabeçalhos de segurança ausentes no site oficial.**
Só há HSTS. Faltam `X-Content-Type-Options`, `X-Frame-Options` (ou CSP `frame-ancestors`), `Referrer-Policy` e `Permissions-Policy`.
Pouco efeito direto em ranking, mas melhora a nota técnica e protege. Dá para adicionar em `site/vercel.json`.

### Baixo

9. `sitemap.xml` sem `lastmod`. Adicionar a data de modificação ajuda o Google a reprocessar o Carmo quando a página mudar.
10. Título do início com cerca de 71 caracteres; pode ser cortado no Google. Sugestão: "Chiado Construtora | Imóveis em Praia Grande/SP".
11. `og:image` do início é a capa do Garrett (o Carmo aparece só na página dele). Considerar uma imagem de marca com os dois.
12. `llms.txt` não existe (opcional; o Google ignora). `robots.txt` não tem política para robôs de IA: hoje todos são liberados, o que é razoável.
13. `favicon.ico` retorna 404; o site usa PNG por `<link>`, então o efeito é mínimo.

## Diferença entre oficial e prévia (Carmo)

| | Oficial | Prévia (`trabalho`) |
|---|---|---|
| Imagens renderizadas | 20 | 51 |
| Seções (H2) | 1 | 8 |
| Texto visível | ~1.100 caracteres | ~1.500 caracteres |
| Indexável | sim | não (`noindex`) |

O novo layout do Carmo melhora o conteúdo (mais seções e texto), mas **ainda não está no ar**. Quando for, rever os itens 1 e 5 antes.
