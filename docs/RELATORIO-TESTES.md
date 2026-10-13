# Relatório de testes

Execução em 13/10/2026, 19:03:38 (horário de Brasília) com Node.js v22.22.0, PostgreSQL 16.15, Jest + Supertest.

**Resultado: 66 testes, 66 passaram, 0 falharam, 0 não executados.**

Para reproduzir: `cd backend && npm test`

## Resumo por cenário obrigatório

| Cenário | Arquivo | Testes | Resultado |
|---|---|---|---|
| 1. Cadastro de usuário válido | `tests/01-auth.test.js` | 2 | Passou |
| 2. Rejeição de cadastro inválido | `tests/01-auth.test.js` | 5 | Passou |
| 3. Login correto e incorreto | `tests/01-auth.test.js` | 3 | Passou |
| 4. Listagem e consulta de produtos | `tests/02-products.test.js` | 4 | Passou |
| 5. Busca e filtros | `tests/02-products.test.js` | 6 | Passou |
| 6. Inclusão e remoção de itens do carrinho | `tests/03-cart.test.js` | 6 | Passou |
| 7. Cálculo correto do total | `tests/03-cart.test.js` | 4 | Passou |
| 8. Tentativa de comprar quantidade superior ao estoque | `tests/04-orders.test.js` | 4 | Passou |
| 9. Finalização de pedido | `tests/04-orders.test.js` | 5 | Passou |
| 10. Persistência dos dados após reiniciar a aplicação | `tests/05-persistence.test.js` | 1 | Passou |
| 11. Bloqueio de funcionalidades administrativas para usuários comuns | `tests/06-security.test.js` | 20 | Passou |
| 12. Proteção dos dados e pedidos de cada usuário | `tests/06-security.test.js` | 6 | Passou |

## Detalhe de cada teste

### 1. Cadastro de usuário válido

- ✅ cria o usuário, retorna token e grava a senha como hash bcrypt
- ✅ ignora tentativa de se cadastrar como admin

### 2. Rejeição de cadastro inválido

- ✅ e-mail inválido → 400 com o campo apontado
- ✅ senha curta → 400 com o campo apontado
- ✅ nome vazio → 400 com o campo apontado
- ✅ e-mail já cadastrado → 409
- ✅ JSON malformado → 400 (e não 500)

### 3. Login correto e incorreto

- ✅ credenciais corretas → 200 com token
- ✅ senha errada → 401 com mensagem genérica
- ✅ e-mail inexistente → 401 com a MESMA mensagem (não revela se o e-mail existe)

### 4. Listagem e consulta de produtos

- ✅ lista produtos com paginação
- ✅ consulta um produto pelo id
- ✅ produto inexistente → 404; id inválido → 400
- ✅ produto desativado some da loja

### 5. Busca e filtros

- ✅ busca por texto no nome ou descrição (sem diferenciar maiúsculas)
- ✅ filtro por categoria
- ✅ filtro por faixa de preço e ordenação
- ✅ busca sem resultado retorna lista vazia
- ✅ caracteres curinga e tentativa de SQL injection são tratados como texto
- ✅ parâmetros inválidos → 400

### 6. Inclusão e remoção de itens do carrinho

- ✅ adiciona itens e lista o carrinho
- ✅ adicionar o mesmo produto de novo soma a quantidade (não duplica a linha)
- ✅ altera a quantidade e remove um item
- ✅ esvaziar o carrinho
- ✅ quantidade inválida e produto inexistente são rejeitados
- ✅ carrinho exige login

### 7. Cálculo correto do total

- ✅ total = soma de preço × quantidade, calculado no servidor
- ✅ sem erro de ponto flutuante (0,10 + 0,20 = 0,30)
- ✅ preço enviado pelo cliente é ignorado
- ✅ total acompanha mudança de preço do produto enquanto está no carrinho

### 8. Tentativa de comprar quantidade superior ao estoque

- ✅ carrinho não aceita mais unidades do que o estoque
- ✅ somar ao item existente também respeita o estoque
- ✅ estoque que acabou depois de ir para o carrinho é barrado no checkout, sem gravar nada
- ✅ duas compras simultâneas da última unidade: só uma passa (FOR UPDATE)

### 9. Finalização de pedido

- ✅ cria o pedido, baixa o estoque, esvazia o carrinho e guarda snapshot
- ✅ preço do pedido não muda se o produto mudar de preço depois
- ✅ carrinho vazio ou endereço inválido → erro
- ✅ cliente cancela pedido pendente e o estoque volta
- ✅ admin avança o status seguindo as transições permitidas

### 10. Persistência dos dados após reiniciar a aplicação

- ✅ usuário, endereço, carrinho e pedido sobrevivem ao reinício do servidor

### 11. Bloqueio de funcionalidades administrativas para usuários comuns

- ✅ cliente comum: post /api/products → 403
- ✅ cliente comum: put /api/products/1 → 403
- ✅ cliente comum: delete /api/products/1 → 403
- ✅ cliente comum: get /api/products/admin/all → 403
- ✅ cliente comum: post /api/categories → 403
- ✅ cliente comum: delete /api/categories/1 → 403
- ✅ cliente comum: get /api/orders/admin/all → 403
- ✅ cliente comum: patch /api/orders/1/status → 403
- ✅ sem login: post /api/products → 401
- ✅ sem login: put /api/products/1 → 401
- ✅ sem login: delete /api/products/1 → 401
- ✅ sem login: get /api/products/admin/all → 401
- ✅ sem login: post /api/categories → 401
- ✅ sem login: delete /api/categories/1 → 401
- ✅ sem login: get /api/orders/admin/all → 401
- ✅ sem login: patch /api/orders/1/status → 401
- ✅ nada foi alterado pelas tentativas
- ✅ admin consegue usar as mesmas rotas
- ✅ token forjado ou com assinatura errada → 401
- ✅ rebaixar um admin no banco vale na hora, mesmo com token antigo

### 12. Proteção dos dados e pedidos de cada usuário

- ✅ outro usuário não vê o pedido (404, sem revelar que existe)
- ✅ outro usuário não lista nem cancela o pedido
- ✅ o dono vê o próprio pedido
- ✅ endereços e carrinho são isolados por usuário
- ✅ nenhuma resposta expõe o hash da senha
- ✅ erro interno não vaza detalhes do banco

## Verificação de que os testes detectam falhas

Dois testes foram conferidos introduzindo o defeito de propósito no código e rodando de novo:

| Defeito introduzido | Teste que deveria pegar | Resultado com o defeito |
|---|---|---|
| Remover o `FOR UPDATE` do checkout | 8 › duas compras simultâneas da última unidade | Falhou (como esperado) |
| Remover o filtro de dono em `GET /orders/:id` | 12 › outro usuário não vê o pedido | Falhou (como esperado) |

Com o código correto, os dois voltaram a passar.

## O que não é coberto por testes automatizados

- **Front-end:** não há testes automatizados de interface. O fluxo completo (catálogo, busca, login, carrinho, checkout, pedido, painel admin, layout mobile) foi verificado durante o desenvolvimento com um roteiro em navegador headless (Playwright) contra a API real, sem erros no console. Esse roteiro não faz parte do repositório.
- **Rate limit de login:** desativado na suíte (limite alto) para não interferir nos outros testes.
