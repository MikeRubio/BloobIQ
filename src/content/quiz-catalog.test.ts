import { describe, expect, it } from 'vitest';
import { browsePath, getQuiz, quickPlayQuiz, quizzes, quizzesForGroup, quizzesForMode, supportsMode } from './quiz-catalog';

describe('quiz catalogue', () => {
  it('keeps browsing groups separate from backend quiz IDs', () => {
    expect(quizzesForGroup('sports').map((quiz) => quiz.id)).toEqual(['football', 'baseball', 'basketball']);
    expect(getQuiz('football').packLabel).toBe('Leagues & Confederations');
    expect(getQuiz('baseball').packLabel).toBe('MLB Team Logos');
    expect(getQuiz('basketball').packLabel).toBe('NBA Team Logos');
  });

  it('filters only genuinely supported game modes', () => {
    expect(quizzesForMode('casual').map((quiz) => quiz.id)).toEqual(['flags', 'football', 'baseball', 'basketball']);
    expect(quizzesForMode('daily').map((quiz) => quiz.id)).toEqual(['flags', 'football', 'baseball', 'basketball']);
    expect(quizzesForMode('friends').map((quiz) => quiz.id)).toEqual(['flags', 'football', 'baseball', 'basketball']);
    expect(supportsMode('football', 'casual')).toBe(true);
  });

  it('uses real bundled and hosted catalogue counts', () => {
    expect(quizzes.flags.bundledCount).toBe(48);
    expect(quizzes.flags.onlineCount).toBe(195);
    expect(quizzes.football.onlineCount).toBe(10);
    expect(quizzes.baseball.onlineCount).toBe(30);
    expect(quizzes.basketball.onlineCount).toBe(30);
  });

  it('skips an unnecessary Flags browsing screen', () => {
    expect(browsePath('flags')).toEqual({ pathname: '/quiz', params: { quiz: 'flags' } });
    expect(browsePath('sports')).toEqual({ pathname: '/category', params: { group: 'sports' } });
  });

  it('reopens the actual last-played Casual quiz', () => {
    expect(quickPlayQuiz('football').id).toBe('football');
    expect(quickPlayQuiz('baseball').id).toBe('baseball');
    expect(quickPlayQuiz('basketball').id).toBe('basketball');
    expect(quickPlayQuiz(undefined).id).toBe('flags');
  });
});
