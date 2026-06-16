const express = require('express');
const router = express.Router();
const { register, login, me } = require('../controllers/authController');
const { authValidation } = require('../middleware/validation');
const { authMiddleware } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', authValidation.register, register);

// POST /api/auth/login
router.post('/login', authValidation.login, login);

// GET /api/auth/me  (protegida)
router.get('/me', authMiddleware, me);

module.exports = router;
