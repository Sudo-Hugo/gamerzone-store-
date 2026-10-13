// Testes 1, 2 e 3: cadastro válido, cadastro inválido, login correto e incorreto.
const { api, resetData } = require('./helpers');
const { query, closePool } = require('../src/db/pool');

beforeEach(resetData);
afterAll(closePool);

describe('1. Cadastro de usuário válido', () => {
  test('cria o usuário, retorna token e grava a senha como hash bcrypt', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Maria Gamer', email: 'Maria@Teste.com', password: 'segredo123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({ id: expect.any(Number), name: 'Maria Gamer', email: 'maria@teste.com', role: 'customer' });
    expect(res.body.user.password).toBeUndefined();

    const { rows } = await query('SELECT password FROM users WHERE email = $1', ['maria@teste.com']);
    expect(rows[0].password).toMatch(/^\$2[aby]\$/); // hash bcrypt
    expect(rows[0].password).not.toContain('segredo123');
  });

  test('ignora tentativa de se cadastrar como admin', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Espertinho', email: 'hacker@teste.com', password: 'segredo123', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer');
  });
});

describe('2. Rejeição de cadastro inválido', () => {
  test.each([
    ['e-mail inválido', { name: 'Ana', email: 'nao-e-email', password: 'segredo123' }, 'email'],
    ['senha curta', { name: 'Ana', email: 'ana@teste.com', password: '123' }, 'password'],
    ['nome vazio', { name: '  ', email: 'ana@teste.com', password: 'segredo123' }, 'name'],
  ])('%s → 400 com o campo apontado', async (_, body, field) => {
    const res = await api().post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field)).toContain(field);
  });

  test('e-mail já cadastrado → 409', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Copia', email: 'cliente@gamerzone.com', password: 'segredo123' });
    expect(res.status).toBe(409);
  });

  test('JSON malformado → 400 (e não 500)', async () => {
    const res = await api().post('/api/auth/register').set('Content-Type', 'application/json').send('{quebrado');
    expect(res.status).toBe(400);
  });
});

describe('3. Login correto e incorreto', () => {
  test('credenciais corretas → 200 com token', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'admin@gamerzone.com', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');

    const me = await api().get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('admin@gamerzone.com');
  });

  test('senha errada → 401 com mensagem genérica', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'admin@gamerzone.com', password: 'errada' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('E-mail ou senha incorretos.');
    expect(res.body.token).toBeUndefined();
  });

  test('e-mail inexistente → 401 com a MESMA mensagem (não revela se o e-mail existe)', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'ninguem@teste.com', password: 'qualquer' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('E-mail ou senha incorretos.');
  });
});
