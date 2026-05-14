export const BLOCKING_STATUSES = ['Hazırlanıyor', 'Kirada'] as const;
export const CONFLICT_WINDOW_DAYS = 7;

export function getConflictDateRange(dateStr: string): { startDate: string; endDate: string } {
  const date = new Date(dateStr);
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - CONFLICT_WINDOW_DAYS);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + CONFLICT_WINDOW_DAYS);
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}
