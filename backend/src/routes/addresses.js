const express = require('express');
const c = require('../controllers/addressController');
const { authMiddleware } = require('../middleware/auth');
const { addressValidation: v } = require('../middleware/validation');
const { asyncHandler } = require('../utils/http');

const router = express.Router();
router.use(authMiddleware);

router.get('/', asyncHandler(c.listAddresses));
router.post('/', v.create, asyncHandler(c.createAddress));
router.delete('/:id', v.remove, asyncHandler(c.deleteAddress));

module.exports = router;
