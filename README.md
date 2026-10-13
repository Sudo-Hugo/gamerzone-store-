# GamerZone Store

Loja virtual de produtos gamer: vitrine com banner de destaques, ofertas e mais vendidos, catálogo com busca e filtros (departamento, marca, preço, promoção), página de produto com ficha técnica, favoritos, carrinho, checkout com endereço de entrega, acompanhamento de pedidos e painel administrativo. Projeto acadêmico de Engenharia de Software.

| Camada | Tecnologia |
|---|---|
| Front-end | React 19 + Vite + React Router (`frontend/`) |
| Back-end | Node.js + Express 4, API REST em JSON (`backend/`) |
| Banco de dados | PostgreSQL 14+ com migrações em SQL puro |
| Autenticação | JWT (Bearer) + senhas com hash bcrypt |
| Testes | Jest + Supertest contra um banco PostgreSQL real (72 testes) |

Documentação complementar:

- [docs/API.md](docs/API.md): todos os endpoints com exemplos de requisição e resposta
- [docs/APRESENTACAO.md](docs/APRESENTACAO.md): arquitetura, diagramas, fluxos, roteiro de demonstração e perguntas do professor
- [docs/RELATORIO-TESTES.md](docs/RELATORIO-TESTES.md): resultado da última execução dos testes

---

## Estrutura de pastas

```
gamerzone/
├── backend/
│   ├── src/
│   │   ├── server.js              # sobe o servidor HTTP
│   │   ├── app.js                 # monta o Express (usado também pelos testes)
│   │   ├── config.js              # lê e valida as variáveis de ambiente
│   │   ├── controllers/           # regras de negócio por recurso
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   ├── categoryController.js
│   │   │   ├── cartController.js
│   │   │   ├── addressController.js
│   │   │   └── orderController.js
│   │   ├── routes/                # URLs + middlewares de cada recurso
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT, adminOnly
│   │   │   ├── validation.js      # regras do express-validator
│   │   │   └── errorHandler.js    # formato padrão de erros
│   │   ├── db/
│   │   │   ├── pool.js            # conexão e transações
│   │   │   ├── migrate.js         # runner de migrações
│   │   │   ├── seed.js            # dados de demonstração
│   │   │   └── migrations/
│   │   │       ├── 001_schema_inicial.sql
│   │   │       └── 002_vitrine.sql   # marca, promoção, destaque, ficha técnica
│   │   └── utils/
│   ├── tests/                     # 6 arquivos, 72 testes
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/products/           # ilustrações SVG dos 24 produtos
│   ├── public/categories/         # ilustrações dos 5 departamentos
│   ├── scripts/gerar_ilustracoes.py
│   ├── src/
│   │   ├── api/client.js          # único ponto de contato com a API
│   │   ├── api/services.js        # funções por recurso (produtos, carrinho...)
│   │   ├── context/               # sessão, carrinho, favoritos, notificações e diálogo de confirmação
│   │   ├── components/            # Layout, banner, vitrines, cards, estados de tela
│   │   ├── pages/                 # uma tela por arquivo (+ admin/)
│   │   ├── utils/format.js        # moeda, datas, status
│   │   └── styles.css
│   ├── .env.example
│   └── package.json
└── docs/
```

---

## Como rodar

### 1. Pré-requisitos

- Node.js 18 ou mais recente
- PostgreSQL 14 ou mais recente, rodando

### 2. Criar os bancos

No `psql` (ou pgAdmin):

```sql
CREATE DATABASE gamerzone_db;    -- usado pela aplicação
CREATE DATABASE gamerzone_test;  -- usado só pelos testes (é apagado a cada execução)
```

### 3. Back-end

```bash
cd backend
npm install
cp .env.example .env
```

Edite `backend/.env`:

- `DB_PASSWORD`: a senha do seu PostgreSQL
- `JWT_SECRET`: gere um valor com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

A API não sobe sem um `JWT_SECRET` de pelo menos 32 caracteres.

```bash
npm run db:setup   # cria as tabelas e carrega os dados de demonstração
npm run dev        # API em http://localhost:3000
```

Teste rápido: abra `http://localhost:3000/api/health`.

### 4. Front-end (em outro terminal)

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000/api
npm run dev            # site em http://localhost:5173
```

### Como o front se conecta ao back

- O front lê a URL da API de `VITE_API_URL` (`frontend/.env`). Todas as chamadas passam por `frontend/src/api/client.js`.
- O back só aceita requisições vindas das origens listadas em `CORS_ORIGIN` (`backend/.env`, padrão `http://localhost:5173`). Se mudar a porta do front, atualize as duas variáveis.

---

## Contas de demonstração (fictícias)

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | admin@gamerzone.com | admin123 |
| Cliente (já tem um endereço) | cliente@gamerzone.com | cliente123 |

O seed também cria 5 categorias e 24 produtos fictícios, com marca, preço promocional, destaque e ficha técnica. Para voltar ao estado inicial: `npm run db:reset` (apaga **tudo** do banco de desenvolvimento).

### Atualizando um banco da versão anterior

Quem já tinha rodado a versão com 14 produtos não precisa apagar nada:

```bash
cd backend
npm run db:setup   # aplica a migração 002 e completa os produtos com marca, imagem e ficha técnica
```

O seed só completa os produtos que ainda não têm ficha técnica; produtos editados pelo admin não são sobrescritos.

### Imagens dos produtos

As imagens são **ilustrações vetoriais (SVG) feitas para o projeto**: uma por produto em `frontend/public/products/` e uma por departamento em `frontend/public/categories/`. Elas não usam fotos de marcas reais (que têm direito autoral) e funcionam sem internet. Para regenerar ou criar novas, edite e rode `python3 frontend/scripts/gerar_ilustracoes.py`. No painel admin, qualquer produto pode receber uma URL de imagem `https://...` ou um arquivo local `/products/nome.svg`.

---

## Scripts do back-end

| Comando | O que faz |
|---|---|
| `npm run dev` | API com recarga automática (nodemon) |
| `npm start` | API em modo normal |
| `npm run migrate` | Aplica migrações pendentes |
| `npm run seed` | Insere os dados de demonstração (pode repetir, não duplica) |
| `npm run db:setup` | `migrate` + `seed` |
| `npm run db:reset` | Apaga todas as tabelas, recria e popula |
| `npm test` | Roda os 72 testes no banco `gamerzone_test` |

## Executando os testes

```bash
cd backend
npm test
```

Os testes usam o banco definido em `TEST_DB_NAME` (padrão `gamerzone_test`), nunca o de desenvolvimento. No início da execução o schema do banco de teste é recriado do zero, e antes de cada teste os dados são zerados e recarregados. O teste de persistência sobe o servidor de verdade na porta 3999, encerra e sobe de novo.

---

## Dependências

**Back-end:** `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `express-validator`, `cors`, `helmet`, `express-rate-limit`, `dotenv`. Desenvolvimento: `jest`, `supertest`, `nodemon`, `cross-env`.

**Front-end:** `react`, `react-dom`, `react-router-dom`, `@fontsource/chakra-petch`, `@fontsource/work-sans` (fontes embutidas, funcionam offline). Desenvolvimento: `vite`, `@vitejs/plugin-react`.

---

## Limitações e fora do escopo

- **Pagamento simulado:** o pedido é criado como "Aguardando pagamento" e não há integração com gateway nem coleta de dados de cartão.
- **Frete:** grátis e não calculado. O parcelamento exibido (até 10x, parcela mínima de R$ 20) é ilustrativo.
- **Imagens:** ilustrações próprias em SVG. O admin pode informar uma URL de imagem, mas não há upload de arquivos.
- **Favoritos:** ficam salvos no navegador (`localStorage`), separados por usuário. Não sincronizam entre dispositivos.
- **Mais vendidos:** calculado a partir dos pedidos não cancelados. Numa loja nova, sem vendas, a vitrine é completada pelos destaques.
- **Conta do usuário:** não há recuperação de senha por e-mail, edição de perfil nem verificação de e-mail.
- **Sessão:** o token JWT fica no `localStorage` (simples para o escopo). Ele não pode ser revogado individualmente antes de expirar (padrão: 1 dia), mas o papel e a existência do usuário são conferidos no banco a cada requisição.
- **Rate limit** guardado em memória: reinicia junto com o servidor e não é compartilhado entre várias instâncias.
- **Categorias:** a API tem CRUD completo de categorias, mas o painel admin do front ainda só gerencia produtos e pedidos.
- **Sem testes automatizados de front-end:** o front foi validado manualmente e por um roteiro com navegador headless durante o desenvolvimento.

## Equipe

| Integrante | Papel |
|---|---|
| Luiz (líder) | Back-end: API, rotas e regras de negócio |
| Luis | Front-end: React e integração com a API |
| Hugo | Banco de dados, testes e documentação |
