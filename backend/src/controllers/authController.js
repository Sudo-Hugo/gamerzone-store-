const bcrypt = require('bcryptjs');
const config = require('../config');
const { query } = require('../db/pool');
const { signToken } = require('../middleware/auth');
const { HttpError } = require('../utils/http');

// Campos públicos do usuário — a senha (hash) nunca sai do servidor.
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

// Hash usado quando o e-mail não existe, para o tempo de resposta do login
// ser parecido nos dois casos (dificulta descobrir e-mails cadastrados).
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

// POST /api/auth/register
async function register(req, res) {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, config.bcryptRounds);

  // A role é sempre 'customer': o cliente não escolhe o próprio papel.
  const { rows } = await query(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, name, email, role`,
    [name, email, hash]
  );
  if (!rows[0]) throw new HttpError(409, 'Este e-mail já está cadastrado.');

  const user = rows[0];
  res.status(201).json({ user: publicUser(user), token: signToken(user) });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  const { rows } = await query('SELECT id, name, email, role, password FROM users WHERE email = $1', [email]);
  const user = rows[0];

  const ok = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);
  if (!user || !ok) throw new HttpError(401, 'E-mail ou senha incorretos.');

  res.json({ user: publicUser(user), token: signToken(user) });
}

// GET /api/auth/me
async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

module.exports = { register, login, me };
