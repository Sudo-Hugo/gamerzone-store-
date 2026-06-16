const { query } = require('../db/connection');

// GET /api/products  (com filtros opcionais via query string)
async function listProducts(req, res) {
  try {
    const { category, search, min_price, max_price, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT p.id, p.name, p.description, p.price, p.stock, p.image_url,
             c.id AS category_id, c.name AS category_name,
             p.created_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      params.push(category);
      sql += ` AND c.slug = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }
    if (min_price) {
      params.push(min_price);
      sql += ` AND p.price >= $${params.length}`;
    }
    if (max_price) {
      params.push(max_price);
      sql += ` AND p.price <= $${params.length}`;
    }

    sql += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) FROM products', []);

    return res.json({
      products: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (err) {
    console.error('Erro ao listar produtos:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
}

// GET /api/products/:id
async function getProduct(req, res) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar produto.' });
  }
}

// POST /api/products  (admin)
async function createProduct(req, res) {
  try {
    const { name, description, price, stock, category_id, image_url } = req.body;

    const result = await query(
      `INSERT INTO products (name, description, price, stock, category_id, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description || null, price, stock || 0, category_id || null, image_url || null]
    );

    return res.status(201).json({
      message: 'Produto criado com sucesso!',
      product: result.rows[0]
    });
  } catch (err) {
    console.error('Erro ao criar produto:', err.message);
    return res.status(500).json({ error: 'Erro ao criar produto.' });
  }
}

// PUT /api/products/:id  (admin)
async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category_id, image_url } = req.body;

    // Verifica se existe
    const exists = await query('SELECT id FROM products WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const result = await query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           stock = COALESCE($4, stock),
           category_id = COALESCE($5, category_id),
           image_url = COALESCE($6, image_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, description, price, stock, category_id, image_url, id]
    );

    return res.json({
      message: 'Produto atualizado com sucesso!',
      product: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
}

// DELETE /api/products/:id  (admin)
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id, name', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    return res.json({ message: `Produto "${result.rows[0].name}" removido com sucesso.` });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao remover produto.' });
  }
}

// GET /api/categories
async function listCategories(req, res) {
  try {
    const result = await query(
      'SELECT c.*, COUNT(p.id) AS product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.name',
      []
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, listCategories };
