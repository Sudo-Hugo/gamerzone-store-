// Conexão com o PostgreSQL via pool do driver `pg`.
// Todas as queries usam parâmetros ($1, $2...) — nunca concatenação de strings.
const { Pool, types } = require('pg');
const config = require('../config');

// COUNT(*) retorna BIGINT; convertemos para número JS (contagens são pequenas).
types.setTypeParser(20, (v) => parseInt(v, 10));
// NUMERIC continua como string ("349.90") para não perder precisão em dinheiro.

let pool = null;

function getPool() {
  if (!pool) {
    pool = new Pool(config.db);
    // Erro numa conexão ociosa não deve derrubar o servidor inteiro.
    pool.on('error', (err) => {
      console.error('Erro inesperado no pool do PostgreSQL:', err.message);
    });
  }
  return pool;
}

function query(text, params) {
  return getPool().query(text, params);
}

// Executa `fn` dentro de uma transação. Se lançar erro, faz ROLLBACK.
async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function closePool() {
  if (pool) {
    const p = pool;
    pool = null;
    await p.end();
  }
}

module.exports = { getPool, query, withTransaction, closePool };
