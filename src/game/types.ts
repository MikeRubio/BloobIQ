export type CategoryId = 'flags' | 'brands' | 'football' | 'nfl' | 'baseball' | 'basketball' | 'hockey';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type FlagAssetKey = string;

export type AssetProvenance = { sourceName: string; sourceUrl: string; license: string };

export type QuizQuestion = {
  id: string;
  categoryId: CategoryId;
  displayName: string;
  assetKey: FlagAssetKey;
  assetUri?: string;
  revealAssetUri?: string;
  prompt?: string;
  questionDescription?: string;
  contentType?: string;
  difficulty: Difficulty;
  distractorCandidates: string[];
  provenance: AssetProvenance;
};

export type QuestionRound = { questionId: string; optionIds: string[] };

export type RunPhase = 'idle' | 'loading' | 'answering' | 'feedback' | 'revive-offer' | 'ad-in-progress' | 'complete';

export type Feedback = {
  kind: 'correct' | 'wrong' | 'timeout';
  selectedId: string | null;
  correctId: string;
  points: number;
} | null;

export type RunResult = {
  categoryId: CategoryId;
  score: number;
  correctAnswers: number;
  answeredQuestions: number;
  bestStreak: number;
  totalQuestions: number;
  completedPack: boolean;
  finishedAt: number;
  previousBest: number;
  isNewPersonalBest: boolean;
};

export type GameRunState = {
  runId: string;
  categoryId: CategoryId;
  phase: RunPhase;
  questions: QuizQuestion[];
  rounds: QuestionRound[];
  currentIndex: number;
  hearts: number;
  score: number;
  streak: number;
  bestStreak: number;
  correctAnswers: number;
  answeredQuestions: number;
  selectedOptionId: string | null;
  feedback: Feedback;
  deadlineAt: number | null;
  pausedRemainingMs: number | null;
  reviveUsed: boolean;
  adMessage: string | null;
  result: RunResult | null;
};
