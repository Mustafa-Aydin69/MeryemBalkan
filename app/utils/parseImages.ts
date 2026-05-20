export function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    if (!raw.trim()) return [];
    try { return JSON.parse(raw); } catch { return [raw]; }
  }
  return [];
}
