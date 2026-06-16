const { query, pool } = require('../db/connection');

// POST /api/orders  (usuário logado)
async function createOrder(req, res) {
  const client = await pool.connect();
  try {
    const { items } = req.body; // [{ product_id, quantity }]
    const userId = req.user.id;

    await client.query('BEGIN');

    let total = 0;
    const resolvedItems = [];

    // Valida cada item e calcula o total
    for (const item of items) {
      const productResult = await client.query(
        'SELECT id, name, price, stock FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Produto ID ${item.product_id} não encontrado.` });
      }

      const product = productResult.rows[0];

      if (product.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}`
        });
      }

      total += product.price * item.quantity;
      resolvedItems.push({ ...product, quantity: item.quantity });
    }

    // Cria o pedido
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING id',
      [userId, total.toFixed(2)]
    );
    const orderId = orderResult.rows[0].id;

    // Insere os itens e deduz o estoque
    for (const item of resolvedItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.id, item.quantity, item.price]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Pedido criado com sucesso!',
      order: { id: orderId, total: total.toFixed(2), status: 'pending', items: resolvedItems }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar pedido:', err.message);
    return res.status(500).json({ error: 'Erro ao processar pedido.' });
  } finally {
    client.release();
  }
}

// GET /api/orders  (admin vê todos; cliente vê os seus)
async function listOrders(req, res) {
  try {
    let sql, params;

    if (req.user.role === 'admin') {
      sql = `SELECT o.*, u.name AS user_name, u.email AS user_email
             FROM orders o JOIN users u ON o.user_id = u.id
             ORDER BY o.created_at DESC`;
      params = [];
    } else {
      sql = `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`;
      params = [req.user.id];
    }

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
}

// GET /api/orders/:id  (detalhe do pedido com itens)
async function getOrder(req, res) {
  try {
    const { id } = req.params;

    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    const order = orderResult.rows[0];

    // Garante que o cliente só veja os próprios pedidos
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const itemsResult = await query(
      `SELECT oi.quantity, oi.unit_price,
              p.id AS product_id, p.name, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    return res.json({ ...order, items: itemsResult.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar pedido.' });
  }
}

// PATCH /api/orders/:id/status  (admin)
async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatus = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatus.includes(status)) {
      return res.status(400).json({ error: `Status inválido. Use: ${validStatus.join(', ')}` });
    }

    const result = await query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado.' });
    }

    return res.json({ message: 'Status atualizado.', order: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar status.' });
  }
}

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus };
