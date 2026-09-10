/**
 * Formats confidence from API (0–1 decimal or 0–100 integer) as a percentage string.
 */
export const getCondidenceValue = (
  value: number | string | null | undefined,
): string => {
  if (value == null || value === '') {
    return '—';
  }

  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) {
    return '—';
  }

  if (n >= 0 && n <= 1) {
    return `${Math.round(n * 100)}%`;
  }

  if (n > 1 && n <= 100) {
    return `${Math.round(n)}%`;
  }

  return `${Math.round(Math.min(Math.max(n, 0), 100))}%`;
};
