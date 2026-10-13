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
    expect(res.body.pagination).toEqual({ page: 1, limit: 5, total: 24, totalPages: 5 });
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
    expect(res.body.products.length).toBe(6);
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
    // "%" é procurado como o caractere literal (ex.: "60%"), e não como "qualquer coisa"
    const curinga = await api().get('/api/products').query({ search: '%', limit: 50 });
    expect(curinga.body.pagination.total).toBeLessThan(24);
    curinga.body.products.forEach((p) => expect(`${p.name} ${p.description}`).toContain('%'));
    expect((await api().get('/api/products').query({ search: '_' })).body.pagination.total).toBe(0);

    const injection = await api().get('/api/products').query({ search: "' OR 1=1; DROP TABLE products; --" });
    expect(injection.status).toBe(200);
    expect(injection.body.products).toEqual([]);
    expect((await api().get('/api/products')).body.pagination.total).toBe(24); // tabela intacta
  });

  test('parâmetros inválidos → 400', async () => {
    expect((await api().get('/api/products').query({ page: 'abc' })).status).toBe(400);
    expect((await api().get('/api/products').query({ limit: 999999 })).status).toBe(400);
    expect((await api().get('/api/products').query({ sort: 'id; DROP' })).status).toBe(400);
  });
});

describe('5b. Vitrine: promoções, destaques, marcas, mais vendidos e relacionados', () => {
  test('filtro de ofertas traz só produtos com preço antigo maior, com % calculado pelo banco', async () => {
    const res = await api().get('/api/products').query({ on_sale: true, sort: 'discount', limit: 50 });
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    for (const p of res.body.products) {
      expect(Number(p.compare_at_price)).toBeGreaterThan(Number(p.price));
      const esperado = Math.round((1 - p.price / p.compare_at_price) * 100);
      expect(p.discount_percent).toBe(esperado);
    }
    const descontos = res.body.products.map((p) => p.discount_percent);
    expect(descontos).toEqual([...descontos].sort((a, b) => b - a));
  });

  test('destaques e filtro por marca', async () => {
    const featured = await api().get('/api/products').query({ featured: true });
    expect(featured.body.products.length).toBe(4);
    featured.body.products.forEach((p) => expect(p.featured).toBe(true));

    const nebula = await api().get('/api/products').query({ brand: 'Nebula' });
    expect(nebula.body.products.map((p) => p.brand)).toEqual(['Nebula', 'Nebula']);

    const brands = await api().get('/api/products/brands');
    expect(brands.body.brands.map((b) => b.name)).toContain('Vortex');
  });

  test('ficha técnica vem na ordem em que foi cadastrada', async () => {
    const teclado = await getProductBySlug('teclado-mecanico-rgb-nebula-k1');
    const res = await api().get(`/api/products/${teclado.id}`);
    expect(Object.keys(res.body.product.specs)[0]).toBe('Switch');
    expect(res.body.product.image_url).toBe('/products/teclado-mecanico-rgb-nebula-k1.svg');
  });

  test('mais vendidos reflete os pedidos e ignora cancelados', async () => {
    const { loginCustomer, createAddress } = require('./helpers');
    const token = await loginCustomer();
    const addr = await createAddress(token);
    const webcam = await getProductBySlug('webcam-streamer-lumen-full-hd');
    const mic = await getProductBySlug('microfone-condensador-echo-usb');

    await api().post('/api/cart/items').set(auth(token)).send({ product_id: webcam.id, quantity: 3 });
    await api().post('/api/orders').set(auth(token)).send({ address_id: addr.id });
    await api().post('/api/cart/items').set(auth(token)).send({ product_id: mic.id, quantity: 5 });
    const cancelado = (await api().post('/api/orders').set(auth(token)).send({ address_id: addr.id })).body.order;
    await api().patch(`/api/orders/${cancelado.id}/cancel`).set(auth(token));

    const res = await api().get('/api/products/best-sellers').query({ limit: 3 });
    expect(res.body.products[0]).toMatchObject({ id: webcam.id, sold_count: 3 });
    expect(res.body.products.find((p) => p.id === mic.id)).toBeUndefined();
  });

  test('relacionados são da mesma categoria e não incluem o próprio produto', async () => {
    const mouse = await getProductBySlug('mouse-gamer-vortex-16000-dpi');
    const res = await api().get(`/api/products/${mouse.id}/related`).query({ limit: 4 });
    expect(res.body.products).toHaveLength(4);
    res.body.products.forEach((p) => {
      expect(p.category_slug).toBe('perifericos');
      expect(p.id).not.toBe(mouse.id);
    });
  });

  test('admin cadastra produto com marca, promoção e ficha técnica; dados inválidos são recusados', async () => {
    const token = await loginAdmin();
    const ok = await api().post('/api/products').set(auth(token)).send({
      name: 'Mouse Teste', price: 100, compare_at_price: 125, stock: 3, brand: 'Teste', featured: true,
      specs: { DPI: '8000', Peso: '80 g' }, image_url: '/products/mouse-gamer-vortex-16000-dpi.svg',
    });
    expect(ok.status).toBe(201);
    expect(ok.body.product).toMatchObject({ discount_percent: 20, brand: 'Teste', featured: true, specs: { DPI: '8000', Peso: '80 g' } });

    const ruins = [
      { specs: ['lista'] },
      { specs: { DPI: 8000 } },
      { image_url: 'javascript:alert(1)' },
      { image_url: '/../../etc/passwd' },
      { compare_at_price: -1 },
    ];
    for (const extra of ruins) {
      const res = await api().post('/api/products').set(auth(token)).send({ name: 'X Ruim', price: 1, stock: 1, ...extra });
      expect(res.status).toBe(400);
    }
  });
});
