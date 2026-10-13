const { query } = require('../db/pool');
const { HttpError } = require('../utils/http');

const FIELDS = 'id, label, recipient, street, number, complement, district, city, state, zip_code, created_at';

// GET /api/addresses  — somente os endereços do usuário logado
async function listAddresses(req, res) {
  const { rows } = await query(
    `SELECT ${FIELDS} FROM addresses WHERE user_id = $1 ORDER BY created_at DESC, id DESC`,
    [req.user.id]
  );
  res.json({ addresses: rows });
}

// POST /api/addresses
async function createAddress(req, res) {
  const { label = 'Casa', recipient, street, number, complement = null, district, city, state, zip_code } = req.body;
  const { rows } = await query(
    `INSERT INTO addresses (user_id, label, recipient, street, number, complement, district, city, state, zip_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING ${FIELDS}`,
    [req.user.id, label, recipient, street, number, complement || null, district, city, state, zip_code]
  );
  res.status(201).json({ address: rows[0] });
}

// DELETE /api/addresses/:id  — o filtro por user_id impede apagar endereço de outra pessoa
async function deleteAddress(req, res) {
  const { rowCount } = await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!rowCount) throw new HttpError(404, 'Endereço não encontrado.');
  res.json({ message: 'Endereço removido.' });
}

module.exports = { listAddresses, createAddress, deleteAddress };
