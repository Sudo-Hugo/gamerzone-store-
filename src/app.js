require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globais ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log simples de requisições (útil em desenvolvimento)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Rota de status ───────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    project: 'GamerZone Store API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/products/categories',
      orders: '/api/orders'
    }
  });
});

// ─── Rotas da aplicação ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// ─── Rota 404 ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ─── Handler de erros globais ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erro inesperado:', err.message);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ─── Inicializa o servidor ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ██████╗  █████╗ ███╗   ███╗███████╗██████╗ ███████╗ ██████╗ ███╗   ██╗███████╗
 ██╔════╝ ██╔══██╗████╗ ████║██╔════╝██╔══██╗╚══███╔╝██╔═══██╗████╗  ██║██╔════╝
 ██║  ███╗███████║██╔████╔██║█████╗  ██████╔╝  ███╔╝ ██║   ██║██╔██╗ ██║█████╗  
 ██║   ██║██╔══██║██║╚██╔╝██║██╔══╝  ██╔══██╗ ███╔╝  ██║   ██║██║╚██╗██║██╔══╝  
 ╚██████╔╝██║  ██║██║ ╚═╝ ██║███████╗██║  ██║███████╗╚██████╔╝██║ ╚████║███████╗
  ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝
  `);
  console.log(`🎮 GamerZone Store API rodando em http://localhost:${PORT}`);
  console.log(`📌 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
