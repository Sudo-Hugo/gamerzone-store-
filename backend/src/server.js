// Ponto de entrada: verifica o banco e abre a porta HTTP.
const config = require('./config');
const app = require('./app');
const { query, closePool } = require('./db/pool');

async function start() {
  try {
    await query('SELECT 1');
  } catch (err) {
    console.error('❌ Não foi possível conectar ao PostgreSQL:', err.message);
    console.error('   Confira as variáveis DB_* no arquivo backend/.env');
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`🎮 GamerZone Store API em http://localhost:${config.port}  (ambiente: ${config.env})`);
  });

  // Encerramento limpo (Ctrl+C ou kill): fecha o servidor e o pool de conexões
  const shutdown = () => {
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
