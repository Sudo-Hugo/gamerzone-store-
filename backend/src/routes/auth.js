const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/authController');
const { authValidation } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

// Limita tentativas de login/cadastro por IP (proteção contra força bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});

router.post('/register', authLimiter, authValidation.register, asyncHandler(register));
router.post('/login', authLimiter, authValidation.login, asyncHandler(login));
router.get('/me', authMiddleware, asyncHandler(me));

module.exports = router;
