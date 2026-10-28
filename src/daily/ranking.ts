export type Rankable = { id: string; score: number; durationMs: number };

export function competitionRanks<T extends Rankable>(entries: readonly T[]): (T & { position: number })[] {
  const ordered = [...entries].sort((a, b) => b.score - a.score || a.durationMs - b.durationMs || a.id.localeCompare(b.id));
  let position = 0;
  return ordered.map((entry, index) => {
    const previous = ordered[index - 1];
    if (!previous || previous.score !== entry.score || previous.durationMs !== entry.durationMs) position = index + 1;
    return { ...entry, position };
  });
}
