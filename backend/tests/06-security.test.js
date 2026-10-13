// Testes 11 e 12: bloqueio de funções administrativas para usuários comuns
// e proteção dos dados e pedidos de cada usuário.
const jwt = require('jsonwebtoken');
const { api, resetData, loginCustomer, loginAdmin, createCustomer, auth, createAddress } = require('./helpers');
const { query, closePool } = require('../src/db/pool');

let cliente;
beforeEach(async () => {
  await resetData();
  cliente = await loginCustomer();
});
afterAll(closePool);

describe('11. Bloqueio de funcionalidades administrativas para usuários comuns', () => {
  const adminRoutes = [
    ['post', '/api/products', { name: 'Hack', price: 1, stock: 1 }],
    ['put', '/api/products/1', { price: 0.01 }],
    ['delete', '/api/products/1', {}],
    ['get', '/api/products/admin/all', {}],
    ['post', '/api/categories', { name: 'Hack' }],
    ['delete', '/api/categories/1', {}],
    ['get', '/api/orders/admin/all', {}],
    ['patch', '/api/orders/1/status', { status: 'delivered' }],
  ];

  test.each(adminRoutes)('cliente comum: %s %s → 403', async (method, url, body) => {
    const res = await api()[method](url).set(auth(cliente)).send(body);
    expect(res.status).toBe(403);
  });

  test.each(adminRoutes)('sem login: %s %s → 401', async (method, url, body) => {
    const res = await api()[method](url).send(body);
    expect(res.status).toBe(401);
  });

  test('nada foi alterado pelas tentativas', async () => {
    for (const [method, url, body] of adminRoutes) await api()[method](url).set(auth(cliente)).send(body);
    const { rows } = await query('SELECT price, active FROM products WHERE id = 1');
    expect(rows[0]).toEqual({ price: '349.90', active: true });
  });

  test('admin consegue usar as mesmas rotas', async () => {
    const admin = await loginAdmin();
    const res = await api().post('/api/products').set(auth(admin)).send({ name: 'Novo Produto', price: 10, stock: 5 });
    expect(res.status).toBe(201);
  });

  test('token forjado ou com assinatura errada → 401', async () => {
    const forjado = jwt.sign({ sub: 1 }, 'segredo-errado-que-o-atacante-inventou-xxxxxxxx');
    expect((await api().get('/api/products/admin/all').set(auth(forjado))).status).toBe(401);

    const semAssinatura = jwt.sign({ sub: 1 }, '', { algorithm: 'none' });
    expect((await api().get('/api/products/admin/all').set(auth(semAssinatura))).status).toBe(401);
  });

  test('rebaixar um admin no banco vale na hora, mesmo com token antigo', async () => {
    const admin = await loginAdmin();
    await query("UPDATE users SET role = 'customer' WHERE email = 'admin@gamerzone.com'");
    expect((await api().get('/api/orders/admin/all').set(auth(admin))).status).toBe(403);
  });
});

describe('12. Proteção dos dados e pedidos de cada usuário', () => {
  let outro;
  let pedidoDoCliente;

  beforeEach(async () => {
    const addr = await createAddress(cliente);
    await api().post('/api/cart/items').set(auth(cliente)).send({ product_id: 1, quantity: 1 });
    pedidoDoCliente = (await api().post('/api/orders').set(auth(cliente)).send({ address_id: addr.id })).body.order;
    outro = (await createCustomer()).token;
  });

  test('outro usuário não vê o pedido (404, sem revelar que existe)', async () => {
    const res = await api().get(`/api/orders/${pedidoDoCliente.id}`).set(auth(outro));
    expect(res.status).toBe(404);
    expect(res.body.order).toBeUndefined();
  });

  test('outro usuário não lista nem cancela o pedido', async () => {
    expect((await api().get('/api/orders').set(auth(outro))).body.orders).toEqual([]);
    expect((await api().patch(`/api/orders/${pedidoDoCliente.id}/cancel`).set(auth(outro))).status).toBe(404);
    const { rows } = await query('SELECT status FROM orders WHERE id = $1', [pedidoDoCliente.id]);
    expect(rows[0].status).toBe('pending');
  });

  test('o dono vê o próprio pedido', async () => {
    expect((await api().get(`/api/orders/${pedidoDoCliente.id}`).set(auth(cliente))).status).toBe(200);
  });

  test('endereços e carrinho são isolados por usuário', async () => {
    const enderecosCliente = (await api().get('/api/addresses').set(auth(cliente))).body.addresses;
    expect((await api().get('/api/addresses').set(auth(outro))).body.addresses).toEqual([]);

    // Não dá para apagar nem usar o endereço de outra pessoa
    const alvo = enderecosCliente[0].id;
    expect((await api().delete(`/api/addresses/${alvo}`).set(auth(outro))).status).toBe(404);
    await api().post('/api/cart/items').set(auth(outro)).send({ product_id: 2, quantity: 1 });
    expect((await api().post('/api/orders').set(auth(outro)).send({ address_id: alvo })).status).toBe(404);

    // Carrinho de um não aparece no do outro
    await api().post('/api/cart/items').set(auth(cliente)).send({ product_id: 3, quantity: 1 });
    const carrinhoOutro = (await api().get('/api/cart').set(auth(outro))).body.cart.items.map((i) => i.product_id);
    expect(carrinhoOutro).toEqual([2]);
  });

  test('nenhuma resposta expõe o hash da senha', async () => {
    const respostas = [
      await api().post('/api/auth/login').send({ email: 'cliente@gamerzone.com', password: 'cliente123' }),
      await api().get('/api/auth/me').set(auth(cliente)),
      await api().get('/api/orders/admin/all').set(auth(await loginAdmin())),
    ];
    for (const r of respostas) expect(JSON.stringify(r.body)).not.toMatch(/\$2[aby]\$|"password"/);
  });

  test('erro interno não vaza detalhes do banco', async () => {
    const res = await api().get('/api/rota-que-nao-existe');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Rota não encontrada.' });
  });
});
