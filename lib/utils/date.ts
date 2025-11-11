export function parseISODateToLocal(value?: string | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const [datePart] = trimmed.split('T');
  if (!datePart) return null;
  const separator = datePart.includes('-') ? '-' : datePart.includes('/') ? '/' : '';
  if (!separator) return null;
  const segments = datePart.split(separator);
  if (segments.length !== 3) return null;
  let year: number;
  let month: number;
  let day: number;
  if (separator === '-') {
    year = Number(segments[0]);
    month = Number(segments[1]);
    day = Number(segments[2]);
  } else {
    day = Number(segments[0]);
    month = Number(segments[1]);
    year = Number(segments[2]);
  }
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}



