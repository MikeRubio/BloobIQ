import type { QuizCategoryId } from './types';
import { isQuizAvailable } from '../content/release-policy';

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
  baseball: {
    label: 'Baseball',
    dailyTitle: 'Daily Baseball',
    prompt: 'Which MLB team is this?',
    introBody: 'Everyone gets the same MLB team logos, order, and choices. Your first attempt is the only ranked one.',
  },
  basketball: {
    label: 'Basketball',
    dailyTitle: 'Daily Basketball',
    prompt: 'Which NBA team is this?',
    introBody: 'Everyone gets the same NBA team logos, order, and choices. Your first attempt is the only ranked one.',
  },
  brands: {
    label: 'Brands', dailyTitle: 'Daily Brands', prompt: 'Which brand uses this symbol?',
    introBody: 'Everyone gets the same brand symbols, order, and choices. Your first attempt is the only ranked one.',
  },
  history: {
    label: 'History', dailyTitle: 'Daily History', prompt: 'Who is this historical figure?',
    introBody: 'Everyone gets the same historical figures, order, and choices. Your first attempt is the only ranked one.',
  },
  celebrities: {
    label: 'Celebrities', dailyTitle: 'Daily Celebrities', prompt: 'Who is this celebrity?',
    introBody: 'Everyone gets the same public figures, order, and choices. Your first attempt is the only ranked one.',
  },
};

export function normalizeQuizCategory(value: string | string[] | undefined): QuizCategoryId {
  const normalized = Array.isArray(value) ? value[0] : value;
  return isQuizAvailable(normalized) ? normalized : 'flags';
}
