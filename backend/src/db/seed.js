// Dados de demonstração (fictícios). Pode ser executado várias vezes:
// usa ON CONFLICT para não duplicar categorias, produtos nem usuários.
// As senhas são transformadas em hash bcrypt na hora — nada de hash fixo no código.
// Todas as marcas e produtos são inventados para o projeto.
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

// A ordem importa: os 14 primeiros mantêm os mesmos IDs da versão anterior.
// "was" = preço antigo (promoção). As imagens são ilustrações em frontend/public/products/.
const products = [
  {
    name: 'Teclado Mecânico RGB Nebula K1', cat: 'perifericos', brand: 'Nebula', price: 349.9, was: 429.9, stock: 25, featured: true,
    description: 'Switches lineares lubrificados de fábrica, iluminação RGB por tecla com 18 efeitos e corpo em alumínio escovado. Layout ABNT2 completo com teclas multimídia dedicadas.',
    specs: { Switch: 'Linear vermelho', Layout: 'ABNT2 full size', Iluminação: 'RGB por tecla', Conexão: 'USB-C destacável', 'Anti-ghosting': 'N-key rollover', Peso: '1,1 kg' },
  },
  {
    name: 'Mouse Gamer Vortex 16000 DPI', cat: 'perifericos', brand: 'Vortex', price: 189.9, stock: 40,
    description: 'Sensor óptico de 16.000 DPI, 7 botões programáveis e apenas 69 g. Pés de PTFE para deslizar sem atrito e cabo paracord ultraflexível.',
    specs: { Sensor: 'Óptico 16.000 DPI', Botões: '7 programáveis', Peso: '69 g', 'Polling rate': '1000 Hz', Cabo: 'Paracord 1,8 m' },
  },
  {
    name: 'Headset Surround Abyss 7.1', cat: 'perifericos', brand: 'Abyss', price: 279.9, was: 349.9, stock: 15,
    description: 'Áudio surround virtual 7.1, drivers de 50 mm, microfone removível com cancelamento de ruído e almofadas de espuma com memória.',
    specs: { Drivers: '50 mm', Áudio: 'Surround virtual 7.1', Microfone: 'Removível, cardioide', Conexão: 'USB e P2', Peso: '310 g' },
  },
  {
    name: 'Controle Sem Fio Pulse X', cat: 'perifericos', brand: 'Pulse', price: 299.0, stock: 20,
    description: 'Conexão Bluetooth e 2,4 GHz, gatilhos analógicos, vibração dupla e bateria de 30 horas. Funciona no PC, no celular e na TV.',
    specs: { Conexão: 'Bluetooth 5.0 e 2,4 GHz', Bateria: '30 horas', Recarga: 'USB-C', Vibração: 'Dupla', Compatibilidade: 'PC, Android, iOS' },
  },
  {
    name: 'Monitor Horizon 27" 165Hz', cat: 'hardware', brand: 'Horizon', price: 1899.0, was: 2199.0, stock: 8,
    description: 'Painel IPS QHD com 165 Hz e 1 ms, cobertura de 95% DCI-P3 e sincronização adaptativa para jogar sem cortes na imagem.',
    specs: { Tela: '27" IPS', Resolução: '2560 × 1440', Atualização: '165 Hz', Resposta: '1 ms (GtG)', Entradas: '2× HDMI 2.0, 1× DisplayPort' },
  },
  {
    name: 'SSD NVMe Lightspeed 1TB', cat: 'hardware', brand: 'Lightspeed', price: 459.9, was: 549.9, stock: 30,
    description: 'Leitura de até 7.000 MB/s em PCIe 4.0 para carregar jogos e mapas em segundos. Acompanha dissipador de alumínio.',
    specs: { Capacidade: '1 TB', Interface: 'PCIe 4.0 NVMe', Leitura: '7.000 MB/s', Gravação: '6.000 MB/s', Formato: 'M.2 2280' },
  },
  {
    name: 'Placa de Vídeo Titanforge 8GB', cat: 'hardware', brand: 'Titanforge', price: 2499.0, stock: 5, featured: true,
    description: 'GPU de 8 GB GDDR6 com três ventoinhas e backplate metálico. Feita para jogar em 1440p com tudo no alto.',
    specs: { Memória: '8 GB GDDR6', Barramento: '128 bits', Ventoinhas: '3', Saídas: '3× DisplayPort, 1× HDMI', 'Fonte recomendada': '550 W' },
  },
  {
    name: 'Cadeira Gamer ErgoX', cat: 'acessorios', brand: 'ErgoX', price: 899.0, was: 1099.0, stock: 12,
    description: 'Apoio lombar ajustável, encosto que reclina até 180°, braços 4D e base de alumínio. Suporta até 150 kg.',
    specs: { Reclinação: 'Até 180°', Braços: '4D', Revestimento: 'Couro sintético', 'Carga máxima': '150 kg', Base: 'Alumínio' },
  },
  {
    name: 'Mousepad Extended Grid XL', cat: 'acessorios', brand: 'Grid', price: 89.9, stock: 60,
    description: 'Superfície de tecido de 90 × 40 cm para mouse e teclado juntos, base de borracha antiderrapante e bordas costuradas.',
    specs: { Tamanho: '90 × 40 cm', Espessura: '4 mm', Superfície: 'Tecido speed', Base: 'Borracha natural' },
  },
  {
    name: 'Suporte de Headset Neon', cat: 'acessorios', brand: 'Neon', price: 129.9, stock: 35,
    description: 'Base com hub USB de duas portas, iluminação RGB e pés antiderrapantes. Deixa o headset sempre à mão.',
    specs: { 'Hub USB': '2 portas 2.0', Iluminação: 'RGB', Material: 'ABS e alumínio', Altura: '27 cm' },
  },
  {
    name: 'Crônicas de Arkhos (PC)', cat: 'jogos', brand: 'Arkhos Studios', price: 199.9, stock: 100,
    description: 'RPG de ação em mundo aberto com mais de 60 horas de campanha, dragões e um castelo inteiro para conquistar. Mídia digital.',
    specs: { Gênero: 'RPG de ação', Plataforma: 'PC', Modo: 'Um jogador', Classificação: '14 anos', Entrega: 'Chave digital' },
  },
  {
    name: 'Velocity Rush (PC)', cat: 'jogos', brand: 'Velocity Games', price: 149.9, was: 199.9, stock: 100,
    description: 'Corrida arcade com multiplayer para até 8 jogadores, 40 pistas e garagem para personalizar cada carro.',
    specs: { Gênero: 'Corrida arcade', Plataforma: 'PC', Modo: 'Online até 8 jogadores', Classificação: 'Livre', Entrega: 'Chave digital' },
  },
  {
    name: 'Estátua Guardião do Vazio 30cm', cat: 'colecionaveis', brand: 'Void Collectibles', price: 549.9, stock: 4,
    description: 'Colecionável em resina pintado à mão, com olhos iluminados por LED e base numerada. Edição limitada.',
    specs: { Altura: '30 cm', Material: 'Resina', Iluminação: 'LED nos olhos', Edição: 'Limitada e numerada' },
  },
  {
    name: 'Action Figure Piloto Estelar', cat: 'colecionaveis', brand: 'Stellar Toys', price: 149.9, stock: 18,
    description: 'Figura com 22 pontos de articulação, capacete de visor translúcido e acessórios intercambiáveis.',
    specs: { Altura: '18 cm', Articulações: '22', Acessórios: 'Capacete, blaster e base', Material: 'PVC' },
  },
  // ─── Novos produtos ───
  {
    name: 'Teclado Compacto Nebula Mini 60%', cat: 'perifericos', brand: 'Nebula', price: 279.9, stock: 22,
    description: 'Formato 60% que libera espaço para o mouse, switches hot-swap e keycaps PBT double-shot. Ideal para FPS.',
    specs: { Switch: 'Tátil marrom, hot-swap', Layout: '60% (61 teclas)', Keycaps: 'PBT double-shot', Iluminação: 'RGB', Conexão: 'USB-C' },
  },
  {
    name: 'Mouse Sem Fio Vortex Air', cat: 'perifericos', brand: 'Vortex', price: 249.9, was: 299.9, stock: 18,
    description: 'Sem fio de baixa latência a 2,4 GHz, sensor de 26.000 DPI e bateria de 70 horas em um corpo de 58 g.',
    specs: { Sensor: 'Óptico 26.000 DPI', Conexão: '2,4 GHz e Bluetooth', Bateria: '70 horas', Peso: '58 g', Recarga: 'USB-C' },
  },
  {
    name: 'Headset Sem Fio Abyss Pro', cat: 'perifericos', brand: 'Abyss', price: 459.9, stock: 10, featured: true,
    description: 'Áudio espacial sem fio, cancelamento ativo de ruído e 40 horas de bateria. Microfone retrátil com filtro de IA.',
    specs: { Conexão: '2,4 GHz e Bluetooth', Bateria: '40 horas', Cancelamento: 'ANC ativo', Microfone: 'Retrátil', Drivers: '50 mm grafeno' },
  },
  {
    name: 'Webcam Streamer Lumen Full HD', cat: 'perifericos', brand: 'Lumen', price: 329.9, stock: 14,
    description: 'Full HD a 60 fps com anel de luz embutido, foco automático e dois microfones estéreo. Pronta para live.',
    specs: { Resolução: '1080p a 60 fps', Iluminação: 'Anel de LED regulável', Foco: 'Automático', Microfone: 'Estéreo duplo', Fixação: 'Clipe e rosca de tripé' },
  },
  {
    name: 'Microfone Condensador Echo USB', cat: 'perifericos', brand: 'Echo', price: 389.9, stock: 9,
    description: 'Cápsula condensadora cardioide, botão de mudo por toque com LED e monitoramento sem atraso pelo fone.',
    specs: { Tipo: 'Condensador cardioide', Amostragem: '24 bits / 96 kHz', Conexão: 'USB-C', Extras: 'Shock mount e braço' },
  },
  {
    name: 'Monitor Ultrawide Horizon 34" Curvo', cat: 'hardware', brand: 'Horizon', price: 3299.0, stock: 4, featured: true,
    description: 'Tela curva 1500R ultrawide 21:9 com 144 Hz. Mais campo de visão em corrida, simulador e estratégia.',
    specs: { Tela: '34" VA curva 1500R', Resolução: '3440 × 1440', Atualização: '144 Hz', Proporção: '21:9', HDR: 'HDR400' },
  },
  {
    name: 'Memória RAM Pulse RGB 32GB', cat: 'hardware', brand: 'Pulse', price: 539.9, stock: 16,
    description: 'Kit 2 × 16 GB DDR5 a 6000 MHz com dissipador de alumínio e barra de luz RGB sincronizável.',
    specs: { Capacidade: '32 GB (2 × 16 GB)', Tipo: 'DDR5', Frequência: '6000 MHz', Latência: 'CL30', Iluminação: 'RGB' },
  },
  {
    name: 'Gabinete Prism Vidro Temperado', cat: 'hardware', brand: 'Prism', price: 619.9, stock: 7,
    description: 'Mid-tower com lateral e frente em vidro temperado, três fans ARGB inclusas e espaço para placas de até 40 cm.',
    specs: { Formato: 'Mid-tower ATX', Lateral: 'Vidro temperado', Fans: '3 × 120 mm ARGB', 'GPU máxima': '400 mm' },
  },
  {
    name: 'Mousepad RGB Grid Glow', cat: 'acessorios', brand: 'Grid', price: 159.9, stock: 28,
    description: 'Mousepad 80 × 30 cm com borda de LED RGB em 14 modos e superfície de microtextura para controle preciso.',
    specs: { Tamanho: '80 × 30 cm', Iluminação: 'Borda RGB, 14 modos', Conexão: 'USB-C', Superfície: 'Microtextura' },
  },
  {
    name: 'Neon Drift Arena (PC)', cat: 'jogos', brand: 'Velocity Games', price: 89.9, stock: 100,
    description: 'Arena de drift em cidades neon com campeonatos semanais e trilha synthwave. Mídia digital.',
    specs: { Gênero: 'Corrida / drift', Plataforma: 'PC', Modo: 'Online e local', Classificação: 'Livre', Entrega: 'Chave digital' },
  },
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

  for (const p of products) {
    const slug = slugify(p.name);
    // Produto novo: insere. Produto já existente da versão anterior (sem ficha
    // técnica): completa marca, promoção, imagem e especificações. Produtos que
    // o admin já editou não são sobrescritos.
    await db.query(
      `INSERT INTO products (name, slug, description, price, compare_at_price, stock, category_id,
                             image_url, brand, featured, specs)
       VALUES ($1, $2, $3, $4, $5, $6, (SELECT id FROM categories WHERE slug = $7), $8, $9, $10, $11)
       ON CONFLICT (slug) DO UPDATE
         SET description = EXCLUDED.description, compare_at_price = EXCLUDED.compare_at_price,
             image_url = EXCLUDED.image_url, brand = EXCLUDED.brand,
             featured = EXCLUDED.featured, specs = EXCLUDED.specs
         WHERE products.specs::text = '{}'`,
      [p.name, slug, p.description, p.price, p.was || null, p.stock, p.cat,
        `/products/${slug}.svg`, p.brand, !!p.featured, JSON.stringify(p.specs)]
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

module.exports = { seed, products };
