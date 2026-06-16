const { body, param, query, validationResult } = require('express-validator');

// Retorna os erros de validação como JSON padronizado
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos.',
      details: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

// Regras de validação para autenticação
const authValidation = {
  register: [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório.')
      .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres.'),
    body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
    body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres.'),
    handleValidation
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
    body('password').notEmpty().withMessage('Senha é obrigatória.'),
    handleValidation
  ]
};

// Regras de validação para produtos
const productValidation = {
  create: [
    body('name').trim().notEmpty().withMessage('Nome do produto é obrigatório.')
      .isLength({ max: 200 }).withMessage('Nome deve ter no máximo 200 caracteres.'),
    body('price').isFloat({ min: 0 }).withMessage('Preço deve ser um número positivo.'),
    body('stock').isInt({ min: 0 }).withMessage('Estoque deve ser um número inteiro não negativo.'),
    body('category_id').optional().isInt().withMessage('Categoria inválida.'),
    handleValidation
  ],
  update: [
    param('id').isInt().withMessage('ID inválido.'),
    body('name').optional().trim().notEmpty().isLength({ max: 200 }),
    body('price').optional().isFloat({ min: 0 }).withMessage('Preço inválido.'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Estoque inválido.'),
    handleValidation
  ]
};

// Regras de validação para pedidos
const orderValidation = {
  create: [
    body('items').isArray({ min: 1 }).withMessage('O pedido deve ter ao menos 1 item.'),
    body('items.*.product_id').isInt().withMessage('ID de produto inválido.'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantidade deve ser ao menos 1.'),
    handleValidation
  ]
};

module.exports = { authValidation, productValidation, orderValidation };
