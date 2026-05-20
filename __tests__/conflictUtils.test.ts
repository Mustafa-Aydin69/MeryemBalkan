import { describe, it, expect } from 'vitest';
import {
  BLOCKING_STATUSES,
  CONFLICT_WINDOW_DAYS,
  getConflictDateRange,
} from '../app/lib/conflictUtils';

describe('BLOCKING_STATUSES', () => {
  it('contains exactly Hazırlanıyor and Kirada', () => {
    expect(BLOCKING_STATUSES).toContain('Hazırlanıyor');
    expect(BLOCKING_STATUSES).toContain('Kirada');
    expect(BLOCKING_STATUSES).toHaveLength(2);
  });
});

describe('CONFLICT_WINDOW_DAYS', () => {
  it('is 7', () => {
    expect(CONFLICT_WINDOW_DAYS).toBe(7);
  });
});

describe('getConflictDateRange', () => {
  it('returns ±7 days around the given date', () => {
    const { startDate, endDate } = getConflictDateRange('2025-06-15');
    expect(startDate).toBe('2025-06-08');
    expect(endDate).toBe('2025-06-22');
  });

  it('returns YYYY-MM-DD formatted strings', () => {
    const { startDate, endDate } = getConflictDateRange('2025-01-01');
    expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('the window is exactly 14 days wide', () => {
    const { startDate, endDate } = getConflictDateRange('2025-06-15');
    const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
    expect(diffMs / (1000 * 60 * 60 * 24)).toBe(14);
  });

  it('startDate is always before endDate', () => {
    const { startDate, endDate } = getConflictDateRange('2025-06-15');
    expect(startDate < endDate).toBe(true);
  });

  it('handles month boundary correctly', () => {
    const { startDate, endDate } = getConflictDateRange('2025-03-05');
    expect(startDate).toBe('2025-02-26');
    expect(endDate).toBe('2025-03-12');
  });

  it('handles year boundary correctly', () => {
    const { startDate, endDate } = getConflictDateRange('2025-01-03');
    expect(startDate).toBe('2024-12-27');
    expect(endDate).toBe('2025-01-10');
  });

  it('handles leap year correctly', () => {
    const { startDate, endDate } = getConflictDateRange('2024-02-29');
    expect(startDate).toBe('2024-02-22');
    expect(endDate).toBe('2024-03-07');
  });

  it('uses CONFLICT_WINDOW_DAYS as the offset', () => {
    const date = '2025-06-15';
    const { startDate, endDate } = getConflictDateRange(date);
    const center = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startOffset = (center.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const endOffset = (end.getTime() - center.getTime()) / (1000 * 60 * 60 * 24);
    expect(startOffset).toBe(CONFLICT_WINDOW_DAYS);
    expect(endOffset).toBe(CONFLICT_WINDOW_DAYS);
  });
});
