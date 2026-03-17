import { body } from 'express-validator';

const ROLES = ['Admin', 'Staff'];
const LANGUAGES = ['CN', 'EN'];

export const createUserValidation = [
  body('name')
    .notEmpty()
    .withMessage('姓名不能为空'),
  body('email')
    .isEmail()
    .withMessage('邮箱格式无效'),
  body('role')
    .isIn(ROLES)
    .withMessage(`角色必须为 ${ROLES.join(', ')} 之一`),
  body('preferred_lang')
    .optional()
    .isIn(LANGUAGES)
    .withMessage(`语言偏好必须为 ${LANGUAGES.join(', ')} 之一`),
  body('phone')
    .optional(),
];

export const updateUserValidation = [
  body('name')
    .optional()
    .notEmpty()
    .withMessage('姓名不能为空'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('邮箱格式无效'),
  body('role')
    .optional()
    .isIn(ROLES)
    .withMessage(`角色必须为 ${ROLES.join(', ')} 之一`),
  body('preferred_lang')
    .optional()
    .isIn(LANGUAGES)
    .withMessage(`语言偏好必须为 ${LANGUAGES.join(', ')} 之一`),
  body('phone')
    .optional(),
];
