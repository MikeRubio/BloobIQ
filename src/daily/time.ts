const DAY_MS = 86_400_000;

export function utcDayKey(timestamp: number | Date): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function utcWeekBounds(timestamp: number | Date): { start: string; endExclusive: string } {
  const date = new Date(timestamp);
  const utcDay = date.getUTCDay() || 7;
  const startMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - (utcDay - 1) * DAY_MS;
  return { start: utcDayKey(startMs), endExclusive: utcDayKey(startMs + 7 * DAY_MS) };
}

export function formatCountdown(target: string | number, now = Date.now()): string {
  const targetMs = typeof target === 'number' ? target : Date.parse(target);
  const remaining = Math.max(0, targetMs - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`;
}

export function localDeadline(serverNow: string, serverDeadline: string, receivedAt = Date.now()): number {
  return receivedAt + Math.max(0, Date.parse(serverDeadline) - Date.parse(serverNow));
}
