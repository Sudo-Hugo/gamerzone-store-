const express = require('express');
const c = require('../controllers/orderController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { orderValidation: v } = require('../middleware/validation');
const { asyncHandler } = require('../utils/http');

const router = express.Router();
router.use(authMiddleware); // todas as rotas de pedido exigem login

router.post('/', v.create, asyncHandler(c.createOrder));
router.get('/', asyncHandler(c.listMyOrders));
router.get('/admin/all', adminOnly, asyncHandler(c.listAllOrders));
router.get('/:id', v.getById, asyncHandler(c.getOrder));
router.patch('/:id/cancel', v.cancel, asyncHandler(c.cancelOrder));
router.patch('/:id/status', adminOnly, v.updateStatus, asyncHandler(c.updateOrderStatus));

module.exports = router;
