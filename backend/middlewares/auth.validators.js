// middlewares/validators/auth.validators.js
import { body, validationResult } from 'express-validator';

const handle = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
};

export const validateLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Password requerido'),
  handle
];

export const validateForgotPassword = [
  body('email').isEmail().withMessage('Email inválido'),
  handle
];

export const validateResetPassword = [
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
  body('confirmPassword')
    .custom((val, { req }) => val === req.body.password)
    .withMessage('Las contraseñas no coinciden'),
  handle
];
