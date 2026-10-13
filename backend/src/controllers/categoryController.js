const { query } = require('../db/pool');
const { HttpError } = require('../utils/http');
const slugify = require('../utils/slugify');

// GET /api/categories
async function listCategories(req, res) {
  const { rows } = await query(
    `SELECT c.id, c.name, c.slug, COUNT(p.id) AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.active = TRUE
     GROUP BY c.id ORDER BY c.name`
  );
  res.json({ categories: rows });
}

// POST /api/categories  (admin)
async function createCategory(req, res) {
  const { name } = req.body;
  const { rows } = await query(
    `INSERT INTO categories (name, slug) VALUES ($1, $2)
     ON CONFLICT (slug) DO NOTHING RETURNING id, name, slug`,
    [name, slugify(name)]
  );
  if (!rows[0]) throw new HttpError(409, 'Já existe uma categoria com esse nome.');
  res.status(201).json({ category: rows[0] });
}

// PUT /api/categories/:id  (admin)
async function updateCategory(req, res) {
  const slug = slugify(req.body.name);
  const dup = await query('SELECT 1 FROM categories WHERE slug = $1 AND id <> $2', [slug, req.params.id]);
  if (dup.rows[0]) throw new HttpError(409, 'Já existe uma categoria com esse nome.');

  const { rows } = await query(
    'UPDATE categories SET name = $1, slug = $2 WHERE id = $3 RETURNING id, name, slug',
    [req.body.name, slug, req.params.id]
  );
  if (!rows[0]) throw new HttpError(404, 'Categoria não encontrada.');
  res.json({ category: rows[0] });
}

// DELETE /api/categories/:id  (admin) — os produtos ficam sem categoria (ON DELETE SET NULL)
async function deleteCategory(req, res) {
  const { rows } = await query('DELETE FROM categories WHERE id = $1 RETURNING name', [req.params.id]);
  if (!rows[0]) throw new HttpError(404, 'Categoria não encontrada.');
  res.json({ message: `Categoria "${rows[0].name}" removida.` });
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
