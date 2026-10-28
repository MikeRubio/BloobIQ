import type { Difficulty, QuizQuestion } from '@/game/types';

const provenance = {
  sourceName: 'hampusborgos/country-flags',
  sourceUrl: 'https://github.com/hampusborgos/country-flags',
  license: 'Public domain (PD); source artwork derived from Wikimedia Commons',
} as const;

const europe = ['at', 'be', 'hr', 'cz', 'dk', 'fi', 'fr', 'de', 'gr', 'hu', 'is', 'ie', 'it', 'nl', 'no', 'pl', 'pt', 'ro', 'es', 'se', 'ch', 'tr', 'ua', 'gb'];
const americas = ['ar', 'br', 'ca', 'cl', 'co', 'mx', 'us', 'pe'];
const asiaPacific = ['au', 'cn', 'in', 'id', 'jp', 'nz', 'kr', 'th', 'vn'];
const africaMiddleEast = ['eg', 'gh', 'ke', 'ma', 'ng', 'sa', 'za'];

const names: Record<string, string> = {
  ar: 'Argentina', au: 'Australia', at: 'Austria', be: 'Belgium', br: 'Brazil', ca: 'Canada',
  cl: 'Chile', cn: 'China', co: 'Colombia', hr: 'Croatia', cz: 'Czechia', dk: 'Denmark',
  eg: 'Egypt', fi: 'Finland', fr: 'France', de: 'Germany', gr: 'Greece', hu: 'Hungary',
  is: 'Iceland', in: 'India', id: 'Indonesia', ie: 'Ireland', it: 'Italy', jp: 'Japan',
  mx: 'Mexico', ma: 'Morocco', nl: 'Netherlands', nz: 'New Zealand', ng: 'Nigeria', no: 'Norway',
  pl: 'Poland', pt: 'Portugal', ro: 'Romania', sa: 'Saudi Arabia', za: 'South Africa', kr: 'South Korea',
  es: 'Spain', se: 'Sweden', ch: 'Switzerland', th: 'Thailand', tr: 'Türkiye', ua: 'Ukraine',
  gb: 'United Kingdom', us: 'United States', vn: 'Vietnam', gh: 'Ghana', ke: 'Kenya', pe: 'Peru',
};

const easy = new Set(['ar', 'au', 'br', 'ca', 'cn', 'fr', 'de', 'in', 'it', 'jp', 'mx', 'kr', 'es', 'gb', 'us']);
const hard = new Set(['hr', 'cz', 'hu', 'is', 'id', 'ie', 'ro', 'gh', 'ke', 'pe']);

function difficultyFor(code: string): Difficulty {
  if (easy.has(code)) return 'easy';
  if (hard.has(code)) return 'hard';
  return 'medium';
}

function groupFor(code: string): string[] {
  return [europe, americas, asiaPacific, africaMiddleEast].find((group) => group.includes(code)) ?? Object.keys(names);
}

export const flagQuestions: QuizQuestion[] = Object.entries(names).map(([code, displayName]) => {
  const sameRegion = groupFor(code).filter((candidate) => candidate !== code);
  const fallback = Object.keys(names).filter((candidate) => candidate !== code && !sameRegion.includes(candidate));
  return {
    id: `flag-${code}`,
    categoryId: 'flags',
    displayName,
    assetKey: code,
    difficulty: difficultyFor(code),
    distractorCandidates: [...sameRegion, ...fallback].slice(0, 12).map((candidate) => `flag-${candidate}`),
    provenance,
  };
});

export const flagQuestionById = Object.fromEntries(flagQuestions.map((question) => [question.id, question])) as Record<string, QuizQuestion>;
