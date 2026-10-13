// Testes 4 e 5: listagem/consulta de produtos, busca e filtros.
const { api, resetData, loginAdmin, auth, getProductBySlug } = require('./helpers');
const { closePool } = require('../src/db/pool');

beforeEach(resetData);
afterAll(closePool);

describe('4. Listagem e consulta de produtos', () => {
  test('lista produtos com paginação', async () => {
    const res = await api().get('/api/products').query({ limit: 5 });
    expect(res.status).toBe(200);
    expect(res.body.products).toHaveLength(5);
    expect(res.body.pagination).toEqual({ page: 1, limit: 5, total: 14, totalPages: 3 });
    expect(res.body.products[0]).toHaveProperty('category_name');
  });

  test('consulta um produto pelo id', async () => {
    const mouse = await getProductBySlug('mouse-gamer-vortex-16000-dpi');
    const res = await api().get(`/api/products/${mouse.id}`);
    expect(res.status).toBe(200);
    expect(res.body.product).toMatchObject({ id: mouse.id, name: 'Mouse Gamer Vortex 16000 DPI', price: '189.90' });
  });

  test('produto inexistente → 404; id inválido → 400', async () => {
    expect((await api().get('/api/products/99999')).status).toBe(404);
    expect((await api().get('/api/products/abc')).status).toBe(400);
  });

  test('produto desativado some da loja', async () => {
    const token = await loginAdmin();
    const mouse = await getProductBySlug('mouse-gamer-vortex-16000-dpi');
    await api().delete(`/api/products/${mouse.id}`).set(auth(token)).expect(200);

    expect((await api().get(`/api/products/${mouse.id}`)).status).toBe(404);
    const list = await api().get('/api/products').query({ limit: 50 });
    expect(list.body.products.map((p) => p.id)).not.toContain(mouse.id);
  });
});

describe('5. Busca e filtros', () => {
  test('busca por texto no nome ou descrição (sem diferenciar maiúsculas)', async () => {
    const res = await api().get('/api/products').query({ search: 'MOUSE' });
    expect(res.status).toBe(200);
    const names = res.body.products.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['Mouse Gamer Vortex 16000 DPI', 'Mousepad Extended Grid XL']));
    expect(res.body.pagination.total).toBe(names.length); // total respeita o filtro
  });

  test('filtro por categoria', async () => {
    const res = await api().get('/api/products').query({ category: 'hardware' });
    expect(res.body.products.length).toBe(3);
    res.body.products.forEach((p) => expect(p.category_slug).toBe('hardware'));
  });

  test('filtro por faixa de preço e ordenação', async () => {
    const res = await api().get('/api/products').query({ min_price: 100, max_price: 300, sort: 'price_asc', limit: 50 });
    const prices = res.body.products.map((p) => Number(p.price));
    expect(prices.length).toBeGreaterThan(0);
    prices.forEach((p) => expect(p >= 100 && p <= 300).toBe(true));
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('busca sem resultado retorna lista vazia', async () => {
    const res = await api().get('/api/products').query({ search: 'produto-que-nao-existe' });
    expect(res.status).toBe(200);
    expect(res.body.products).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  test('caracteres curinga e tentativa de SQL injection são tratados como texto', async () => {
    const curinga = await api().get('/api/products').query({ search: '%' });
    expect(curinga.body.pagination.total).toBe(0);

    const injection = await api().get('/api/products').query({ search: "' OR 1=1; DROP TABLE products; --" });
    expect(injection.status).toBe(200);
    expect(injection.body.products).toEqual([]);
    expect((await api().get('/api/products')).body.pagination.total).toBe(14); // tabela intacta
  });

  test('parâmetros inválidos → 400', async () => {
    expect((await api().get('/api/products').query({ page: 'abc' })).status).toBe(400);
    expect((await api().get('/api/products').query({ limit: 999999 })).status).toBe(400);
    expect((await api().get('/api/products').query({ sort: 'id; DROP' })).status).toBe(400);
  });
});
