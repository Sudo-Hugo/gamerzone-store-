// Carrinho persistido no banco: fica salvo entre sessões e dispositivos.
// Preços e totais são sempre calculados no servidor, a partir da tabela products.
const { query } = require('../db/pool');
const { HttpError } = require('../utils/http');

// Retorna o id do carrinho do usuário, criando-o na primeira vez.
async function getCartId(userId) {
  const { rows } = await query(
    `INSERT INTO carts (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING id`,
    [userId]
  );
  return rows[0].id;
}

// Monta a resposta completa do carrinho (itens + total calculado no SQL)
async function buildCart(cartId) {
  const { rows: items } = await query(
    `SELECT ci.product_id, p.name, p.slug, p.image_url, c.slug AS category_slug,
            p.price AS unit_price, p.stock,
            ci.quantity, (p.price * ci.quantity)::NUMERIC(12,2) AS subtotal
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE ci.cart_id = $1 AND p.active = TRUE
     ORDER BY ci.added_at, ci.id`,
    [cartId]
  );
  const { rows } = await query(
    `SELECT COALESCE(SUM(p.price * ci.quantity), 0)::NUMERIC(12,2) AS total,
            COALESCE(SUM(ci.quantity), 0)::INT AS item_count
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1 AND p.active = TRUE`,
    [cartId]
  );
  return { items, total: rows[0].total, item_count: rows[0].item_count };
}

async function findActiveProduct(productId) {
  const { rows } = await query('SELECT id, name, stock FROM products WHERE id = $1 AND active = TRUE', [productId]);
  if (!rows[0]) throw new HttpError(404, 'Produto não encontrado.');
  return rows[0];
}

function assertStock(product, quantity) {
  if (quantity > product.stock) {
    throw new HttpError(
      409,
      product.stock === 0
        ? `"${product.name}" está esgotado.`
        : `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}.`
    );
  }
}

// GET /api/cart
async function getCart(req, res) {
  const cartId = await getCartId(req.user.id);
  res.json({ cart: await buildCart(cartId) });
}

// POST /api/cart/items  { product_id, quantity }  — soma à quantidade existente
async function addItem(req, res) {
  const { product_id, quantity = 1 } = req.body;
  const cartId = await getCartId(req.user.id);
  const product = await findActiveProduct(product_id);

  const existing = await query('SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, product_id]);
  const newQuantity = (existing.rows[0]?.quantity || 0) + quantity;
  if (newQuantity > 99) throw new HttpError(400, 'Limite de 99 unidades por produto.');
  assertStock(product, newQuantity);

  await query(
    `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    [cartId, product_id, newQuantity]
  );
  res.status(201).json({ cart: await buildCart(cartId) });
}

// PATCH /api/cart/items/:productId  { quantity }  — define a quantidade
async function updateItem(req, res) {
  const { productId } = req.params;
  const cartId = await getCartId(req.user.id);
  const product = await findActiveProduct(productId);
  assertStock(product, req.body.quantity);

  const { rowCount } = await query(
    'UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3',
    [req.body.quantity, cartId, productId]
  );
  if (!rowCount) throw new HttpError(404, 'Item não está no carrinho.');
  res.json({ cart: await buildCart(cartId) });
}

// DELETE /api/cart/items/:productId
async function removeItem(req, res) {
  const cartId = await getCartId(req.user.id);
  const { rowCount } = await query(
    'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
    [cartId, req.params.productId]
  );
  if (!rowCount) throw new HttpError(404, 'Item não está no carrinho.');
  res.json({ cart: await buildCart(cartId) });
}

// DELETE /api/cart
async function clearCart(req, res) {
  const cartId = await getCartId(req.user.id);
  await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
  res.json({ cart: await buildCart(cartId) });
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, getCartId };
