// Testes 6 e 7: inclusão/remoção no carrinho e cálculo correto do total.
const { api, resetData, loginCustomer, auth, getProductBySlug } = require('./helpers');
const { query, closePool } = require('../src/db/pool');

let token;
let teclado; // R$ 349,90
let mouse; // R$ 189,90

beforeEach(async () => {
  await resetData();
  token = await loginCustomer();
  teclado = await getProductBySlug('teclado-mecanico-rgb-nebula-k1');
  mouse = await getProductBySlug('mouse-gamer-vortex-16000-dpi');
});
afterAll(closePool);

const addItem = (product_id, quantity) =>
  api().post('/api/cart/items').set(auth(token)).send({ product_id, quantity });

describe('6. Inclusão e remoção de itens do carrinho', () => {
  test('adiciona itens e lista o carrinho', async () => {
    expect((await addItem(teclado.id, 1)).status).toBe(201);
    expect((await addItem(mouse.id, 2)).status).toBe(201);

    const res = await api().get('/api/cart').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.cart.items.map((i) => [i.product_id, i.quantity])).toEqual([
      [teclado.id, 1],
      [mouse.id, 2],
    ]);
    expect(res.body.cart.item_count).toBe(3);
  });

  test('adicionar o mesmo produto de novo soma a quantidade (não duplica a linha)', async () => {
    await addItem(teclado.id, 1);
    const res = await addItem(teclado.id, 2);
    expect(res.body.cart.items).toHaveLength(1);
    expect(res.body.cart.items[0].quantity).toBe(3);
  });

  test('altera a quantidade e remove um item', async () => {
    await addItem(teclado.id, 1);
    await addItem(mouse.id, 1);

    const upd = await api().patch(`/api/cart/items/${mouse.id}`).set(auth(token)).send({ quantity: 4 });
    expect(upd.status).toBe(200);
    expect(upd.body.cart.items.find((i) => i.product_id === mouse.id).quantity).toBe(4);

    const del = await api().delete(`/api/cart/items/${teclado.id}`).set(auth(token));
    expect(del.status).toBe(200);
    expect(del.body.cart.items.map((i) => i.product_id)).toEqual([mouse.id]);
  });

  test('esvaziar o carrinho', async () => {
    await addItem(teclado.id, 1);
    const res = await api().delete('/api/cart').set(auth(token));
    expect(res.body.cart).toEqual({ items: [], total: '0.00', item_count: 0 });
  });

  test('quantidade inválida e produto inexistente são rejeitados', async () => {
    expect((await addItem(teclado.id, 0)).status).toBe(400);
    expect((await addItem(teclado.id, -3)).status).toBe(400);
    expect((await addItem(999999, 1)).status).toBe(404);
    expect((await api().delete('/api/cart/items/999999').set(auth(token))).status).toBe(404);
  });

  test('carrinho exige login', async () => {
    expect((await api().get('/api/cart')).status).toBe(401);
  });
});

describe('7. Cálculo correto do total', () => {
  test('total = soma de preço × quantidade, calculado no servidor', async () => {
    await addItem(teclado.id, 2); // 699,80
    const res = await addItem(mouse.id, 3); // 569,70
    expect(res.body.cart.total).toBe('1269.50');
    const sub = Object.fromEntries(res.body.cart.items.map((i) => [i.product_id, i.subtotal]));
    expect(sub[teclado.id]).toBe('699.80');
    expect(sub[mouse.id]).toBe('569.70');
  });

  test('sem erro de ponto flutuante (0,10 + 0,20 = 0,30)', async () => {
    await query("UPDATE products SET price = 0.10 WHERE id = $1", [teclado.id]);
    await query("UPDATE products SET price = 0.20 WHERE id = $1", [mouse.id]);
    await addItem(teclado.id, 1);
    const res = await addItem(mouse.id, 1);
    expect(res.body.cart.total).toBe('0.30');
  });

  test('preço enviado pelo cliente é ignorado', async () => {
    const res = await api()
      .post('/api/cart/items')
      .set(auth(token))
      .send({ product_id: teclado.id, quantity: 1, price: 0.01, unit_price: 0.01 });
    expect(res.body.cart.total).toBe('349.90');
  });

  test('total acompanha mudança de preço do produto enquanto está no carrinho', async () => {
    await addItem(teclado.id, 1);
    await query('UPDATE products SET price = 300.00 WHERE id = $1', [teclado.id]);
    const res = await api().get('/api/cart').set(auth(token));
    expect(res.body.cart.total).toBe('300.00');
  });
});
