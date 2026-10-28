import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleBackground } from '@/components/bubble-background';
import { GameButton } from '@/components/game-button';
import { ScreenHeader } from '@/components/screen-header';
import { useDailyStore } from '@/store/daily-store';
import { useProfileStore } from '@/store/profile-store';
import { backendProfileFromLocal } from '@/backend/profile-migration';
import { normalizeQuizCategory, quizCategoryCopy } from '@/backend/categories';
import { getQuiz } from '@/content/quiz-catalog';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

const rules = [
  ['10', 'questions'], ['10s', 'per answer'], ['100', 'points each'], ['1×', 'ranked attempt'],
] as const;

export default function DailyIntroScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const categoryId = normalizeQuizCategory(params.category);
  const quiz = getQuiz(categoryId);
  const copy = quizCategoryCopy[categoryId];
  const profile = useProfileStore((state) => state.profile);
  const hydrated = useProfileStore((state) => state.hydrated);
  const status = useDailyStore((state) => state.status);
  const snapshot = useDailyStore((state) => state.snapshot);
  const message = useDailyStore((state) => state.message);
  const activeCategoryId = useDailyStore((state) => state.activeCategoryId);
  const start = useDailyStore((state) => state.start);
  const load = useDailyStore((state) => state.load);
  useEffect(() => {
    if (!hydrated || (status !== 'idle' && activeCategoryId === categoryId)) return;
    const timer = setTimeout(() => void load(backendProfileFromLocal(profile), categoryId), 0);
    return () => clearTimeout(timer);
  }, [activeCategoryId, categoryId, hydrated, load, profile, status]);
  const categorySnapshot = snapshot?.categoryId === categoryId ? snapshot : null;
  const begin = async () => {
    if (categorySnapshot?.state === 'in_progress') return router.replace({ pathname: '/daily', params: { category: categoryId } });
    if (categorySnapshot?.state === 'completed' || categorySnapshot?.state === 'expired') return router.replace({ pathname: '/daily-results', params: { category: categoryId } });
    const next = await start(backendProfileFromLocal(profile), categoryId);
    if (next?.state === 'in_progress') router.replace({ pathname: '/daily', params: { category: categoryId } });
    else if (next) router.replace({ pathname: '/daily-results', params: { category: categoryId } });
  };
  const label = categorySnapshot?.state === 'in_progress' ? 'Resume Ranked Attempt' : categorySnapshot?.state === 'completed' || categorySnapshot?.state === 'expired' ? 'View Today’s Result' : 'Start Ranked Attempt';

  return (
    <View style={styles.root}>
      <BubbleBackground />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title={copy.dailyTitle} subtitle="Ranked challenge" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.hero, shadow.card]}><Text style={styles.sun}>{quiz.icon}</Text><Text style={styles.title}>One shot at today’s board</Text><Text style={styles.body}>{copy.introBody}</Text></View>
          <View style={styles.ruleGrid}>{rules.map(([value, labelText]) => <View key={labelText} style={styles.rule}><Text style={styles.ruleValue}>{value}</Text><Text style={styles.ruleLabel}>{labelText}</Text></View>)}</View>
          <View style={[styles.info, shadow.card]}>
            <Text style={styles.infoTitle}>Before you start</Text>
            <Text style={styles.infoText}>• All ten questions count, even after mistakes.</Text>
            <Text style={styles.infoText}>• No speed bonus, hints, hearts, or revives.</Text>
            <Text style={styles.infoText}>• Ranked timers continue while BloopIQ is in the background.</Text>
            <Text style={styles.infoText}>• Progress is saved after each server-accepted answer.</Text>
            <Text style={styles.infoText}>• If your connection drops, reopen and resume. Late answers score zero and advance.</Text>
            <Text style={styles.infoText}>• Attempts expire after 30 minutes. A run crossing UTC midnight stays attached to its original day.</Text>
          </View>
          {status === 'unconfigured' || status === 'error' ? <View style={styles.error}><Text style={styles.errorTitle}>{status === 'unconfigured' ? 'Backend setup needed' : 'Can’t reach ranked play'}</Text><Text style={styles.errorBody}>{message}</Text></View> : null}
          {status === 'loading' || !hydrated ? <ActivityIndicator color={colors.sky} style={styles.loader} /> : (
            <GameButton label={label} onPress={() => void begin()} variant="coral" disabled={status === 'unconfigured' || status === 'error'} />
          )}
          {(status === 'unconfigured' || status === 'error') ? <GameButton compact label="Retry Connection" onPress={() => void load(backendProfileFromLocal(profile), categoryId)} variant="ghost" style={styles.retry} /> : null}
          <Text style={styles.note}>Practice replay unlocks after the ranked attempt and never changes rankings or your daily streak.</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1, paddingHorizontal: spacing.lg }, content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingBottom: spacing.xxl },
  hero: { backgroundColor: colors.sky, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', marginTop: spacing.md }, sun: { fontSize: 42 }, title: { ...type.display, color: colors.white, fontSize: 25, textAlign: 'center', marginTop: spacing.sm }, body: { ...type.regular, color: '#EAF8FF', fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: spacing.sm },
  ruleGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }, rule: { flex: 1, minHeight: 78, borderRadius: radius.md, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border }, ruleValue: { ...type.display, color: colors.coral, fontSize: 20 }, ruleLabel: { ...type.regular, color: colors.inkSoft, fontSize: 9 },
  info: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginVertical: spacing.lg }, infoTitle: { ...type.heading, fontSize: 16, marginBottom: spacing.sm }, infoText: { ...type.regular, color: colors.inkSoft, fontSize: 12, lineHeight: 19 },
  error: { borderRadius: radius.md, backgroundColor: colors.dangerPale, padding: spacing.md, marginBottom: spacing.md }, errorTitle: { ...type.heading, color: colors.coralDark, fontSize: 14 }, errorBody: { ...type.regular, color: colors.inkSoft, fontSize: 11, marginTop: 3 }, loader: { marginVertical: spacing.xl }, retry: { marginTop: spacing.md }, note: { ...type.regular, color: colors.inkSoft, textAlign: 'center', fontSize: 10, lineHeight: 15, marginTop: spacing.lg },
});
