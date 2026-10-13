// Utilitários compartilhados pelos testes.
const request = require('supertest');
const app = require('../src/app');
const { query } = require('../src/db/pool');
const { seed } = require('../src/db/seed');

const api = () => request(app);

// Esvazia todas as tabelas, zera os IDs e recarrega os dados de demonstração.
async function resetData() {
  await query(`TRUNCATE order_items, orders, cart_items, carts, addresses, products, categories, users
               RESTART IDENTITY CASCADE`);
  await seed({ silent: true });
}

async function login(email, password) {
  const res = await api().post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`Login falhou para ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.token;
}

const loginAdmin = () => login('admin@gamerzone.com', 'admin123');
const loginCustomer = () => login('cliente@gamerzone.com', 'cliente123');

// Cria um cliente novo e retorna { token, user }
async function createCustomer(name = 'Outro Cliente', email = `outro${Date.now()}${Math.random()}@teste.com`) {
  const res = await api().post('/api/auth/register').send({ name, email, password: 'senha123' });
  if (res.status !== 201) throw new Error(`Cadastro falhou: ${JSON.stringify(res.body)}`);
  return res.body;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function createAddress(token) {
  const res = await api()
    .post('/api/addresses')
    .set(auth(token))
    .send({
      recipient: 'Teste da Silva', street: 'Rua A', number: '10', district: 'Centro',
      city: 'Maringá', state: 'PR', zip_code: '87000-000',
    });
  if (res.status !== 201) throw new Error(`Endereço falhou: ${JSON.stringify(res.body)}`);
  return res.body.address;
}

async function getProductBySlug(slug) {
  const { rows } = await query('SELECT * FROM products WHERE slug = $1', [slug]);
  return rows[0];
}

module.exports = { api, resetData, login, loginAdmin, loginCustomer, createCustomer, auth, createAddress, getProductBySlug };
