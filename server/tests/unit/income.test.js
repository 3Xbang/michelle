import { describe, it, expect } from 'vitest';
import { calculateNetIncome } from '../../src/utils/income.js';

describe('calculateNetIncome', () => {
  it('should calculate net income correctly for simple values', () => {
    expect(calculateNetIncome(5000, 750)).toBe(4250);
  });

  it('should handle zero commission', () => {
    expect(calculateNetIncome(1000, 0)).toBe(1000);
  });

  it('should handle zero revenue and zero commission', () => {
    expect(calculateNetIncome(0, 0)).toBe(0);
  });

  it('should handle commission equal to revenue', () => {
    expect(calculateNetIncome(500, 500)).toBe(0);
  });

  it('should avoid floating-point precision issues (0.1 + 0.2 case)', () => {
    // 0.3 - 0.1 in naive JS would give 0.19999999999999998
    expect(calculateNetIncome(0.3, 0.1)).toBe(0.2);
  });

  it('should handle decimal values correctly', () => {
    expect(calculateNetIncome(100.10, 10.20)).toBe(89.9);
  });

  it('should be idempotent: parsing the result produces the same value', () => {
    const result = calculateNetIncome(1234.56, 123.45);
    expect(parseFloat(result.toFixed(2))).toBe(result);
  });
});
