// Monta a aplicação Express (sem abrir porta).
// Separado de server.js para que os testes possam importar o app diretamente.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(helmet()); // headers de segurança (X-Content-Type-Options, etc.)
app.use(
  cors({
    // Só o(s) endereço(s) do front-end configurado(s) em CORS_ORIGIN podem chamar a API
    origin: (origin, cb) => {
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
  })
);
app.use(express.json({ limit: '100kb' }));

if (config.env === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'GamerZone Store API' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/orders', require('./routes/orders'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
