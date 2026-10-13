const express = require('express');
const c = require('../controllers/categoryController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { categoryValidation: v } = require('../middleware/validation');
const { asyncHandler } = require('../utils/http');

const router = express.Router();

router.get('/', asyncHandler(c.listCategories));
router.post('/', authMiddleware, adminOnly, v.create, asyncHandler(c.createCategory));
router.put('/:id', authMiddleware, adminOnly, v.update, asyncHandler(c.updateCategory));
router.delete('/:id', authMiddleware, adminOnly, v.remove, asyncHandler(c.deleteCategory));

module.exports = router;
