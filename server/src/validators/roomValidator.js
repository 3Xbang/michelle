import { body } from 'express-validator';

const ROOM_TYPES = ['villa', 'homestay', 'apartment'];
const ROOM_STATUSES = ['active', 'maintenance'];

export const createRoomValidation = [
  body('room_name_cn')
    .notEmpty()
    .withMessage('中文名称不能为空'),
  body('room_name_en')
    .notEmpty()
    .withMessage('英文名称不能为空'),
  body('room_type')
    .isIn(ROOM_TYPES)
    .withMessage(`房源类型必须为 ${ROOM_TYPES.join(', ')} 之一`),
  body('base_daily_rate')
    .isFloat({ gt: 0 })
    .withMessage('日基础房价必须大于零'),
  body('status')
    .optional()
    .isIn(ROOM_STATUSES)
    .withMessage(`房源状态必须为 ${ROOM_STATUSES.join(', ')} 之一`),
];

export const updateRoomValidation = [
  body('room_name_cn')
    .optional()
    .notEmpty()
    .withMessage('中文名称不能为空'),
  body('room_name_en')
    .optional()
    .notEmpty()
    .withMessage('英文名称不能为空'),
  body('room_type')
    .optional()
    .isIn(ROOM_TYPES)
    .withMessage(`房源类型必须为 ${ROOM_TYPES.join(', ')} 之一`),
  body('base_daily_rate')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('日基础房价必须大于零'),
  body('status')
    .optional()
    .isIn(ROOM_STATUSES)
    .withMessage(`房源状态必须为 ${ROOM_STATUSES.join(', ')} 之一`),
];
