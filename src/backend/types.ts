export type DailyOption = { id: string; label: string };
export type QuizCategoryId = 'flags' | 'football' | 'baseball' | 'basketball';
export type CasualContentItem = {
  id: string;
  displayName: string;
  assetPath: string;
  revealAssetPath?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  contentType: string | null;
  distractorIds?: string[] | null;
  prompt?: string | null;
  questionDescription?: string | null;
};
export type CasualPack = {
  categoryId: QuizCategoryId;
  contentVersion: string;
  items: CasualContentItem[];
};
export type DailyRound = {
  index: number;
  roundId: string;
  assetKey: string;
  assetPath?: string;
  revealAssetPath?: string;
  prompt?: string;
  questionDescription?: string;
  options: DailyOption[];
  correctChoiceId?: string;
};

export type DailyAttemptState = 'not_started' | 'in_progress' | 'completed' | 'expired';

export type DailySnapshot = {
  state: DailyAttemptState;
  categoryId: QuizCategoryId;
  attemptId?: string;
  challengeDate: string;
  contentVersion: string;
  serverNow: string;
  resetAt: string;
  expiresAt?: string;
  questionIndex?: number;
  questionStartedAt?: string;
  questionDeadlineAt?: string;
  score: number;
  correctCount: number;
  answeredCount: number;
  dailyStreak: number;
  rank?: number | null;
  currentRound?: DailyRound | null;
  practiceRounds?: DailyRound[] | null;
  lastAnswer?: {
    questionIndex: number;
    isCorrect: boolean;
    points: number;
    correctChoiceId?: string;
    correctLabel?: string;
    revealAssetPath?: string;
  };
};

export type LeaderboardEntry = {
  position: number;
  displayName: string;
  avatar: string;
  avatarColor: string;
  score: number;
  durationMs: number;
  isCurrentPlayer: boolean;
};

export type LeaderboardResponse = {
  period: 'today' | 'week';
  categoryId: QuizCategoryId;
  boundaryStart: string;
  boundaryEnd: string;
  entries: LeaderboardEntry[];
};

export type GuestProfilePayload = { name: string; avatar: string; color: string };

export type FriendRoomPhase = 'lobby' | 'countdown' | 'question' | 'reveal' | 'results' | 'closed';
export type FriendMember = {
  userId: string;
  displayName: string;
  avatar: string;
  avatarColor: string;
  isReady: boolean;
  isHost: boolean;
  isCurrentPlayer: boolean;
  isConnected: boolean;
};
export type FriendStanding = {
  rank: number;
  userId: string;
  displayName: string;
  avatar: string;
  avatarColor: string;
  score: number;
  correctCount: number;
  durationMs: number;
  isCurrentPlayer: boolean;
};
export type FriendRoomSnapshot = {
  roomId: string;
  code: string;
  categoryId: QuizCategoryId;
  status: 'lobby' | 'playing' | 'results' | 'closed';
  serverNow: string;
  /** Local monotonic approximation of when serverNow occurred, added by the API adapter. */
  localServerAnchorMs?: number;
  expiresAt: string;
  hostUserId: string;
  isHost: boolean;
  members: FriendMember[];
  matchId?: string | null;
  startsAt?: string | null;
  phase: FriendRoomPhase;
  questionIndex?: number | null;
  phaseStartsAt?: string | null;
  phaseEndsAt?: string | null;
  round?: DailyRound | null;
  answerCount: number;
  myAnswer?: { choiceId: string | null; isCorrect: boolean; points: number; elapsedMs: number } | null;
  standings?: FriendStanding[] | null;
};
