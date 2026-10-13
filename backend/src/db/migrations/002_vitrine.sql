-- =====================================================================
-- 002 - Dados de vitrine dos produtos
-- Marca, preço "de" (promoção), destaque na home e especificações técnicas.
-- =====================================================================

ALTER TABLE products
  ADD COLUMN brand            VARCHAR(80),
  -- Preço antigo exibido riscado ("de R$ X por R$ Y"). Só é promoção se for maior que price.
  ADD COLUMN compare_at_price NUMERIC(10, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  ADD COLUMN featured         BOOLEAN NOT NULL DEFAULT FALSE,
  -- Ficha técnica livre: {"Conexão": "USB-C", "Peso": "69 g"}.
  -- JSON (e não JSONB) para manter a ordem em que as linhas foram escritas.
  ADD COLUMN specs            JSON    NOT NULL DEFAULT '{}'::json
                              CHECK (json_typeof(specs) = 'object');

CREATE INDEX idx_products_featured ON products(featured) WHERE featured;
