const { query } = require('../db/pool');
const { HttpError } = require('../utils/http');
const slugify = require('../utils/slugify');

const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id',
  price_desc: 'p.price DESC, p.id',
  name: 'p.name ASC',
  discount: 'discount_percent DESC, p.price ASC',
};

const BASE_SELECT = `
  SELECT p.id, p.name, p.slug, p.brand, p.description, p.price, p.compare_at_price,
         -- % de desconto calculado pelo banco (0 quando não está em promoção)
         CASE WHEN p.compare_at_price > p.price
              THEN ROUND((1 - p.price / p.compare_at_price) * 100)::INT ELSE 0 END AS discount_percent,
         p.stock, p.image_url, p.featured, p.specs, p.active,
         p.category_id, c.name AS category_name, c.slug AS category_slug,
         p.created_at, p.updated_at
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id`;

// Escapa % e _ para que a busca trate esses caracteres como texto comum
const escapeLike = (s) => s.replace(/[\\%_]/g, (ch) => `\\${ch}`);

// GET /api/products?search=&category=&brand=&min_price=&max_price=&on_sale=&featured=&sort=&page=&limit=
async function listProducts(req, res) {
  const { search, category, brand, min_price, max_price, on_sale, featured, sort = 'newest' } = req.query;
  const page = req.query.page || 1;
  const limit = req.query.limit || 12;

  // Filtros montados com parâmetros ($n) — o texto do usuário nunca entra no SQL.
  const where = ['p.active = TRUE'];
  const params = [];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replaceAll('?', `$${params.length}`));
  };

  if (search) add('(p.name ILIKE ? OR p.description ILIKE ? OR p.brand ILIKE ?)', `%${escapeLike(search)}%`);
  if (category) add('c.slug = ?', category);
  if (brand) add('p.brand = ?', brand);
  if (on_sale) where.push('p.compare_at_price > p.price');
  if (featured) where.push('p.featured = TRUE');
  if (min_price !== undefined) add('p.price >= ?', min_price);
  if (max_price !== undefined) add('p.price <= ?', max_price);

  const whereSql = `WHERE ${where.join(' AND ')}`;

  // O total usa os MESMOS filtros da listagem (paginação correta)
  const countResult = await query(
    `SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`,
    params
  );
  const total = countResult.rows[0].total;

  const listResult = await query(
    // Subconsulta para poder ordenar também pela coluna calculada discount_percent
    `SELECT * FROM (${BASE_SELECT} ${whereSql}) p ORDER BY ${SORTS[sort]}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit]
  );

  res.json({
    products: listResult.rows,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

// GET /api/products/:id
async function getProduct(req, res) {
  const { rows } = await query(`${BASE_SELECT} WHERE p.id = $1 AND p.active = TRUE`, [req.params.id]);
  if (!rows[0]) throw new HttpError(404, 'Produto não encontrado.');
  res.json({ product: rows[0] });
}

// GET /api/products/best-sellers?limit=8
// Mais vendidos de verdade: soma as unidades de pedidos não cancelados.
// Enquanto não há vendas, completa com destaques e lançamentos.
async function bestSellers(req, res) {
  const limit = req.query.limit || 8;
  const { rows } = await query(
    `SELECT b.*, COALESCE(s.sold, 0)::INT AS sold_count
     FROM (${BASE_SELECT} WHERE p.active = TRUE) b
     LEFT JOIN (
       SELECT oi.product_id, SUM(oi.quantity) AS sold
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.status <> 'cancelled'
       GROUP BY oi.product_id
     ) s ON s.product_id = b.id
     ORDER BY sold_count DESC, b.featured DESC, b.id
     LIMIT $1`,
    [limit]
  );
  res.json({ products: rows });
}

// GET /api/products/:id/related?limit=4  — mesma categoria, sem o próprio produto
async function relatedProducts(req, res) {
  const limit = req.query.limit || 4;
  const { rows } = await query(
    `${BASE_SELECT}
     WHERE p.active = TRUE AND p.id <> $1
       AND p.category_id = (SELECT category_id FROM products WHERE id = $1)
     ORDER BY p.featured DESC, p.id
     LIMIT $2`,
    [req.params.id, limit]
  );
  res.json({ products: rows });
}

// GET /api/products/brands  — marcas com produtos ativos (para o filtro)
async function listBrands(req, res) {
  const { rows } = await query(
    `SELECT brand AS name, COUNT(*)::INT AS product_count FROM products
     WHERE active = TRUE AND brand IS NOT NULL GROUP BY brand ORDER BY brand`
  );
  res.json({ brands: rows });
}

// GET /api/products/admin/all  (admin: inclui inativos)
async function listAllProducts(req, res) {
  const { rows } = await query(`${BASE_SELECT} ORDER BY p.active DESC, p.name`);
  res.json({ products: rows });
}

// Gera um slug único a partir do nome (adiciona -2, -3... se já existir)
async function uniqueSlug(name, ignoreId = 0) {
  const base = slugify(name) || 'produto';
  let slug = base;
  for (let i = 2; ; i++) {
    const { rows } = await query('SELECT 1 FROM products WHERE slug = $1 AND id <> $2', [slug, ignoreId]);
    if (!rows[0]) return slug;
    slug = `${base}-${i}`;
  }
}

async function ensureCategory(categoryId) {
  if (categoryId == null) return;
  const { rows } = await query('SELECT 1 FROM categories WHERE id = $1', [categoryId]);
  if (!rows[0]) throw new HttpError(400, 'Categoria não encontrada.');
}

// POST /api/products  (admin)
async function createProduct(req, res) {
  const {
    name, description = null, price, stock, category_id = null, image_url = null,
    brand = null, compare_at_price = null, featured = false, specs = {},
  } = req.body;
  await ensureCategory(category_id);

  const { rows } = await query(
    `INSERT INTO products (name, slug, description, price, stock, category_id, image_url,
                           brand, compare_at_price, featured, specs)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
    [name, await uniqueSlug(name), description || null, price, stock, category_id, image_url || null,
      brand || null, compare_at_price, featured, JSON.stringify(specs)]
  );
  const created = await query(`${BASE_SELECT} WHERE p.id = $1`, [rows[0].id]);
  res.status(201).json({ product: created.rows[0] });
}

// PUT /api/products/:id  (admin) — atualiza só os campos enviados.
// Diferente de COALESCE, permite limpar campos opcionais enviando null.
async function updateProduct(req, res) {
  const { id } = req.params;
  const exists = await query('SELECT id FROM products WHERE id = $1', [id]);
  if (!exists.rows[0]) throw new HttpError(404, 'Produto não encontrado.');

  const allowed = ['name', 'description', 'price', 'stock', 'category_id', 'image_url', 'active',
    'brand', 'compare_at_price', 'featured', 'specs'];
  const sets = [];
  const params = [];
  for (const field of allowed) {
    if (req.body[field] === undefined) continue;
    let value = req.body[field];
    if (field === 'category_id') await ensureCategory(value);
    if (['description', 'image_url', 'brand'].includes(field) && value === '') value = null;
    if (field === 'specs') value = JSON.stringify(value);
    params.push(value);
    sets.push(`${field} = $${params.length}`); // nome da coluna vem da lista fixa acima
  }
  if (req.body.name !== undefined) {
    params.push(await uniqueSlug(req.body.name, id));
    sets.push(`slug = $${params.length}`);
  }
  if (!sets.length) throw new HttpError(400, 'Nenhum campo para atualizar.');

  params.push(id);
  await query(`UPDATE products SET ${sets.join(', ')} WHERE id = $${params.length}`, params);
  const updated = await query(`${BASE_SELECT} WHERE p.id = $1`, [id]);
  res.json({ product: updated.rows[0] });
}

// DELETE /api/products/:id  (admin) — desativa (soft delete) para preservar o histórico
async function deleteProduct(req, res) {
  const { rows } = await query(
    'UPDATE products SET active = FALSE WHERE id = $1 RETURNING id, name',
    [req.params.id]
  );
  if (!rows[0]) throw new HttpError(404, 'Produto não encontrado.');
  // Remove dos carrinhos para ninguém tentar comprar um produto desativado
  await query('DELETE FROM cart_items WHERE product_id = $1', [req.params.id]);
  res.json({ message: `Produto "${rows[0].name}" desativado.` });
}

module.exports = { listProducts, getProduct, bestSellers, relatedProducts, listBrands, listAllProducts, createProduct, updateProduct, deleteProduct };
