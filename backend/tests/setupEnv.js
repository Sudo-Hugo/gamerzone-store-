// Executado antes de cada arquivo de teste (e no globalSetup).
// Garante que os testes NUNCA usem o banco de desenvolvimento.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'gamerzone_test';
process.env.AUTH_RATE_LIMIT = '10000';
process.env.BCRYPT_ROUNDS = '4'; // hash mais rápido só nos testes
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = 'segredo-de-teste-apenas-para-a-suite-automatizada-123';
}
