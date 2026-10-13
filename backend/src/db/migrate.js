// Runner de migrações em SQL puro.
// Cada arquivo em ./migrations é aplicado uma única vez, em ordem alfabética,
// dentro de uma transação. Os já aplicados ficam registrados em schema_migrations.
const fs = require('fs');
const path = require('path');
const { getPool, closePool } = require('./pool');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate({ silent = false } = {}) {
  const client = await getPool().connect();
  const log = (msg) => !silent && console.log(msg);
  try {
    // Trava global: evita duas execuções simultâneas aplicarem a mesma migração.
    await client.query('SELECT pg_advisory_lock(727274)');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name        VARCHAR(255) PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);

    const { rows } = await client.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((r) => r.name));
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        log(`  ✔ ${file}`);
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Falha na migração ${file}: ${err.message}`);
      }
    }
    log(count ? `${count} migração(ões) aplicada(s).` : 'Banco já está atualizado.');
  } finally {
    await client.query('SELECT pg_advisory_unlock(727274)').catch(() => {});
    client.release();
  }
}

// Apaga todas as tabelas (usado por `npm run db:reset` e pelos testes).
async function dropAll() {
  await getPool().query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
}

if (require.main === module) {
  const reset = process.argv.includes('--reset');
  (async () => {
    try {
      if (reset) {
        console.log('Apagando todas as tabelas...');
        await dropAll();
      }
      console.log('Aplicando migrações...');
      await migrate();
    } catch (err) {
      console.error('❌', err.message);
      process.exitCode = 1;
    } finally {
      await closePool();
    }
  })();
}

module.exports = { migrate, dropAll };
