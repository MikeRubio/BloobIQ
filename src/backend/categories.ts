import type { QuizCategoryId } from './types';

export const quizCategoryCopy: Record<QuizCategoryId, {
  label: string;
  dailyTitle: string;
  prompt: string;
  introBody: string;
}> = {
  flags: {
    label: 'Flags',
    dailyTitle: 'Daily Flags',
    prompt: 'Which country is this?',
    introBody: 'Everyone gets the same flags, order, and choices. Your first attempt is the only ranked one.',
  },
  football: {
    label: 'Football',
    dailyTitle: 'Daily Football',
    prompt: 'Which football organization is this?',
    introBody: 'Everyone gets the same football identities, order, and choices. Your first attempt is the only ranked one.',
  },
};

export function normalizeQuizCategory(value: string | string[] | undefined): QuizCategoryId {
  return value === 'football' ? 'football' : 'flags';
}
