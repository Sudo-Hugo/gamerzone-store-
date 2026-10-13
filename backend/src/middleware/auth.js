const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../db/pool');
const { HttpError, asyncHandler } = require('../utils/http');

// Verifica o token JWT e carrega o usuário ATUAL do banco.
// O token guarda só o id: se o papel (role) mudar ou o usuário for
// removido, isso vale imediatamente, sem esperar o token expirar.
const authMiddleware = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Faça login para continuar.');
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] });
  } catch {
    throw new HttpError(401, 'Sessão inválida ou expirada. Faça login novamente.');
  }

  const { rows } = await query('SELECT id, name, email, role FROM users WHERE id = $1', [payload.sub]);
  if (!rows[0]) throw new HttpError(401, 'Usuário não encontrado.');

  req.user = rows[0];
  next();
});

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(new HttpError(403, 'Acesso restrito a administradores.'));
  }
  next();
}

function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.expiresIn,
  });
}

module.exports = { authMiddleware, adminOnly, signToken };
