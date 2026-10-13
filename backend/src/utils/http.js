// Erro com status HTTP. Lançado pelos controllers e tratado no errorHandler.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// O Express 4 não captura erros de funções async: este wrapper
// encaminha qualquer exceção para o middleware de erros.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, asyncHandler };
