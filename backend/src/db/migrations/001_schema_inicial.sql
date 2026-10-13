-- =====================================================================
-- 001 - Schema inicial da GamerZone Store
-- Todas as tabelas, restrições de integridade, índices e triggers.
-- =====================================================================

-- Função genérica para manter a coluna updated_at sempre atualizada
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Usuários ────────────────────────────────────────────────────────
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,              -- hash bcrypt, nunca a senha pura
  role        VARCHAR(20)  NOT NULL DEFAULT 'customer'
              CHECK (role IN ('customer', 'admin')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Endereços de entrega (1 usuário : N endereços) ───────────────────
CREATE TABLE addresses (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label        VARCHAR(50)  NOT NULL DEFAULT 'Casa',
  recipient    VARCHAR(100) NOT NULL,
  street       VARCHAR(150) NOT NULL,
  number       VARCHAR(20)  NOT NULL,
  complement   VARCHAR(100),
  district     VARCHAR(100) NOT NULL,
  city         VARCHAR(100) NOT NULL,
  state        CHAR(2)      NOT NULL,
  zip_code     CHAR(8)      NOT NULL CHECK (zip_code ~ '^[0-9]{8}$'),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ─── Categorias ──────────────────────────────────────────────────────
CREATE TABLE categories (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(80) NOT NULL,
  slug  VARCHAR(80) NOT NULL UNIQUE
);

-- ─── Produtos (N produtos : 1 categoria) ─────────────────────────────
CREATE TABLE products (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(200)   NOT NULL,
  slug         VARCHAR(220)   NOT NULL UNIQUE,
  description  TEXT,
  price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock        INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image_url    VARCHAR(500),
  active       BOOLEAN        NOT NULL DEFAULT TRUE, -- "excluir" = desativar
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active   ON products(active);
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Carrinho (1 usuário : 1 carrinho : N itens) ─────────────────────
CREATE TABLE carts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE cart_items (
  id          SERIAL PRIMARY KEY,
  cart_id     INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cart_id, product_id)            -- o mesmo produto aparece uma vez só
);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- ─── Pedidos (1 usuário : N pedidos) ─────────────────────────────────
-- O endereço é copiado (snapshot) no momento da compra: se o cliente
-- editar ou apagar o endereço depois, o pedido continua correto.
CREATE TABLE orders (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status            VARCHAR(30) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total             NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  ship_recipient    VARCHAR(100) NOT NULL,
  ship_street       VARCHAR(150) NOT NULL,
  ship_number       VARCHAR(20)  NOT NULL,
  ship_complement   VARCHAR(100),
  ship_district     VARCHAR(100) NOT NULL,
  ship_city         VARCHAR(100) NOT NULL,
  ship_state        CHAR(2)      NOT NULL,
  ship_zip_code     CHAR(8)      NOT NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Itens do pedido (1 pedido : N itens) ────────────────────────────
-- Nome e preço unitário são copiados do produto no momento da compra.
-- O subtotal é calculado pelo próprio banco (coluna gerada).
CREATE TABLE order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name  VARCHAR(200)   NOT NULL,
  unit_price    NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  quantity      INTEGER        NOT NULL CHECK (quantity > 0),
  subtotal      NUMERIC(12, 2) GENERATED ALWAYS AS (unit_price * quantity) STORED
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
