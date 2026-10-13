const express = require('express');
const c = require('../controllers/productController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { productValidation: v } = require('../middleware/validation');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

// Públicas
router.get('/', v.list, asyncHandler(c.listProducts));
router.get('/best-sellers', v.limitOnly, asyncHandler(c.bestSellers));
router.get('/brands', asyncHandler(c.listBrands));
router.get('/admin/all', authMiddleware, adminOnly, asyncHandler(c.listAllProducts));
router.get('/:id', v.getById, asyncHandler(c.getProduct));
router.get('/:id/related', v.related, asyncHandler(c.relatedProducts));

// Somente admin
router.post('/', authMiddleware, adminOnly, v.create, asyncHandler(c.createProduct));
router.put('/:id', authMiddleware, adminOnly, v.update, asyncHandler(c.updateProduct));
router.delete('/:id', authMiddleware, adminOnly, v.remove, asyncHandler(c.deleteProduct));

module.exports = router;
