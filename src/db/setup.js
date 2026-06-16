const { pool } = require('./connection');

const schema = `
  -- Tabela de usuários
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de categorias
  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(80) UNIQUE NOT NULL
  );

  -- Tabela de produtos
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de pedidos
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela de itens do pedido
  CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL
  );

  -- Inserir categorias iniciais
  INSERT INTO categories (name, slug) VALUES
    ('Periféricos', 'perifericos'),
    ('Jogos', 'jogos'),
    ('Acessórios', 'acessorios'),
    ('Hardware', 'hardware'),
    ('Colecionáveis', 'colecioqaveis')
  ON CONFLICT (slug) DO NOTHING;

  -- Inserir produtos de exemplo
  INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES
    ('Teclado Mecânico RGB GamerZone K1', 'Teclado mecânico com switches Blue, iluminação RGB por tecla e construção em alumínio.', 349.90, 25, 1, 'https://placehold.co/400x300?text=Teclado+K1'),
    ('Mouse Gamer Pro 16000 DPI', 'Mouse com sensor óptico de 16000 DPI, 7 botões programáveis e RGB customizável.', 189.90, 40, 1, 'https://placehold.co/400x300?text=Mouse+Pro'),
    ('Headset Surround 7.1', 'Headset com áudio surround virtual 7.1, microfone destacável e almofadas de espuma.', 279.90, 15, 1, 'https://placehold.co/400x300?text=Headset+7.1'),
    ('Monitor 144Hz 1ms 27"', 'Monitor Full HD com taxa de atualização de 144Hz e tempo de resposta de 1ms.', 1299.00, 8, 4, 'https://placehold.co/400x300?text=Monitor+144Hz'),
    ('Cadeira Gamer ErgoX', 'Cadeira ergonômica com apoio lombar, reclinável até 180° e braços ajustáveis.', 899.00, 12, 3, 'https://placehold.co/400x300?text=Cadeira+ErgoX'),
    ('Action Figure Geralt of Rivia', 'Figura de ação colecionável do Geralt de Rívia, 30cm, com detalhes premium.', 149.90, 30, 5, 'https://placehold.co/400x300?text=Geralt+Figure')
  ON CONFLICT DO NOTHING;

  -- Inserir admin padrão (senha: admin123)
  INSERT INTO users (name, email, password, role) VALUES
    ('Administrador', 'admin@gamerzone.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
  ON CONFLICT (email) DO NOTHING;
`;

async function setupDatabase() {
  try {
    console.log('🔧 Criando tabelas e dados iniciais...');
    await pool.query(schema);
    console.log('✅ Banco de dados configurado com sucesso!');
    console.log('📋 Tabelas criadas: users, categories, products, orders, order_items');
    console.log('👤 Admin padrão: admin@gamerzone.com / admin123');
  } catch (err) {
    console.error('❌ Erro ao configurar banco:', err.message);
  } finally {
    await pool.end();
  }
}

setupDatabase();
