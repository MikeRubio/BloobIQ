import { describe, expect, it } from 'vitest';
import type { FriendRoomSnapshot } from '@/backend/types';
import { projectFriendPhase } from './timing';

const anchor = Date.parse('2026-10-28T12:00:00.000Z');
const base = { status: 'playing', startsAt: '2026-10-28T12:00:03.000Z', serverNow: '2026-10-28T12:00:00.000Z', localServerAnchorMs: anchor } as FriendRoomSnapshot;

describe('friend match timing', () => {
  it('projects countdown, question, reveal, and final from server time', () => {
    const local = anchor;
    expect(projectFriendPhase(base, local)).toMatchObject({ phase: 'countdown', remainingMs: 3000 });
    expect(projectFriendPhase({ ...base, serverNow: '2026-10-28T12:00:03.000Z' }, local)).toMatchObject({ phase: 'question', questionIndex: 0, remainingMs: 10000 });
    expect(projectFriendPhase({ ...base, serverNow: '2026-10-28T12:00:13.000Z' }, local)).toMatchObject({ phase: 'reveal', questionIndex: 0, remainingMs: 3000 });
    expect(projectFriendPhase({ ...base, serverNow: '2026-10-28T12:02:13.000Z' }, local)).toMatchObject({ phase: 'results', questionIndex: null });
  });

  it('keeps advancing from a fixed server snapshot between network refreshes', () => {
    expect(projectFriendPhase(base, anchor + 1000)).toMatchObject({ phase: 'countdown', remainingMs: 2000 });
    expect(projectFriendPhase(base, anchor + 3500)).toMatchObject({ phase: 'question', questionIndex: 0, remainingMs: 9500 });
    expect(projectFriendPhase(base, anchor + 13_500)).toMatchObject({ phase: 'reveal', questionIndex: 0, remainingMs: 2500 });
  });
});
