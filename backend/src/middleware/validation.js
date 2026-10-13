// Regras de validação de entrada (express-validator).
// Os "sanitizers" (toInt, toFloat, trim...) já convertem os valores em req.body/req.query.
const { body, param, query, validationResult } = require('express-validator');
const { HttpError } = require('../utils/http');

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new HttpError(400, 'Dados inválidos.', details));
  }
  next();
}

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const ORDER_STATUS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const idParam = (name = 'id') =>
  param(name).isInt({ min: 1 }).withMessage('ID inválido.').toInt();

// URL de imagem: só http/https (bloqueia "javascript:" e similares)
const imageUrl = () =>
  body('image_url')
    .optional({ values: 'null' })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('URL da imagem deve começar com http:// ou https://.');

const email = () =>
  body('email').trim().isEmail().withMessage('E-mail inválido.')
    .normalizeEmail({ gmail_remove_dots: false }).isLength({ max: 150 });

const authValidation = {
  register: [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres.'),
    email(),
    body('password').isString().isLength({ min: 6, max: 72 })
      .withMessage('Senha deve ter entre 6 e 72 caracteres.'),
    handleValidation,
  ],
  login: [
    email(),
    body('password').isString().notEmpty().withMessage('Senha é obrigatória.'),
    handleValidation,
  ],
};

const productValidation = {
  list: [
    query('page').optional().isInt({ min: 1 }).withMessage('Página inválida.').toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limite deve ser entre 1 e 50.').toInt(),
    query('min_price').optional().isFloat({ min: 0 }).withMessage('Preço mínimo inválido.').toFloat(),
    query('max_price').optional().isFloat({ min: 0 }).withMessage('Preço máximo inválido.').toFloat(),
    query('category').optional().matches(/^[a-z0-9-]{1,80}$/).withMessage('Categoria inválida.'),
    query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Busca muito longa.'),
    query('sort').optional().isIn(['newest', 'price_asc', 'price_desc', 'name'])
      .withMessage('Ordenação inválida.'),
    handleValidation,
  ],
  getById: [idParam(), handleValidation],
  create: [
    body('name').trim().isLength({ min: 2, max: 200 }).withMessage('Nome deve ter entre 2 e 200 caracteres.'),
    body('description').optional({ values: 'null' }).isString().trim().isLength({ max: 2000 }),
    body('price').isFloat({ min: 0, max: 999999 }).withMessage('Preço inválido.').toFloat(),
    body('stock').isInt({ min: 0, max: 100000 }).withMessage('Estoque inválido.').toInt(),
    body('category_id').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Categoria inválida.').toInt(),
    imageUrl(),
    handleValidation,
  ],
  update: [
    idParam(),
    body('name').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Nome inválido.'),
    body('description').optional({ values: 'null' }).isString().trim().isLength({ max: 2000 }),
    body('price').optional().isFloat({ min: 0, max: 999999 }).withMessage('Preço inválido.').toFloat(),
    body('stock').optional().isInt({ min: 0, max: 100000 }).withMessage('Estoque inválido.').toInt(),
    body('category_id').optional({ values: 'null' }).isInt({ min: 1 }).withMessage('Categoria inválida.').toInt(),
    body('active').optional().isBoolean().withMessage('Campo "active" deve ser true ou false.').toBoolean(),
    imageUrl(),
    handleValidation,
  ],
  remove: [idParam(), handleValidation],
};

const categoryValidation = {
  create: [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Nome deve ter entre 2 e 80 caracteres.'),
    handleValidation,
  ],
  update: [
    idParam(),
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Nome deve ter entre 2 e 80 caracteres.'),
    handleValidation,
  ],
  remove: [idParam(), handleValidation],
};

const cartValidation = {
  add: [
    body('product_id').isInt({ min: 1 }).withMessage('Produto inválido.').toInt(),
    body('quantity').optional().isInt({ min: 1, max: 99 }).withMessage('Quantidade deve ser entre 1 e 99.').toInt(),
    handleValidation,
  ],
  update: [
    idParam('productId'),
    body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantidade deve ser entre 1 e 99.').toInt(),
    handleValidation,
  ],
  remove: [idParam('productId'), handleValidation],
};

const addressValidation = {
  create: [
    body('label').optional().trim().isLength({ min: 1, max: 50 }),
    body('recipient').trim().isLength({ min: 2, max: 100 }).withMessage('Destinatário obrigatório.'),
    body('street').trim().isLength({ min: 2, max: 150 }).withMessage('Rua obrigatória.'),
    body('number').trim().isLength({ min: 1, max: 20 }).withMessage('Número obrigatório.'),
    body('complement').optional({ values: 'falsy' }).trim().isLength({ max: 100 }),
    body('district').trim().isLength({ min: 2, max: 100 }).withMessage('Bairro obrigatório.'),
    body('city').trim().isLength({ min: 2, max: 100 }).withMessage('Cidade obrigatória.'),
    body('state').trim().toUpperCase().isIn(UFS).withMessage('UF inválida.'),
    body('zip_code').customSanitizer((v) => String(v ?? '').replace(/\D/g, ''))
      .isLength({ min: 8, max: 8 }).withMessage('CEP deve ter 8 dígitos.'),
    handleValidation,
  ],
  remove: [idParam(), handleValidation],
};

const orderValidation = {
  create: [
    body('address_id').isInt({ min: 1 }).withMessage('Selecione um endereço de entrega.').toInt(),
    handleValidation,
  ],
  getById: [idParam(), handleValidation],
  cancel: [idParam(), handleValidation],
  updateStatus: [
    idParam(),
    body('status').isIn(ORDER_STATUS).withMessage(`Status deve ser: ${ORDER_STATUS.join(', ')}.`),
    handleValidation,
  ],
};

module.exports = {
  authValidation,
  productValidation,
  categoryValidation,
  cartValidation,
  addressValidation,
  orderValidation,
  ORDER_STATUS,
};
