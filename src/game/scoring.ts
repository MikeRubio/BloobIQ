export const QUESTION_DURATION_MS = 10_000;
export const BASE_POINTS = 100;
export const MAX_SPEED_BONUS = 50;

export function calculateScore(remainingMs: number, durationMs = QUESTION_DURATION_MS): number {
  if (!Number.isFinite(remainingMs) || !Number.isFinite(durationMs) || durationMs <= 0) {
    return BASE_POINTS;
  }
  const clamped = Math.min(durationMs, Math.max(0, remainingMs));
  return BASE_POINTS + Math.round((clamped / durationMs) * MAX_SPEED_BONUS);
}
