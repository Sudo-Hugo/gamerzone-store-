// Roda UMA vez antes de todos os testes: recria o schema do banco de teste.
require('./setupEnv');

module.exports = async () => {
  const { dropAll, migrate } = require('../src/db/migrate');
  const { closePool } = require('../src/db/pool');
  await dropAll();
  await migrate({ silent: true });
  await closePool();
};
