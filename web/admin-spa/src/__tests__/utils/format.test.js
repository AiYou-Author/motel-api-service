import { describe, it, expect } from 'vitest';

// 示例工具函数
const formatUtils = {
  formatDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },
  
  formatCurrency: (amount) => {
    if (typeof amount !== 'number') return '¥0.00';
    return `¥${amount.toFixed(2)}`;
  },
  
  truncateText: (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  },
};

describe('Format Utils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatUtils.formatDate(date)).toBe('2024-01-15');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatUtils.formatDate(null)).toBe('');
      expect(formatUtils.formatDate(undefined)).toBe('');
      expect(formatUtils.formatDate('')).toBe('');
    });

    it('handles string dates', () => {
      expect(formatUtils.formatDate('2024-01-15')).toBe('2024-01-15');
    });
  });

  describe('formatCurrency', () => {
    it('formats positive numbers', () => {
      expect(formatUtils.formatCurrency(100)).toBe('¥100.00');
      expect(formatUtils.formatCurrency(99.99)).toBe('¥99.99');
      expect(formatUtils.formatCurrency(0)).toBe('¥0.00');
    });

    it('formats negative numbers', () => {
      expect(formatUtils.formatCurrency(-50)).toBe('¥-50.00');
    });

    it('handles non-numbers', () => {
      expect(formatUtils.formatCurrency(null)).toBe('¥0.00');
      expect(formatUtils.formatCurrency(undefined)).toBe('¥0.00');
      expect(formatUtils.formatCurrency('abc')).toBe('¥0.00');
    });
  });

  describe('truncateText', () => {
    it('does not truncate short text', () => {
      const shortText = 'Hello World';
      expect(formatUtils.truncateText(shortText, 20)).toBe(shortText);
    });

    it('truncates long text', () => {
      const longText = 'This is a very long text that needs to be truncated';
      const truncated = formatUtils.truncateText(longText, 20);
      expect(truncated).toBe('This is a very long ...');
      expect(truncated.length).toBe(23); // 20 chars + '...'
    });

    it('uses default maxLength', () => {
      const text = 'A'.repeat(60);
      const truncated = formatUtils.truncateText(text);
      expect(truncated.length).toBe(53); // 50 chars + '...'
    });

    it('handles edge cases', () => {
      expect(formatUtils.truncateText('')).toBe('');
      expect(formatUtils.truncateText(null)).toBe(null);
      expect(formatUtils.truncateText(undefined)).toBe(undefined);
    });
  });
});