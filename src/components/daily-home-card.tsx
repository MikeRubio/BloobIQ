import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { formatCountdown } from '@/daily/time';
import { useDailyStore } from '@/store/daily-store';
import { useProfileStore } from '@/store/profile-store';
import { backendProfileFromLocal } from '@/backend/profile-migration';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

export function DailyHomeCard() {
  const profile = useProfileStore((state) => state.profile);
  const hydrated = useProfileStore((state) => state.hydrated);
  const status = useDailyStore((state) => state.status);
  const snapshot = useDailyStore((state) => state.snapshot);
  const activeCategoryId = useDailyStore((state) => state.activeCategoryId);
  const message = useDailyStore((state) => state.message);
  const load = useDailyStore((state) => state.load);
  const [, refreshClock] = useState(0);

  useEffect(() => { if (hydrated && (status === 'idle' || activeCategoryId !== 'flags')) void load(backendProfileFromLocal(profile), 'flags'); }, [activeCategoryId, hydrated, load, profile, status]);
  useEffect(() => {
    const timer = setInterval(() => refreshClock((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const flagsSnapshot = snapshot?.categoryId === 'flags' ? snapshot : null;
  const attemptState = flagsSnapshot?.state;
  const action = attemptState === 'in_progress' ? 'Resume' : attemptState === 'completed' ? 'View Result' : attemptState === 'expired' ? 'View Result' : 'Start';
  const open = () => {
    if (attemptState === 'in_progress') router.push({ pathname: '/daily', params: { category: 'flags' } });
    else if (attemptState === 'completed' || attemptState === 'expired') router.push({ pathname: '/daily-results', params: { category: 'flags' } });
    else router.push({ pathname: '/daily-intro', params: { category: 'flags' } });
  };
  const countdown = flagsSnapshot?.resetAt ? formatCountdown(flagsSnapshot.resetAt) : null;

  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.icon}><Text style={styles.iconText}>☀</Text></View>
      <View style={styles.copy}>
        <Text style={styles.title}>Today’s Flags</Text>
        <Text style={styles.body}>
          {status === 'loading' ? 'Checking today’s challenge…' :
            status === 'unconfigured' ? 'Ranked backend setup needed' :
            status === 'error' ? (message ?? 'Ranked service unavailable') :
            attemptState === 'completed' ? `${flagsSnapshot?.score ?? 0}/1000 • Rank ${flagsSnapshot?.rank ?? 'pending'}` :
            attemptState === 'in_progress' ? `Question ${(flagsSnapshot?.questionIndex ?? 0) + 1} of 10` :
            attemptState === 'expired' ? 'Ranked attempt expired' : '10 questions • One ranked attempt'}
        </Text>
        {flagsSnapshot ? <Text style={styles.meta}>🔥 {flagsSnapshot.dailyStreak} day streak{countdown ? `  •  New in ${countdown}` : ''}</Text> : null}
      </View>
      <View style={styles.actions}>
        {status === 'error' ? (
          <Pressable accessibilityRole="button" onPress={() => void load(backendProfileFromLocal(profile), 'flags')} style={styles.action}><Text style={styles.actionText}>Retry</Text></Pressable>
        ) : (
          <Pressable accessibilityRole="button" disabled={status === 'loading'} onPress={open} style={[styles.action, status === 'loading' && styles.disabled]}><Text style={styles.actionText}>{status === 'unconfigured' ? 'Setup' : action}</Text></Pressable>
        )}
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/daily-intro', params: { category: 'football' } })} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>⚽ Football</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/rankings', params: { category: 'flags' } })}><Text style={styles.rankings}>Rankings ›</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceWarm, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl, gap: spacing.md, borderWidth: 2, borderColor: '#F5E4AE' },
  icon: { width: 50, height: 50, borderRadius: radius.md, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 25, color: colors.ink }, copy: { flex: 1, minWidth: 0 },
  title: { ...type.heading, fontSize: 16 }, body: { ...type.regular, color: colors.inkSoft, fontSize: 11, marginTop: 2 },
  meta: { ...type.heading, color: colors.coralDark, fontSize: 9, marginTop: 5 }, actions: { alignItems: 'center', gap: 5 },
  action: { minWidth: 80, minHeight: 44, paddingHorizontal: spacing.md, borderRadius: radius.sm, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  actionText: { ...type.heading, color: colors.white, fontSize: 11 }, secondaryAction: { minWidth: 80, minHeight: 44, paddingHorizontal: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, secondaryActionText: { ...type.heading, color: colors.skyDark, fontSize: 9 }, rankings: { ...type.heading, color: colors.skyDark, fontSize: 10, paddingVertical: 7 }, disabled: { opacity: 0.55 },
});
