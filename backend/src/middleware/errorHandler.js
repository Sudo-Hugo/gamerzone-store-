const { HttpError } = require('../utils/http');

// Rota inexistente
function notFound(req, res, next) {
  next(new HttpError(404, 'Rota não encontrada.'));
}

// Tratamento padronizado de erros: sempre { error, details? } com o status correto.
// Detalhes internos (stack, mensagem do banco) nunca vão para o cliente.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    const body = { error: err.message };
    if (err.details) body.details = err.details;
    return res.status(err.status).json(body);
  }

  // JSON malformado no corpo da requisição
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Corpo da requisição muito grande.' });
  }

  // Violações de restrição do PostgreSQL que escaparam das validações
  if (err.code === '23505') return res.status(409).json({ error: 'Registro duplicado.' });
  if (err.code === '23503') return res.status(400).json({ error: 'Referência inválida.' });
  if (err.code === '23514') return res.status(400).json({ error: 'Valor fora das regras permitidas.' });

  console.error('Erro inesperado:', err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

module.exports = { notFound, errorHandler };
