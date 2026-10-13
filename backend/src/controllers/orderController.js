const { query, withTransaction } = require('../db/pool');
const { HttpError } = require('../utils/http');
const { getCartId } = require('./cartController');

// Transições de status permitidas (máquina de estados do pedido)
const TRANSITIONS = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const ORDER_FIELDS = `o.id, o.user_id, o.status, o.total,
  o.ship_recipient, o.ship_street, o.ship_number, o.ship_complement, o.ship_district,
  o.ship_city, o.ship_state, o.ship_zip_code, o.created_at, o.updated_at`;

async function loadItems(db, orderId) {
  const { rows } = await db.query(
    `SELECT oi.product_id, oi.product_name, oi.unit_price, oi.quantity, oi.subtotal, p.image_url
     FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1 ORDER BY oi.id`,
    [orderId]
  );
  return rows;
}

// POST /api/orders  { address_id }
// Transforma o carrinho em pedido. Tudo acontece numa única transação:
// se qualquer passo falhar, nada é gravado (nem pedido, nem baixa de estoque).
async function createOrder(req, res) {
  const userId = req.user.id;
  const cartId = await getCartId(userId);

  const order = await withTransaction(async (db) => {
    // 1. Endereço precisa pertencer ao usuário
    const addr = await db.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [req.body.address_id, userId]);
    if (!addr.rows[0]) throw new HttpError(404, 'Endereço de entrega não encontrado.');
    const a = addr.rows[0];

    // 2. Trava as linhas dos produtos do carrinho (FOR UPDATE). Duas compras
    //    simultâneas do mesmo produto esperam uma pela outra, e a segunda já
    //    enxerga o estoque atualizado. A ordem por id evita deadlock.
    const { rows: items } = await db.query(
      `SELECT p.id, p.name, p.price, p.stock, p.active, ci.quantity
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY p.id
       FOR UPDATE OF p`,
      [cartId]
    );
    if (!items.length) throw new HttpError(400, 'Seu carrinho está vazio.');

    // 3. Revalida disponibilidade e estoque com os dados travados
    for (const it of items) {
      if (!it.active) throw new HttpError(409, `"${it.name}" não está mais disponível.`);
      if (it.quantity > it.stock) {
        throw new HttpError(409, `Estoque insuficiente para "${it.name}". Disponível: ${it.stock}.`);
      }
    }

    // 4. Cria o pedido com o total calculado pelo banco e o endereço copiado
    const { rows: [created] } = await db.query(
      `INSERT INTO orders (user_id, total, ship_recipient, ship_street, ship_number, ship_complement,
                           ship_district, ship_city, ship_state, ship_zip_code)
       SELECT $1, COALESCE(SUM(p.price * ci.quantity), 0), $3, $4, $5, $6, $7, $8, $9, $10
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $2
       RETURNING id`,
      [userId, cartId, a.recipient, a.street, a.number, a.complement, a.district, a.city, a.state, a.zip_code]
    );

    // 5. Copia os itens com nome e preço do momento da compra
    await db.query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
       SELECT $1, p.id, p.name, p.price, ci.quantity
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $2`,
      [created.id, cartId]
    );

    // 6. Baixa o estoque (o CHECK stock >= 0 do banco é a última barreira)
    await db.query(
      `UPDATE products p SET stock = p.stock - ci.quantity
       FROM cart_items ci WHERE ci.product_id = p.id AND ci.cart_id = $1`,
      [cartId]
    );

    // 7. Esvazia o carrinho
    await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    const { rows } = await db.query(`SELECT ${ORDER_FIELDS} FROM orders o WHERE o.id = $1`, [created.id]);
    return { ...rows[0], items: await loadItems(db, created.id) };
  });

  res.status(201).json({ order });
}

// GET /api/orders  — somente os pedidos do próprio usuário
async function listMyOrders(req, res) {
  const { rows } = await query(
    `SELECT ${ORDER_FIELDS},
            (SELECT COALESCE(SUM(quantity), 0)::INT FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o WHERE o.user_id = $1 ORDER BY o.created_at DESC, o.id DESC`,
    [req.user.id]
  );
  res.json({ orders: rows });
}

// GET /api/orders/admin/all  (admin)
async function listAllOrders(req, res) {
  const { rows } = await query(
    `SELECT ${ORDER_FIELDS}, u.name AS user_name, u.email AS user_email,
            (SELECT COALESCE(SUM(quantity), 0)::INT FROM order_items WHERE order_id = o.id) AS item_count
     FROM orders o JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC, o.id DESC`
  );
  res.json({ orders: rows });
}

// GET /api/orders/:id
// Pedido de outro usuário retorna 404 (não revela nem que o pedido existe).
async function getOrder(req, res) {
  const isAdmin = req.user.role === 'admin';
  const { rows } = await query(
    `SELECT ${ORDER_FIELDS} FROM orders o WHERE o.id = $1 AND ($2::BOOLEAN OR o.user_id = $3)`,
    [req.params.id, isAdmin, req.user.id]
  );
  if (!rows[0]) throw new HttpError(404, 'Pedido não encontrado.');
  res.json({ order: { ...rows[0], items: await loadItems({ query }, rows[0].id) } });
}

// Muda o status respeitando as transições. Cancelamento devolve o estoque.
async function changeStatus(orderId, newStatus, { ownerId } = {}) {
  return withTransaction(async (db) => {
    const params = [orderId];
    let sql = 'SELECT id, status FROM orders WHERE id = $1';
    if (ownerId) {
      params.push(ownerId);
      sql += ' AND user_id = $2';
    }
    const { rows } = await db.query(`${sql} FOR UPDATE`, params);
    const order = rows[0];
    if (!order) throw new HttpError(404, 'Pedido não encontrado.');

    if (!TRANSITIONS[order.status].includes(newStatus)) {
      throw new HttpError(409, `Não é possível mudar o pedido de "${order.status}" para "${newStatus}".`);
    }

    if (newStatus === 'cancelled') {
      await db.query(
        `UPDATE products p SET stock = p.stock + oi.quantity
         FROM order_items oi WHERE oi.product_id = p.id AND oi.order_id = $1`,
        [orderId]
      );
    }
    await db.query('UPDATE orders SET status = $1 WHERE id = $2', [newStatus, orderId]);
    const updated = await db.query(`SELECT ${ORDER_FIELDS} FROM orders o WHERE o.id = $1`, [orderId]);
    return { ...updated.rows[0], items: await loadItems(db, orderId) };
  });
}

// PATCH /api/orders/:id/cancel  — o cliente cancela o próprio pedido (só se 'pending')
async function cancelOrder(req, res) {
  const { rows } = await query('SELECT status FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!rows[0]) throw new HttpError(404, 'Pedido não encontrado.');
  if (rows[0].status !== 'pending') {
    throw new HttpError(409, 'Só é possível cancelar pedidos que ainda não foram processados.');
  }
  const order = await changeStatus(req.params.id, 'cancelled', { ownerId: req.user.id });
  res.json({ order });
}

// PATCH /api/orders/:id/status  { status }  (admin)
async function updateOrderStatus(req, res) {
  const order = await changeStatus(req.params.id, req.body.status);
  res.json({ order });
}

module.exports = { createOrder, listMyOrders, listAllOrders, getOrder, cancelOrder, updateOrderStatus };
