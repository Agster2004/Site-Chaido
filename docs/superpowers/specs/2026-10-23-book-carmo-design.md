# Book do Carmo: "Baixar o book" depois do cadastro (desenho)

Data: 23/10/2026. **Construído na `trabalho` em 23/10/2026 ("pode construir" dado), só na prévia.** Mudanças em relação ao desenho original estão na seção "Como ficou".

## O que é
Um botão "Baixar o book" na página do Carmo. A pessoa deixa nome e WhatsApp, o contato entra no painel de leads
e só então ela recebe o PDF. O PDF **nunca** fica em `site/` (que é público).

## Decisão do usuário (23/10/2026)
O book original (`Res. CARMO - JULHO 26.pdf`, 4 páginas, 21 MB) traz a **tabela de valores** na página 3.
O site mostra "Valores: sob consulta", então o PDF liberado será **sem essa página**: capa, diferenciais e
localização. Os valores continuam só no WhatsApp.

## Como funciona para a pessoa
1. Na página do Carmo aparece o botão "Baixar o book" (na capa e junto do formulário).
2. Ele abre o **mesmo formulário de interesse** que já existe (nome, WhatsApp, e-mail opcional, consentimento),
   já marcado com o Carmo e com o aviso "Você vai receber o book do Carmo".
3. Ao enviar com sucesso, a tela mostra o botão "Baixar o PDF" (link que vale 10 minutos) e a frase
   "Um consultor da Chiado vai chamar você no WhatsApp".
4. Se o envio falhar ou for barrado como robô, **não há link**.

## Como funciona por trás
- **Arquivo:** PDF reduzido (alvo de 3 a 5 MB) guardado em um **bucket privado** do Supabase Storage
  (`books/carmo.pdf`). O usuário sobe o arquivo pelo painel do Supabase; o Claude só prepara o PDF.
- **Entrega:** `/api/lead` (já existe) passa a aceitar `quer_book: 'carmo'`. Depois de gravar o lead de verdade
  (não no caso de isca, robô ou limite por hora), pede ao Supabase um **link assinado de 10 minutos** e devolve
  na resposta. Só funciona para empreendimentos que tenham `book` no `empreendimentos.json`.
- **Banco (migração `0003_book.sql`, a aplicar pelo usuário como as anteriores):**
  - `lead_eventos.tipo` ganha o valor `'book'` (hoje: nota, mudança de fase, retorno).
  - `registrar_lead` registra o evento "Baixou o book do Carmo" na ficha do lead.
  - criação do bucket privado `books`.
- **Painel (`/painel`):** na ficha do lead, o histórico mostra "Baixou o book do Carmo" com data e hora.
  Um filtro "Baixou o book" na lista é opcional.
- **E-mail de aviso:** o aviso de novo lead passa a dizer "pediu o book".
- **Página (`detalhe-destaque.js`, `lead-form.js`, `style.css`):** botão e estado de sucesso com o link.

## Privacidade (LGPD)
- O texto de consentimento atual diz "receber contato ... sobre os empreendimentos". Para o book basta, mas
  convém uma frase na `/privacidade` ("se você pedir o book, guardamos esse pedido junto do seu contato").
  O advogado já vai revisar essa página.
- O link assinado expira em 10 minutos e não é indexado; o arquivo não tem endereço público.
- Não se guarda o IP (só o hash, como hoje).

## Fora desta etapa
- "Cliente final ou Corretor" no formulário (mexe em banco e painel; pede desenho próprio).
- Book do Garrett (o usuário ainda não tem; o mesmo mecanismo serve depois, só com `book` no cadastro).
- Contar quantos baixaram dentro de "Visitas" (dá para ver pela ficha e pelo filtro).

## O que preciso do usuário para construir
1. **"Pode construir"** desta parte.
2. Confirmar que o PDF liberado é **sem a página 3** (valores) e que a versão "Julho 26" é a atual.
3. Subir o PDF reduzido no Supabase (eu mostro onde clicar) e aplicar a migração `0003_book.sql`.

## Testes previstos
- Unitários: `quer_book` só vale para empreendimento com `book`; sem lead gravado, sem link; link vem do Supabase.
- Na prévia: enviar o formulário com o botão do book, ver o link e o PDF abrindo, ver o evento na ficha do lead
  no painel, tentar o endereço direto do arquivo (tem de dar erro) e testar no celular.

## Riscos
- O link de 10 minutos pode ser repassado para outra pessoa: aceitável, o PDF não tem preços.
- O Supabase gratuito tem limite de armazenamento (1 GB) e de banda: um PDF de 3 a 5 MB cabe folgado.

## Como ficou (construído em 23/10/2026)
- **O PDF não vai para o Supabase Storage** (o desenho previa isso). Ele fica em `site/api/_book/carmo.pdf`, dentro da função da Vercel
  (`includeFiles` em `vercel.json`), fora da parte pública: o endereço do arquivo não existe na internet. Isso dispensou criar bucket e subir arquivo.
  O PDF tem 3 páginas (capa, diferenciais, localização), 2 MB, sem a página de valores.
- **Link assinado próprio** (`api/_lib/book.js`): `carmo.<validade>.<assinatura HMAC>`, vale 10 minutos, usa `IP_HASH_SALT` (ou `BOOK_SECRET`, se existir).
  `api/book.js` só entrega o PDF com token válido; sem ele, 404.
- `api/lead.js`: se `quer_book` for verdadeiro **e** o empreendimento tiver `"book": true` no cadastro, depois de gravar o lead devolve `book.url`.
  Robô (isca), limite por hora e dados inválidos nunca recebem o link.
- **Migração `0003_book.sql`** (a aplicar pelo usuário no Supabase): permite o evento `book` e cria `registrar_book`. **Sem a migração tudo funciona**
  (o lead e o link saem), só falta a linha "Baixou o book" na ficha do lead. A ficha do painel e o e-mail de aviso ("Pediu o book") já estão prontos.
- Página: botão "Baixar o book" na capa do Carmo, que marca a caixa "Quero receber o book (PDF)" do formulário (a caixa só aparece para empreendimentos com book).
  Depois do envio, a tela mostra "Baixar o book (PDF)".
- Testes: `tests/book.test.mjs` (12 testes); total 94, 88 passam, 6 pulados.
