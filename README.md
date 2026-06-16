# 🎮 GamerZone Store — Backend API

Backend REST API da loja virtual gamer, desenvolvida com **Node.js + Express + PostgreSQL**.

---

## 📁 Estrutura do Projeto

```
gamerzone-backend/
├── src/
│   ├── app.js                   # Entrada da aplicação
│   ├── routes/
│   │   ├── auth.js              # Rotas de autenticação
│   │   ├── products.js          # Rotas de produtos
│   │   └── orders.js            # Rotas de pedidos
│   ├── controllers/
│   │   ├── authController.js    # Lógica de login/registro
│   │   ├── productController.js # CRUD de produtos
│   │   └── orderController.js   # Criação e listagem de pedidos
│   ├── middleware/
│   │   ├── auth.js              # Verificação de token JWT
│   │   └── validation.js        # Validação de dados com express-validator
│   └── db/
│       ├── connection.js        # Conexão com o PostgreSQL
│       └── setup.js             # Script de criação de tabelas e dados iniciais
├── .env.example                 # Modelo de variáveis de ambiente
├── .gitignore
└── package.json
```

---

## ⚙️ Como Rodar o Projeto

### 1. Pré-requisitos
- [Node.js](https://nodejs.org) v18+
- [PostgreSQL](https://www.postgresql.org/) instalado e rodando

### 2. Clonar e instalar dependências
```bash
git clone https://github.com/seu-usuario/gamerzone-backend.git
cd gamerzone-backend
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env com as suas credenciais do PostgreSQL
```

### 4. Criar o banco de dados (no PostgreSQL)
```sql
CREATE DATABASE gamerzone_db;
```

### 5. Criar as tabelas e dados iniciais
```bash
npm run db:setup
```

### 6. Iniciar o servidor
```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Produção
npm start
```

Acesse: `http://localhost:3000`

---

## 🔌 Endpoints da API

### Status
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/` | Verifica se a API está online |

---

### 🔑 Autenticação — `/api/auth`
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/api/auth/register` | Público | Cadastra novo usuário |
| POST | `/api/auth/login` | Público | Faz login e retorna JWT |
| GET | `/api/auth/me` | Logado | Retorna dados do usuário logado |

**Exemplo — Registro:**
```json
POST /api/auth/register
{
  "name": "Hugo Silva",
  "email": "hugo@email.com",
  "password": "minhasenha123"
}
```

**Exemplo — Login:**
```json
POST /api/auth/login
{
  "email": "hugo@email.com",
  "password": "minhasenha123"
}
```
> Resposta inclui um `token` JWT. Use nas rotas protegidas:
> `Authorization: Bearer <token>`

---

### 🎮 Produtos — `/api/products`
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/api/products` | Público | Lista todos os produtos |
| GET | `/api/products/:id` | Público | Detalhes de um produto |
| GET | `/api/products/categories` | Público | Lista categorias |
| POST | `/api/products` | Admin | Cria produto |
| PUT | `/api/products/:id` | Admin | Atualiza produto |
| DELETE | `/api/products/:id` | Admin | Remove produto |

**Filtros disponíveis (GET /api/products):**
```
?category=perifericos
?search=teclado
?min_price=100&max_price=500
?page=1&limit=12
```

**Exemplo — Criar produto (admin):**
```json
POST /api/products
Authorization: Bearer <token_admin>

{
  "name": "Mousepad XL Gamer",
  "description": "Mousepad extra grande com superfície lisa.",
  "price": 89.90,
  "stock": 50,
  "category_id": 3
}
```

---

### 📦 Pedidos — `/api/orders`
| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/api/orders` | Logado | Cria pedido |
| GET | `/api/orders` | Logado | Lista pedidos do usuário (admin vê todos) |
| GET | `/api/orders/:id` | Logado | Detalhes de um pedido |
| PATCH | `/api/orders/:id/status` | Admin | Atualiza status do pedido |

**Exemplo — Criar pedido:**
```json
POST /api/orders
Authorization: Bearer <token>

{
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

**Status possíveis de pedido:**
`pending` → `processing` → `shipped` → `delivered` / `cancelled`

---

## 👤 Admin padrão (criado pelo setup)

| Campo | Valor |
|-------|-------|
| Email | admin@gamerzone.com |
| Senha | admin123 |

> ⚠️ Troque a senha em produção!

---

## 🗄️ Banco de Dados — Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários cadastrados |
| `categories` | Categorias de produtos |
| `products` | Catálogo de produtos |
| `orders` | Pedidos realizados |
| `order_items` | Itens de cada pedido |

---

## 👥 Equipe

| Integrante | Função |
|------------|--------|
| Luiz (Líder) | Backend — API, rotas e regras de negócio |
| Luis | Frontend — React e integração com a API |
| Hugo | Banco de dados, testes e documentação |
