# API — GamerZone Store

Base: `http://localhost:3000/api` · Formato: JSON · Autenticação: cabeçalho `Authorization: Bearer <token>`

## Convenções

- **Erros** têm sempre o formato `{ "error": "mensagem" }`. Erros de validação trazem também `details`:

  ```json
  { "error": "Dados inválidos.", "details": [{ "field": "email", "message": "E-mail inválido." }] }
  ```

- **Dinheiro** vem como texto com duas casas (`"349.90"`) para não perder precisão.
- **Códigos de status:**

| Código | Quando |
|---|---|
| 200 / 201 | Sucesso / recurso criado |
| 400 | Dados inválidos, JSON malformado, ID não numérico |
| 401 | Sem login, token inválido ou expirado, login incorreto |
| 403 | Logado, mas sem permissão (cliente em rota de admin) |
| 404 | Não encontrado, **ou pertence a outro usuário** |
| 409 | Conflito: e-mail duplicado, estoque insuficiente, mudança de status não permitida |
| 429 | Muitas tentativas de login ou cadastro |
| 500 | Erro interno (detalhes nunca são enviados ao cliente) |

Acesso: **Público** = sem login · **Logado** = qualquer usuário autenticado · **Admin** = só administradores.

---

## Autenticação — `/api/auth`

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/auth/register` | Público | Cria conta de cliente e já devolve o token |
| POST | `/auth/login` | Público | Devolve o token |
| GET | `/auth/me` | Logado | Dados do usuário logado |

```http
POST /api/auth/register
Content-Type: application/json

{ "name": "Maria Gamer", "email": "maria@teste.com", "password": "segredo123" }
```

```json
201 Created
{
  "user": { "id": 3, "name": "Maria Gamer", "email": "maria@teste.com", "role": "customer" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

Regras: nome com 2 a 100 caracteres, e-mail válido, senha com 6 a 72 caracteres. O campo `role` enviado é ignorado: toda conta nova é `customer`. Login e cadastro são limitados a 20 tentativas por IP a cada 15 minutos.

---

## Produtos — `/api/products`

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/products` | Público | Lista produtos ativos com filtros e paginação |
| GET | `/products/:id` | Público | Detalhe de um produto ativo |
| GET | `/products/admin/all` | Admin | Todos os produtos, inclusive desativados |
| POST | `/products` | Admin | Cria produto |
| PUT | `/products/:id` | Admin | Atualiza os campos enviados |
| DELETE | `/products/:id` | Admin | Desativa (não apaga, preserva o histórico de pedidos) |

**Filtros de `GET /products`:**

| Parâmetro | Exemplo | Regra |
|---|---|---|
| `search` | `mouse` | Procura no nome e na descrição, sem diferenciar maiúsculas |
| `category` | `perifericos` | Slug da categoria |
| `min_price`, `max_price` | `100`, `500` | Números ≥ 0 |
| `sort` | `price_asc` | `newest` (padrão), `price_asc`, `price_desc`, `name` |
| `page`, `limit` | `1`, `12` | `limit` entre 1 e 50 |

```http
GET /api/products?search=mouse&sort=price_asc&limit=2
```

```json
{
  "products": [
    {
      "id": 9, "name": "Mousepad Extended Grid XL", "slug": "mousepad-extended-grid-xl",
      "description": "Superfície de tecido 90×40 cm com bordas costuradas.",
      "price": "89.90", "stock": 60, "image_url": null, "active": true,
      "category_id": 3, "category_name": "Acessórios", "category_slug": "acessorios"
    }
  ],
  "pagination": { "page": 1, "limit": 2, "total": 2, "totalPages": 1 }
}
```

```http
POST /api/products
Authorization: Bearer <token_admin>

{ "name": "Mousepad XL", "description": "Superfície lisa.", "price": 89.9, "stock": 50, "category_id": 3,
  "image_url": "https://exemplo.com/mousepad.png" }
```

`image_url` só aceita `http://` ou `https://`. Em `PUT`, enviar `null` ou `""` limpa os campos opcionais, e `"active": true` reativa um produto desativado.

---

## Categorias — `/api/categories`

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/categories` | Público | Categorias com a contagem de produtos ativos |
| POST | `/categories` | Admin | `{ "name": "Streaming" }` |
| PUT | `/categories/:id` | Admin | Renomeia |
| DELETE | `/categories/:id` | Admin | Remove; os produtos ficam sem categoria |

---

## Carrinho — `/api/cart` (Logado)

O carrinho fica salvo no banco, um por usuário. Preços e totais são sempre calculados pelo servidor.

| Método | Rota | Corpo | Descrição |
|---|---|---|---|
| GET | `/cart` | — | Carrinho atual |
| POST | `/cart/items` | `{ "product_id": 1, "quantity": 2 }` | Adiciona (soma se já existir) |
| PATCH | `/cart/items/:productId` | `{ "quantity": 3 }` | Define a quantidade |
| DELETE | `/cart/items/:productId` | — | Remove o item |
| DELETE | `/cart` | — | Esvazia |

```json
{
  "cart": {
    "items": [
      { "product_id": 1, "name": "Teclado Mecânico RGB Nebula K1", "unit_price": "349.90",
        "stock": 25, "quantity": 2, "subtotal": "699.80", "category_slug": "perifericos" }
    ],
    "total": "699.80",
    "item_count": 2
  }
}
```

Quantidade entre 1 e 99 e nunca acima do estoque (senão **409**).

---

## Endereços — `/api/addresses` (Logado)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/addresses` | Endereços do usuário logado |
| POST | `/addresses` | Cria |
| DELETE | `/addresses/:id` | Remove (só os próprios) |

```json
{ "label": "Casa", "recipient": "Maria Gamer", "street": "Rua dos Jogadores", "number": "123",
  "complement": "Apto 4", "district": "Centro", "city": "Maringá", "state": "PR", "zip_code": "87000-000" }
```

O CEP é aceito com ou sem hífen e salvo só com os dígitos. `state` precisa ser uma UF válida.

---

## Pedidos — `/api/orders` (Logado)

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| POST | `/orders` | Logado | Finaliza a compra com o carrinho atual |
| GET | `/orders` | Logado | Pedidos do próprio usuário |
| GET | `/orders/:id` | Logado | Detalhe (o dono ou um admin) |
| PATCH | `/orders/:id/cancel` | Logado | O dono cancela, só enquanto `pending` |
| GET | `/orders/admin/all` | Admin | Todos os pedidos, com nome e e-mail do cliente |
| PATCH | `/orders/:id/status` | Admin | `{ "status": "processing" }` |

```http
POST /api/orders
Authorization: Bearer <token>

{ "address_id": 1 }
```

```json
201 Created
{
  "order": {
    "id": 1, "status": "pending", "total": "699.80",
    "ship_recipient": "Cliente Demo", "ship_street": "Rua dos Jogadores", "ship_number": "123",
    "ship_city": "Maringá", "ship_state": "PR", "ship_zip_code": "87000000",
    "items": [
      { "product_id": 1, "product_name": "Teclado Mecânico RGB Nebula K1",
        "unit_price": "349.90", "quantity": 2, "subtotal": "699.80" }
    ]
  }
}
```

O checkout roda numa única transação: confere o endereço, trava as linhas dos produtos (`FOR UPDATE`), revalida estoque, cria o pedido com cópia do nome, do preço e do endereço, baixa o estoque e esvazia o carrinho. Se qualquer passo falhar, nada é gravado.

**Transições de status permitidas:**

```
pending ──► processing ──► shipped ──► delivered
   │             │
   └──► cancelled ◄┘      (cancelar devolve os itens ao estoque)
```

Qualquer outra transição retorna **409**.

---

## Exemplo completo com curl

```bash
API=http://localhost:3000/api
TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"cliente@gamerzone.com","password":"cliente123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -s -X POST $API/cart/items -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"product_id":1,"quantity":2}'
curl -s $API/addresses -H "Authorization: Bearer $TOKEN"
curl -s -X POST $API/orders -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"address_id":1}'
```
