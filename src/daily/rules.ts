export type RankedEvaluation = { isCorrect: boolean; points: 0 | 100; elapsedMs: number; timedOut: boolean };

export function evaluateRankedAnswer(input: { questionStartedAt: number; receivedAt: number; choiceId: string | null; correctChoiceId: string }): RankedEvaluation {
  const rawElapsed = Math.max(0, input.receivedAt - input.questionStartedAt);
  const timedOut = rawElapsed > 10_000;
  const isCorrect = !timedOut && input.choiceId !== null && input.choiceId === input.correctChoiceId;
  return { isCorrect, points: isCorrect ? 100 : 0, elapsedMs: Math.min(rawElapsed, 10_000), timedOut };
}

export function interruptionOutcome(input: { now: number; questionDeadline: number; attemptExpiry: number }): 'resume' | 'timeout_current' | 'expired' {
  if (input.now >= input.attemptExpiry) return 'expired';
  if (input.now >= input.questionDeadline) return 'timeout_current';
  return 'resume';
}
