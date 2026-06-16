const express = require('express');
const router = express.Router();
const { createOrder, listOrders, getOrder, updateOrderStatus } = require('../controllers/orderController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { orderValidation } = require('../middleware/validation');

// Todas as rotas de pedido exigem login
router.use(authMiddleware);

router.post('/', orderValidation.create, createOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);

// Só admin atualiza status
router.patch('/:id/status', adminOnly, updateOrderStatus);

module.exports = router;
