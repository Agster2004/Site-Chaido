# Plano de ação de SEO (auditoria de 22/10/2026)

Detalhes e evidências em `FULL-AUDIT-REPORT.md`. Tudo aqui é feito na `trabalho`, validado na prévia e só vai ao ar com o "podemos colocar no ar".

## Fase 1: corrigir já (semana 1)

1. **Servir texto real nas páginas dos imóveis** (`api/imovel.js`): H1, descrição, endereço e características no HTML, antes do JavaScript. *(Alto, ~½ dia)*
2. **Links do menu e cartões direto para `/imovel/<slug>`**, sem passar por `imovel.html?slug=`. *(Médio, ~1 h)*
3. **Redirecionamento permanente do domínio sem www** para `www` (ajuste no painel de domínios da Vercel; ação sua). *(Médio, ~10 min)*
4. **Conferir o perfil no Google Meu Negócio** (ação sua) e usar o mesmo nome, telefone e endereço do site. *(Alto, ~1 h)*

## Fase 2: alto impacto (semanas 2 e 3)

5. **Completar o schema:** `streetAddress`, `geo`, `openingHours`, `email` na construtora; `geo` e oferta nos imóveis. *(Alto, ~2 h)*
6. **Imagens:** `width`/`height` no carrossel e nas plantas do Carmo; conferir os 16 `alt=""` (decorativo ou conteúdo?). *(Médio, ~2 h)*
7. **Vídeos:** `preload="none"` ou carregar só no clique nos que não são capa. *(Médio, ~1 h)*
8. **Cabeçalhos de segurança** em `site/vercel.json`. *(Médio, ~30 min)*
9. **Rodar o PageSpeed** quando a cota voltar (ou com chave de API sua na Vercel/terminal; não envie a chave pelo chat) e comparar oficial × prévia. *(Médio)*

## Fase 3: conteúdo e autoridade (mês 2)

10. Texto sobre bairros (Tupy, Ocian), processo de compra, perguntas frequentes e obras entregues com nome. *(Médio)*
11. Depoimentos de moradores do Garrett (com autorização por escrito). *(Médio)*
12. Páginas por tema/bairro, se fizer sentido para a estratégia de anúncios. *(Médio, precisa de desenho)*
13. Cadastrar o `sitemap.xml` no Google Search Console (ação sua) e acompanhar indexação. *(Médio)*

## Fase 4: acompanhamento (contínuo)

14. `lastmod` no `sitemap.xml`; título do início mais curto. *(Baixo)*
15. Repetir `/claude-seo:seo-audit` depois de ir ao ar com o Carmo novo e comparar com este relatório.
16. Opcional: `seo-drift` para vigiar regressões; `llms.txt`; `favicon.ico`.
