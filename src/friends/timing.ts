import type { FriendRoomPhase, FriendRoomSnapshot } from '@/backend/types';

export type ProjectedFriendPhase = { phase: FriendRoomPhase; questionIndex: number | null; remainingMs: number };

export function projectFriendPhase(snapshot: FriendRoomSnapshot, localNow = Date.now()): ProjectedFriendPhase {
  if (snapshot.status === 'closed') return { phase: 'closed', questionIndex: null, remainingMs: 0 };
  if (!snapshot.startsAt || snapshot.status === 'lobby') return { phase: 'lobby', questionIndex: null, remainingMs: 0 };
  const localAnchor = snapshot.localServerAnchorMs ?? localNow;
  const now = Date.parse(snapshot.serverNow) + Math.max(0, localNow - localAnchor);
  const start = Date.parse(snapshot.startsAt);
  if (now < start) return { phase: 'countdown', questionIndex: null, remainingMs: Math.max(0, start - now) };
  const elapsed = now - start;
  if (elapsed >= 130_000 || snapshot.status === 'results') return { phase: 'results', questionIndex: null, remainingMs: 0 };
  const questionIndex = Math.floor(elapsed / 13_000);
  const within = elapsed - questionIndex * 13_000;
  return within < 10_000
    ? { phase: 'question', questionIndex, remainingMs: 10_000 - within }
    : { phase: 'reveal', questionIndex, remainingMs: 13_000 - within };
}
