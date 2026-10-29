import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleBackground } from '@/components/bubble-background';
import { GameButton } from '@/components/game-button';
import { useDailyStore } from '@/store/daily-store';
import { useProfileStore } from '@/store/profile-store';
import { backendProfileFromLocal } from '@/backend/profile-migration';
import { useDailyStateLifecycle } from '@/hooks/use-daily-state';
import { normalizeQuizCategory, quizCategoryCopy } from '@/backend/categories';
import { getQuiz } from '@/content/quiz-catalog';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

export default function DailyResultsScreen() {
  const params = useLocalSearchParams<{ category?: string; practice?: string; score?: string; correct?: string }>();
  const categoryId = normalizeQuizCategory(params.category);
  const quiz = getQuiz(categoryId);
  const copy = quizCategoryCopy[categoryId];
  const isPractice = params.practice === '1';
  const profile = useProfileStore((state) => state.profile);
  const hydrated = useProfileStore((state) => state.hydrated);
  const status = useDailyStore((state) => state.status);
  const message = useDailyStore((state) => state.message);
  const load = useDailyStore((state) => state.load);
  const snapshot = useDailyStore((state) => state.snapshot);
  const categorySnapshot = snapshot?.categoryId === categoryId ? snapshot : null;
  useDailyStateLifecycle({ categoryId, enabled: hydrated && !isPractice, profile });

  const score = isPractice ? Number(params.score ?? 0) : (categorySnapshot?.score ?? 0);
  const correct = isPractice ? Number(params.correct ?? 0) : (categorySnapshot?.correctCount ?? 0);
  if (!isPractice && (!hydrated || status === 'loading') && !categorySnapshot) return <View style={styles.loading}><ActivityIndicator color={colors.sky} size="large" /></View>;
  if (!isPractice && !categorySnapshot && (status === 'error' || status === 'unconfigured')) return <View style={styles.loading}><Text accessibilityRole="alert" style={styles.errorTitle}>Ranked result unavailable</Text><Text style={styles.errorBody}>{message ?? 'Check your connection and try again.'}</Text><GameButton compact label="Retry" onPress={() => void load(backendProfileFromLocal(profile), categoryId)} variant="ghost" /><GameButton compact label="Back" onPress={() => router.back()} variant="ghost" /></View>;

  return (
    <View style={styles.root}>
      <BubbleBackground />
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <View style={styles.badge}><Text style={styles.badgeIcon}>{isPractice ? '↻' : quiz.icon}</Text></View>
          <Text style={styles.category}>{copy.label}</Text>
          <Text style={styles.eyebrow}>{isPractice ? 'PRACTICE COMPLETE' : 'TODAY’S RANKED RESULT'}</Text>
          <Text style={styles.title}>{isPractice ? 'Nice replay!' : categorySnapshot?.state === 'expired' ? 'Attempt expired' : 'Daily complete!'}</Text>
          <View style={[styles.card, shadow.card]}>
            <Text style={styles.scoreLabel}>SCORE</Text><Text style={styles.score}>{score}</Text><Text style={styles.max}>out of 1,000</Text>
            <View style={styles.rule} />
            <View style={styles.stats}>
              <View style={styles.stat}><Text style={styles.statValue}>{correct}/10</Text><Text style={styles.statLabel}>Correct</Text></View>
              <View style={styles.divider} />
              <View style={styles.stat}><Text style={styles.statValue}>{isPractice ? '—' : categorySnapshot?.rank ? `#${categorySnapshot.rank}` : 'Pending'}</Text><Text style={styles.statLabel}>Today’s rank</Text></View>
              <View style={styles.divider} />
              <View style={styles.stat}><Text style={styles.statValue}>{isPractice ? '—' : categorySnapshot?.dailyStreak ?? 0}</Text><Text style={styles.statLabel}>Day streak</Text></View>
            </View>
          </View>
          <Text style={styles.practiceNote}>{isPractice ? 'Practice did not change your ranked score or streak.' : 'Your ranked result is final. Practice replays never change it.'}</Text>
          <View style={styles.actions}>
            {!isPractice && categorySnapshot?.state === 'completed' && categorySnapshot.practiceRounds?.length ? <GameButton label="Replay as Practice" onPress={() => router.replace({ pathname: '/daily', params: { category: categoryId, practice: '1' } })} variant="yellow" /> : null}
            <GameButton label="View Rankings" onPress={() => router.push({ pathname: '/rankings', params: { category: categoryId } })} variant="coral" />
            <GameButton label="Back Home" onPress={() => router.replace('/')} variant="ghost" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.surface }, errorTitle: { ...type.heading, color: colors.coralDark, fontSize: 18 }, errorBody: { ...type.regular, color: colors.inkSoft, fontSize: 12, textAlign: 'center', maxWidth: 320 }, content: { flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center', justifyContent: 'center', padding: spacing.xl },
  badge: { width: 86, height: 86, borderRadius: 43, backgroundColor: colors.surfaceWarm, borderWidth: 4, borderColor: colors.yellow, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }, badgeIcon: { fontSize: 42 }, category: { ...type.heading, color: colors.coralDark, fontSize: 11, textAlign: 'center', marginTop: spacing.md }, eyebrow: { ...type.heading, color: colors.skyDark, fontSize: 10, letterSpacing: 1.2, textAlign: 'center', marginTop: spacing.xs }, title: { ...type.display, fontSize: 29, textAlign: 'center', marginTop: spacing.xs },
  card: { borderRadius: radius.xl, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, padding: spacing.xl, alignItems: 'center', marginTop: spacing.xl }, scoreLabel: { ...type.heading, color: colors.inkSoft, fontSize: 9, letterSpacing: 1 }, score: { ...type.display, color: colors.skyDark, fontSize: 50 }, max: { ...type.regular, color: colors.inkSoft, fontSize: 11 }, rule: { alignSelf: 'stretch', height: 1, backgroundColor: colors.border, marginVertical: spacing.lg }, stats: { flexDirection: 'row', alignSelf: 'stretch', alignItems: 'center' }, stat: { flex: 1, alignItems: 'center' }, statValue: { ...type.display, fontSize: 18 }, statLabel: { ...type.regular, color: colors.inkSoft, fontSize: 9, marginTop: 3 }, divider: { width: 1, height: 38, backgroundColor: colors.border },
  practiceNote: { ...type.regular, color: colors.inkSoft, fontSize: 11, textAlign: 'center', marginTop: spacing.md }, actions: { gap: spacing.md, marginTop: spacing.xl },
});
