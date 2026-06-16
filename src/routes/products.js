const express = require('express');
const router = express.Router();
const {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct, listCategories
} = require('../controllers/productController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { productValidation } = require('../middleware/validation');

// Rotas públicas (qualquer um pode acessar)
router.get('/', listProducts);
router.get('/categories', listCategories);
router.get('/:id', getProduct);

// Rotas protegidas (somente admin)
router.post('/', authMiddleware, adminOnly, productValidation.create, createProduct);
router.put('/:id', authMiddleware, adminOnly, productValidation.update, updateProduct);
router.delete('/:id', authMiddleware, adminOnly, deleteProduct);

module.exports = router;
