import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';
import {
  createFriendRoom, fetchFriendRoom, joinFriendRoom, leaveFriendRoom, rematchFriendRoom,
  setFriendReady, startFriendMatch, submitFriendAnswer,
} from '@/backend/friends-api';
import type { FriendRoomSnapshot, GuestProfilePayload, QuizCategoryId } from '@/backend/types';
import { supabase } from '@/backend/supabase';

const ACTIVE_ROOM_KEY = 'bloopiq-active-friend-room-v1';
let channel: RealtimeChannel | null = null;
let refreshTimer: ReturnType<typeof setInterval> | null = null;
let currentProfile: GuestProfilePayload | null = null;
let refreshBusy = false;

type Connection = 'idle' | 'connecting' | 'live' | 'recovering';
type FriendsStore = {
  snapshot: FriendRoomSnapshot | null;
  loading: boolean;
  message: string | null;
  connection: Connection;
  createRoom: (profile: GuestProfilePayload, category: QuizCategoryId) => Promise<FriendRoomSnapshot | null>;
  joinRoom: (profile: GuestProfilePayload, code: string) => Promise<FriendRoomSnapshot | null>;
  resumeRoom: (profile: GuestProfilePayload) => Promise<string | null>;
  connect: (profile: GuestProfilePayload, roomId: string) => Promise<void>;
  refresh: () => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  start: () => Promise<void>;
  answer: (choiceId: string | null) => Promise<void>;
  leave: () => Promise<void>;
  rematch: () => Promise<void>;
  clearMessage: () => void;
  disconnect: () => void;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Play with Friends is temporarily unavailable.';
}

async function remember(roomId: string | null) {
  if (roomId) await AsyncStorage.setItem(ACTIVE_ROOM_KEY, roomId);
  else await AsyncStorage.removeItem(ACTIVE_ROOM_KEY);
}

export const useFriendsStore = create<FriendsStore>((set, get) => ({
  snapshot: null, loading: false, message: null, connection: 'idle',
  createRoom: async (profile, category) => {
    set({ loading: true, message: null });
    try {
      const next = await createFriendRoom(profile, category);
      await remember(next.roomId);
      set({ snapshot: next, loading: false });
      return next;
    } catch (error) { set({ loading: false, message: errorMessage(error) }); return null; }
  },
  joinRoom: async (profile, code) => {
    set({ loading: true, message: null });
    try {
      const next = await joinFriendRoom(profile, code);
      await remember(next.roomId);
      set({ snapshot: next, loading: false });
      return next;
    } catch (error) { set({ loading: false, message: errorMessage(error) }); return null; }
  },
  resumeRoom: async (profile) => {
    const roomId = await AsyncStorage.getItem(ACTIVE_ROOM_KEY);
    if (!roomId) return null;
    try {
      const next = await fetchFriendRoom(profile, roomId);
      if (next.status === 'closed') { await remember(null); return null; }
      set({ snapshot: next });
      return roomId;
    } catch { await remember(null); return null; }
  },
  connect: async (profile, roomId) => {
    currentProfile = profile;
    set({ connection: 'connecting', message: null });
    await get().refresh();
    if (!supabase) return;
    if (channel) await supabase.removeChannel(channel);
    channel = supabase.channel(`friend-room-${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend_room_events', filter: `room_id=eq.${roomId}` }, () => { void get().refresh(); })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') set({ connection: 'live' });
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') set({ connection: 'recovering' });
      });
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => { void get().refresh(); }, 3000);
  },
  refresh: async () => {
    const roomId = get().snapshot?.roomId ?? await AsyncStorage.getItem(ACTIVE_ROOM_KEY);
    if (!roomId || !currentProfile || refreshBusy) return;
    refreshBusy = true;
    try { set({ snapshot: await fetchFriendRoom(currentProfile, roomId), message: null }); }
    catch (error) { set({ connection: 'recovering', message: errorMessage(error) }); }
    finally { refreshBusy = false; }
  },
  setReady: async (ready) => {
    const roomId = get().snapshot?.roomId; if (!roomId) return;
    set({ loading: true, message: null });
    try { set({ snapshot: await setFriendReady(roomId, ready), loading: false }); }
    catch (error) { set({ loading: false, message: errorMessage(error) }); }
  },
  start: async () => {
    const roomId = get().snapshot?.roomId; if (!roomId) return;
    set({ loading: true, message: null });
    try { set({ snapshot: await startFriendMatch(roomId), loading: false }); }
    catch (error) { set({ loading: false, message: errorMessage(error) }); }
  },
  answer: async (choiceId) => {
    const current = get().snapshot; if (!current || current.myAnswer) return;
    try { set({ snapshot: await submitFriendAnswer(current, choiceId), message: null }); }
    catch (error) { set({ message: errorMessage(error) }); void get().refresh(); }
  },
  leave: async () => {
    const roomId = get().snapshot?.roomId;
    try { if (roomId) await leaveFriendRoom(roomId); } finally { await remember(null); get().disconnect(); set({ snapshot: null }); }
  },
  rematch: async () => {
    const roomId = get().snapshot?.roomId; if (!roomId) return;
    set({ loading: true, message: null });
    try { set({ snapshot: await rematchFriendRoom(roomId), loading: false }); }
    catch (error) { set({ loading: false, message: errorMessage(error) }); }
  },
  clearMessage: () => set({ message: null }),
  disconnect: () => {
    if (refreshTimer) clearInterval(refreshTimer); refreshTimer = null;
    if (channel && supabase) void supabase.removeChannel(channel); channel = null;
    currentProfile = null; set({ connection: 'idle' });
  },
}));
