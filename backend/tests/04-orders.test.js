// Testes 8 e 9: compra acima do estoque e finalização do pedido.
const { api, resetData, loginCustomer, createCustomer, loginAdmin, auth, createAddress, getProductBySlug } = require('./helpers');
const { query, getPool, closePool } = require('../src/db/pool');

let token;
let addressId;
let estatua; // estoque 4, R$ 549,90
let mouse; // estoque 40, R$ 189,90

beforeEach(async () => {
  await resetData();
  token = await loginCustomer();
  addressId = (await createAddress(token)).id;
  estatua = await getProductBySlug('estatua-guardiao-do-vazio-30cm');
  mouse = await getProductBySlug('mouse-gamer-vortex-16000-dpi');
});
afterAll(closePool);

const addItem = (tk, product_id, quantity) => api().post('/api/cart/items').set(auth(tk)).send({ product_id, quantity });
const checkout = (tk, address_id) => api().post('/api/orders').set(auth(tk)).send({ address_id });
const stockOf = async (id) => (await query('SELECT stock FROM products WHERE id = $1', [id])).rows[0].stock;

describe('8. Tentativa de comprar quantidade superior ao estoque', () => {
  test('carrinho não aceita mais unidades do que o estoque', async () => {
    const res = await addItem(token, estatua.id, 5); // estoque = 4
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Estoque insuficiente/);
  });

  test('somar ao item existente também respeita o estoque', async () => {
    await addItem(token, estatua.id, 3);
    const res = await addItem(token, estatua.id, 2);
    expect(res.status).toBe(409);
  });

  test('estoque que acabou depois de ir para o carrinho é barrado no checkout, sem gravar nada', async () => {
    await addItem(token, estatua.id, 3);
    await query('UPDATE products SET stock = 1 WHERE id = $1', [estatua.id]); // outra venda aconteceu

    const res = await checkout(token, addressId);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Estoque insuficiente/);
    expect(await stockOf(estatua.id)).toBe(1); // nada foi baixado
    expect((await query('SELECT COUNT(*) AS n FROM orders')).rows[0].n).toBe(0); // nenhum pedido criado
  });

  test('duas compras simultâneas da última unidade: só uma passa (FOR UPDATE)', async () => {
    await query('UPDATE products SET stock = 1 WHERE id = $1', [estatua.id]);
    const outro = await createCustomer();
    const outroAddr = (await createAddress(outro.token)).id;
    await addItem(token, estatua.id, 1);
    await addItem(outro.token, estatua.id, 1);

    // Uma terceira transação segura a linha do produto por um instante. Assim as
    // duas compras chegam ao banco ao mesmo tempo e ficam esperando juntas —
    // o cenário de corrida acontece de forma garantida, não por sorte.
    const blocker = await getPool().connect();
    await blocker.query('BEGIN');
    await blocker.query('SELECT id FROM products WHERE id = $1 FOR UPDATE', [estatua.id]);

    const both = Promise.all([checkout(token, addressId), checkout(outro.token, outroAddr)]);
    await new Promise((r) => setTimeout(r, 400));
    await blocker.query('COMMIT');
    blocker.release();

    const [a, b] = await both;
    // Uma compra passa; a outra recebe "estoque insuficiente" (409), e não erro interno
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await stockOf(estatua.id)).toBe(0);
    expect((await query('SELECT COUNT(*) AS n FROM orders')).rows[0].n).toBe(1);
  });
});

describe('9. Finalização de pedido', () => {
  test('cria o pedido, baixa o estoque, esvazia o carrinho e guarda snapshot', async () => {
    await addItem(token, estatua.id, 2);
    await addItem(token, mouse.id, 1);

    const res = await checkout(token, addressId);
    expect(res.status).toBe(201);
    const { order } = res.body;
    expect(order.status).toBe('pending');
    expect(order.total).toBe('1289.70'); // 2×549,90 + 189,90
    expect(order.ship_city).toBe('Maringá');
    expect(order.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ product_name: 'Estátua Guardião do Vazio 30cm', unit_price: '549.90', quantity: 2, subtotal: '1099.80' }),
        expect.objectContaining({ product_name: 'Mouse Gamer Vortex 16000 DPI', unit_price: '189.90', quantity: 1 }),
      ])
    );

    expect(await stockOf(estatua.id)).toBe(2);
    expect(await stockOf(mouse.id)).toBe(39);
    expect((await api().get('/api/cart').set(auth(token))).body.cart.items).toEqual([]);

    const mine = await api().get('/api/orders').set(auth(token));
    expect(mine.body.orders.map((o) => o.id)).toEqual([order.id]);
  });

  test('preço do pedido não muda se o produto mudar de preço depois', async () => {
    await addItem(token, mouse.id, 1);
    const { order } = (await checkout(token, addressId)).body;
    await query('UPDATE products SET price = 999.99, name = $2 WHERE id = $1', [mouse.id, 'Nome Novo']);

    const res = await api().get(`/api/orders/${order.id}`).set(auth(token));
    expect(res.body.order.total).toBe('189.90');
    expect(res.body.order.items[0]).toMatchObject({ unit_price: '189.90', product_name: 'Mouse Gamer Vortex 16000 DPI' });
  });

  test('carrinho vazio ou endereço inválido → erro', async () => {
    expect((await checkout(token, addressId)).status).toBe(400);
    await addItem(token, mouse.id, 1);
    expect((await checkout(token, 999999)).status).toBe(404);
    expect((await checkout(token, 'abc')).status).toBe(400);
  });

  test('cliente cancela pedido pendente e o estoque volta', async () => {
    await addItem(token, estatua.id, 3);
    const { order } = (await checkout(token, addressId)).body;
    expect(await stockOf(estatua.id)).toBe(1);

    const res = await api().patch(`/api/orders/${order.id}/cancel`).set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('cancelled');
    expect(await stockOf(estatua.id)).toBe(4);

    // Cancelar de novo não devolve estoque duas vezes
    expect((await api().patch(`/api/orders/${order.id}/cancel`).set(auth(token))).status).toBe(409);
    expect(await stockOf(estatua.id)).toBe(4);
  });

  test('admin avança o status seguindo as transições permitidas', async () => {
    const admin = await loginAdmin();
    await addItem(token, mouse.id, 1);
    const { order } = (await checkout(token, addressId)).body;
    const set = (status) => api().patch(`/api/orders/${order.id}/status`).set(auth(admin)).send({ status });

    expect((await set('delivered')).status).toBe(409); // não pula etapas
    expect((await set('processing')).status).toBe(200);
    expect((await set('shipped')).status).toBe(200);
    expect((await set('delivered')).status).toBe(200);
    expect((await set('pending')).status).toBe(409); // não volta
    expect((await set('voando')).status).toBe(400); // status inexistente
  });
});
