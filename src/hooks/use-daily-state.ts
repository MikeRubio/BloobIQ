import { useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { backendProfileFromLocal } from '@/backend/profile-migration';
import type { QuizCategoryId } from '@/backend/types';
import { useDailyStore } from '@/store/daily-store';
import type { GuestProfile } from '@/store/profile-store';

const maxTimerMs = 2_147_000_000;
let lifecycleSequence = 0;

export function useDailyStateLifecycle({
  categoryId,
  enabled,
  profile,
}: {
  categoryId: QuizCategoryId;
  enabled: boolean;
  profile: GuestProfile;
}) {
  const load = useDailyStore((state) => state.load);
  const cancelLoad = useDailyStore((state) => state.cancelLoad);
  const resetAt = useDailyStore((state) => state.snapshot?.categoryId === categoryId ? state.snapshot.resetAt : null);
  const appState = useRef<AppStateStatus>(AppState.currentState as AppStateStatus);
  const wasOnline = useRef<boolean | null>(null);
  const ownerId = useRef(`daily-lifecycle-${++lifecycleSequence}`).current;

  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    void load(backendProfileFromLocal(profile), categoryId, ownerId);
    return () => cancelLoad(categoryId, ownerId);
  }, [cancelLoad, categoryId, enabled, load, ownerId, profile]));

  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    appState.current = AppState.currentState as AppStateStatus;
    const subscription = AppState.addEventListener('change', (next) => {
      const wasActive = appState.current === 'active';
      appState.current = next;
      if (!wasActive && next === 'active') void load(backendProfileFromLocal(profile), categoryId, ownerId);
    });
    return () => subscription.remove();
  }, [categoryId, enabled, load, ownerId, profile]));

  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    return NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      const reconnected = wasOnline.current === false && online;
      wasOnline.current = online;
      if (reconnected) void load(backendProfileFromLocal(profile), categoryId, ownerId);
    });
  }, [categoryId, enabled, load, ownerId, profile]));

  useFocusEffect(useCallback(() => {
    if (!enabled || !resetAt) return;
    const delay = Math.min(maxTimerMs, Math.max(0, Date.parse(resetAt) - Date.now() + 250));
    const timer = setTimeout(() => void load(backendProfileFromLocal(profile), categoryId, ownerId), delay);
    return () => clearTimeout(timer);
  }, [categoryId, enabled, load, ownerId, profile, resetAt]));
}
