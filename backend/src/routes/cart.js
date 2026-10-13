const express = require('express');
const c = require('../controllers/cartController');
const { authMiddleware } = require('../middleware/auth');
const { cartValidation: v } = require('../middleware/validation');
const { asyncHandler } = require('../utils/http');

const router = express.Router();
router.use(authMiddleware); // o carrinho sempre pertence ao usuário logado

router.get('/', asyncHandler(c.getCart));
router.post('/items', v.add, asyncHandler(c.addItem));
router.patch('/items/:productId', v.update, asyncHandler(c.updateItem));
router.delete('/items/:productId', v.remove, asyncHandler(c.removeItem));
router.delete('/', asyncHandler(c.clearCart));

module.exports = router;
