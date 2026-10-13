// Dados de demonstração (fictícios). Pode ser executado várias vezes:
// usa ON CONFLICT para não duplicar categorias, produtos nem usuários.
// As senhas são transformadas em hash bcrypt na hora — nada de hash fixo no código.
const bcrypt = require('bcryptjs');
const { getPool, closePool } = require('./pool');
const slugify = require('../utils/slugify');
const config = require('../config');

const categories = [
  { name: 'Periféricos', slug: 'perifericos' },
  { name: 'Jogos', slug: 'jogos' },
  { name: 'Acessórios', slug: 'acessorios' },
  { name: 'Hardware', slug: 'hardware' },
  { name: 'Colecionáveis', slug: 'colecionaveis' },
];

// [nome, descrição, preço, estoque, slug da categoria]
const products = [
  ['Teclado Mecânico RGB Nebula K1', 'Switches lineares, iluminação RGB por tecla e corpo em alumínio escovado.', 349.9, 25, 'perifericos'],
  ['Mouse Gamer Vortex 16000 DPI', 'Sensor óptico de 16.000 DPI, 7 botões programáveis e 69 g de peso.', 189.9, 40, 'perifericos'],
  ['Headset Surround Abyss 7.1', 'Áudio surround virtual 7.1, microfone removível e almofadas de espuma.', 279.9, 15, 'perifericos'],
  ['Controle Sem Fio Pulse X', 'Bluetooth e 2,4 GHz, gatilhos analógicos e bateria de 30 horas.', 299.0, 20, 'perifericos'],
  ['Monitor Horizon 27" 165Hz', 'Painel IPS QHD, 165 Hz, 1 ms e compatível com sincronização adaptativa.', 1899.0, 8, 'hardware'],
  ['SSD NVMe Lightspeed 1TB', 'Leitura de até 7.000 MB/s para carregar jogos em segundos.', 459.9, 30, 'hardware'],
  ['Placa de Vídeo Titanforge 8GB', 'GPU fictícia de 8 GB GDDR6 para jogar em 1440p.', 2499.0, 5, 'hardware'],
  ['Cadeira Gamer ErgoX', 'Apoio lombar ajustável, reclina até 180° e braços 4D.', 899.0, 12, 'acessorios'],
  ['Mousepad Extended Grid XL', 'Superfície de tecido 90×40 cm com bordas costuradas.', 89.9, 60, 'acessorios'],
  ['Suporte de Headset Neon', 'Base com hub USB e iluminação RGB.', 129.9, 35, 'acessorios'],
  ['Crônicas de Arkhos (PC)', 'RPG de ação em mundo aberto. Mídia digital fictícia.', 199.9, 100, 'jogos'],
  ['Velocity Rush (PC)', 'Corrida arcade com multiplayer para até 8 jogadores.', 149.9, 100, 'jogos'],
  ['Estátua Guardião do Vazio 30cm', 'Colecionável em resina pintado à mão, edição numerada.', 549.9, 4, 'colecionaveis'],
  ['Action Figure Piloto Estelar', 'Figura articulada de 18 cm com acessórios.', 149.9, 18, 'colecionaveis'],
];

const users = [
  { name: 'Administrador Demo', email: 'admin@gamerzone.com', password: 'admin123', role: 'admin' },
  { name: 'Cliente Demo', email: 'cliente@gamerzone.com', password: 'cliente123', role: 'customer' },
];

async function seed({ silent = false } = {}) {
  const db = getPool();
  const log = (msg) => !silent && console.log(msg);

  for (const c of categories) {
    await db.query(
      'INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING',
      [c.name, c.slug]
    );
  }

  for (const [name, description, price, stock, categorySlug] of products) {
    await db.query(
      `INSERT INTO products (name, slug, description, price, stock, category_id)
       VALUES ($1, $2, $3, $4, $5, (SELECT id FROM categories WHERE slug = $6))
       ON CONFLICT (slug) DO NOTHING`,
      [name, slugify(name), description, price, stock, categorySlug]
    );
  }

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, config.bcryptRounds);
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [u.name, u.email, hash, u.role]
    );
    // Endereço de exemplo apenas para o cliente recém-criado
    if (rows[0] && u.role === 'customer') {
      await db.query(
        `INSERT INTO addresses (user_id, label, recipient, street, number, district, city, state, zip_code)
         VALUES ($1, 'Casa', $2, 'Rua dos Jogadores', '123', 'Centro', 'Maringá', 'PR', '87000000')`,
        [rows[0].id, u.name]
      );
    }
  }

  log(`✔ Seed concluído: ${categories.length} categorias, ${products.length} produtos, ${users.length} usuários.`);
  log('  Admin:   admin@gamerzone.com / admin123');
  log('  Cliente: cliente@gamerzone.com / cliente123');
}

if (require.main === module) {
  seed()
    .catch((err) => {
      console.error('❌ Erro no seed:', err.message);
      process.exitCode = 1;
    })
    .finally(closePool);
}

module.exports = { seed };
