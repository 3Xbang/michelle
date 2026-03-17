import { body } from 'express-validator';

const PLATFORM_SOURCES = [
  'Airbnb',
  'Agoda',
  'Booking.com',
  'Trip.com',
  '途家',
  '小猪',
  '美团民宿',
  '飞猪',
  'Expedia',
  'VRBO',
  '直客',
  '其他',
];

const RENTAL_TYPES = ['daily', 'monthly', 'yearly'];
const BOOKING_STATUSES = ['pending', 'checked_in', 'checked_out'];

export const createBookingValidation = [
  body('guest_name')
    .notEmpty()
    .withMessage('客人姓名不能为空'),
  body('room_id')
    .isInt()
    .withMessage('房源ID必须为整数'),
  body('check_in')
    .isDate()
    .withMessage('入住日期格式无效'),
  body('check_out')
    .isDate()
    .withMessage('退房日期格式无效')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.check_in)) {
        throw new Error('退房日期必须晚于入住日期');
      }
      return true;
    }),
  body('rental_type')
    .isIn(RENTAL_TYPES)
    .withMessage(`租期类型必须为 ${RENTAL_TYPES.join(', ')} 之一`),
  body('platform_source')
    .isIn(PLATFORM_SOURCES)
    .withMessage(`平台来源必须为预定义选项之一`),
  body('total_revenue')
    .isFloat({ min: 0 })
    .withMessage('总收入不能为负数'),
  body('commission')
    .isFloat({ min: 0 })
    .withMessage('佣金不能为负数'),
  body('booking_status')
    .optional()
    .isIn(BOOKING_STATUSES)
    .withMessage(`订单状态必须为 ${BOOKING_STATUSES.join(', ')} 之一`),
];

export const updateBookingValidation = [
  body('guest_name')
    .optional()
    .notEmpty()
    .withMessage('客人姓名不能为空'),
  body('room_id')
    .optional()
    .isInt()
    .withMessage('房源ID必须为整数'),
  body('check_in')
    .optional()
    .isDate()
    .withMessage('入住日期格式无效'),
  body('check_out')
    .optional()
    .isDate()
    .withMessage('退房日期格式无效')
    .custom((value, { req }) => {
      const checkIn = req.body.check_in;
      if (checkIn && new Date(value) <= new Date(checkIn)) {
        throw new Error('退房日期必须晚于入住日期');
      }
      return true;
    }),
  body('rental_type')
    .optional()
    .isIn(RENTAL_TYPES)
    .withMessage(`租期类型必须为 ${RENTAL_TYPES.join(', ')} 之一`),
  body('platform_source')
    .optional()
    .isIn(PLATFORM_SOURCES)
    .withMessage(`平台来源必须为预定义选项之一`),
  body('total_revenue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('总收入不能为负数'),
  body('commission')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('佣金不能为负数'),
  body('booking_status')
    .optional()
    .isIn(BOOKING_STATUSES)
    .withMessage(`订单状态必须为 ${BOOKING_STATUSES.join(', ')} 之一`),
];
