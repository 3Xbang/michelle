/**
 * 净收入计算工具
 * 使用整数运算（乘100转为分）避免浮点精度问题
 */

/**
 * 计算净收入 = 总收入 - 佣金
 * @param {number} totalRevenue - 总收入
 * @param {number} commission - 佣金
 * @returns {number} 净收入
 */
export function calculateNetIncome(totalRevenue, commission) {
  const revenueCents = Math.round(totalRevenue * 100);
  const commissionCents = Math.round(commission * 100);
  return (revenueCents - commissionCents) / 100;
}
