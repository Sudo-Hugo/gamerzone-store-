// Teste 10: persistência dos dados após reiniciar a aplicação.
// Sobe o servidor de verdade (processo Node separado), grava dados,
// encerra o processo, sobe de novo e confere que tudo continua lá.
const { spawn } = require('child_process');
const path = require('path');
const { resetData } = require('./helpers');
const { closePool } = require('../src/db/pool');

const PORT = 3999;
const BASE = `http://localhost:${PORT}/api`;

function startServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn(process.execPath, [path.join(__dirname, '..', 'src', 'server.js')], {
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    const timer = setTimeout(() => reject(new Error(`Servidor não subiu: ${output}`)), 15000);
    const onData = (d) => {
      output += d;
      if (output.includes(`localhost:${PORT}`)) {
        clearTimeout(timer);
        resolve(proc);
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Servidor saiu com código ${code}: ${output}`));
    });
  });
}

function stopServer(proc) {
  return new Promise((resolve) => {
    proc.removeAllListeners('exit');
    proc.on('exit', resolve);
    proc.kill('SIGTERM');
  });
}

async function call(pathname, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

beforeAll(resetData);
afterAll(closePool);

describe('10. Persistência dos dados após reiniciar a aplicação', () => {
  test('usuário, endereço, carrinho e pedido sobrevivem ao reinício do servidor', async () => {
    // ── 1ª execução do servidor: grava dados ──
    let server = await startServer();
    const reg = await call('/auth/register', {
      method: 'POST',
      body: { name: 'Persistente', email: 'persiste@teste.com', password: 'senha123' },
    });
    expect(reg.status).toBe(201);
    const token = reg.body.token;

    const addr = await call('/addresses', {
      method: 'POST', token,
      body: { recipient: 'Persistente', street: 'Rua B', number: '1', district: 'Zona 7', city: 'Maringá', state: 'PR', zip_code: '87020000' },
    });
    await call('/cart/items', { method: 'POST', token, body: { product_id: 1, quantity: 2 } });
    const order = await call('/orders', { method: 'POST', token, body: { address_id: addr.body.address.id } });
    expect(order.status).toBe(201);
    await call('/cart/items', { method: 'POST', token, body: { product_id: 2, quantity: 1 } }); // carrinho novo
    await stopServer(server);

    // ── 2ª execução: tudo continua lá ──
    server = await startServer();
    try {
      const login = await call('/auth/login', { method: 'POST', body: { email: 'persiste@teste.com', password: 'senha123' } });
      expect(login.status).toBe(200);
      const t2 = login.body.token;

      const orders = await call('/orders', { token: t2 });
      expect(orders.body.orders).toHaveLength(1);
      expect(orders.body.orders[0]).toMatchObject({ id: order.body.order.id, total: order.body.order.total });

      const cart = await call('/cart', { token: t2 });
      expect(cart.body.cart.items.map((i) => i.product_id)).toEqual([2]);

      const addresses = await call('/addresses', { token: t2 });
      expect(addresses.body.addresses).toHaveLength(1);

      // O token emitido antes do reinício continua válido
      expect((await call('/auth/me', { token })).status).toBe(200);
    } finally {
      await stopServer(server);
    }
  });
});
