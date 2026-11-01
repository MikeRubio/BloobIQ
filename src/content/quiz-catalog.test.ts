import { describe, expect, it } from 'vitest';
import { browsePath, getQuiz, quickPlayQuiz, quizzes, quizzesForGroup, quizzesForMode, supportsMode } from './quiz-catalog';

describe('quiz catalogue', () => {
  it('keeps browsing groups separate from backend quiz IDs', () => {
    expect(quizzesForGroup('sports').map((quiz) => quiz.id)).toEqual(['football', 'baseball', 'basketball']);
    expect(quizzesForGroup('brands').map((quiz) => quiz.id)).toEqual(['brands']);
    expect(quizzesForGroup('people').map((quiz) => quiz.id)).toEqual(['history', 'celebrities']);
    expect(getQuiz('football').packLabel).toBe('Leagues & Confederations');
    expect(getQuiz('baseball').packLabel).toBe('MLB & Caribbean Teams');
    expect(getQuiz('basketball').packLabel).toBe('NBA Teams & Trivia');
  });

  it('filters only genuinely supported game modes', () => {
    const allQuizzes = ['flags', 'football', 'baseball', 'basketball', 'brands', 'history', 'celebrities'];
    expect(quizzesForMode('casual').map((quiz) => quiz.id)).toEqual(allQuizzes);
    expect(quizzesForMode('daily').map((quiz) => quiz.id)).toEqual(allQuizzes);
    expect(quizzesForMode('friends').map((quiz) => quiz.id)).toEqual(allQuizzes);
    expect(supportsMode('football', 'casual')).toBe(true);
  });

  it('uses hosted catalogue counts for every online quiz', () => {
    expect(quizzes.flags.onlineCount).toBe(195);
    expect(quizzes.football.onlineCount).toBe(30);
    expect(quizzes.baseball.onlineCount).toBe(47);
    expect(quizzes.basketball.onlineCount).toBe(78);
    expect(quizzes.brands.onlineCount).toBe(22);
    expect(quizzes.history.onlineCount).toBe(100);
    expect(quizzes.celebrities.onlineCount).toBe(95);
  });

  it('skips an unnecessary Flags browsing screen', () => {
    expect(browsePath('flags')).toEqual({ pathname: '/quiz', params: { quiz: 'flags' } });
    expect(browsePath('sports')).toEqual({ pathname: '/category', params: { group: 'sports' } });
  });

  it('reopens the actual last-played Casual quiz', () => {
    expect(quickPlayQuiz('football').id).toBe('football');
    expect(quickPlayQuiz('baseball').id).toBe('baseball');
    expect(quickPlayQuiz('basketball').id).toBe('basketball');
    expect(quickPlayQuiz('brands').id).toBe('brands');
    expect(quickPlayQuiz('history').id).toBe('history');
    expect(quickPlayQuiz('celebrities').id).toBe('celebrities');
    expect(quickPlayQuiz(undefined).id).toBe('flags');
  });
});
