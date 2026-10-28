import { useEffect, useRef, useState } from 'react';
import { QUESTION_DURATION_MS } from '@/game/scoring';

export function useGameTimer(deadlineAt: number | null, pausedRemainingMs: number | null, active: boolean, onTimeout: () => void) {
  const [remainingMs, setRemainingMs] = useState(pausedRemainingMs ?? QUESTION_DURATION_MS);
  const firedForDeadline = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    if (pausedRemainingMs !== null) return;
    if (deadlineAt === null) return;

    firedForDeadline.current = null;
    const update = () => {
      const next = Math.max(0, deadlineAt - Date.now());
      setRemainingMs(next);
      if (next === 0 && firedForDeadline.current !== deadlineAt) {
        firedForDeadline.current = deadlineAt;
        onTimeout();
      }
    };
    const initialUpdate = setTimeout(update, 0);
    const interval = setInterval(update, 100);
    return () => {
      clearTimeout(initialUpdate);
      clearInterval(interval);
    };
  }, [active, deadlineAt, onTimeout, pausedRemainingMs]);

  const displayedRemainingMs = pausedRemainingMs ?? remainingMs;
  return { remainingMs: displayedRemainingMs, progress: Math.max(0, Math.min(1, displayedRemainingMs / QUESTION_DURATION_MS)) };
}
