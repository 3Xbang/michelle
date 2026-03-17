import { body } from 'express-validator';

const ISSUE_TYPES = ['plumbing', 'furniture', 'cleaning', 'network', 'other'];
const PRIORITIES = ['urgent', 'normal'];

export const createTicketValidation = [
  body('room_id')
    .isInt()
    .withMessage('房源ID必须为整数'),
  body('issue_type')
    .isIn(ISSUE_TYPES)
    .withMessage(`问题类型必须为 ${ISSUE_TYPES.join(', ')} 之一`),
  body('description')
    .notEmpty()
    .withMessage('问题描述不能为空'),
  body('priority')
    .optional()
    .isIn(PRIORITIES)
    .withMessage(`优先级必须为 ${PRIORITIES.join(', ')} 之一`),
];
