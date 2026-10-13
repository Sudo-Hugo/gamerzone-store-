// Centraliza a leitura das variáveis de ambiente e valida as obrigatórias.
// Lê backend/.env. Em testes, tests/setupEnv.js força o banco gamerzone_test
// antes deste arquivo ser carregado (variáveis já definidas não são sobrescritas).
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'gamerzone_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  // Lista separada por vírgula com as origens do front-end autorizadas
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
};

// Falha cedo e com mensagem clara se o segredo do JWT estiver ausente ou fraco.
if (!config.jwt.secret || config.jwt.secret.length < 32) {
  throw new Error(
    'JWT_SECRET ausente ou curto demais (mínimo 32 caracteres). ' +
      'Gere um com: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
}

module.exports = config;
