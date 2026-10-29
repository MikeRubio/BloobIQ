import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { flagAssets } from '@/content/flag-assets';
import { localDeadline } from '@/daily/time';
import { useFeedback } from '@/hooks/use-feedback';
import { useGameTimer } from '@/hooks/use-game-timer';
import { useDailyStateLifecycle } from '@/hooks/use-daily-state';
import type { DailyRound } from '@/backend/types';
import { useDailyStore } from '@/store/daily-store';
import { useProfileStore } from '@/store/profile-store';
import { backendProfileFromLocal } from '@/backend/profile-migration';
import { normalizeQuizCategory, quizCategoryCopy } from '@/backend/categories';
import { getQuizAssetUrl } from '@/backend/supabase';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

const optionEdges = [colors.sky, colors.coral, colors.mintDark, colors.lilac];
type LocalFeedback = { round: DailyRound; choiceId: string | null; correctChoiceId: string | null; correctLabel: string | null; isCorrect: boolean; points: number; revealAssetPath: string | null };

export default function DailyGameScreen() {
  const { practice, category } = useLocalSearchParams<{ practice?: string; category?: string }>();
  const isPractice = practice === '1';
  const categoryId = normalizeQuizCategory(category);
  const copy = quizCategoryCopy[categoryId];
  const profile = useProfileStore((state) => state.profile);
  const hydrated = useProfileStore((state) => state.hydrated);
  const snapshot = useDailyStore((state) => state.snapshot);
  const status = useDailyStore((state) => state.status);
  const message = useDailyStore((state) => state.message);
  const activeCategoryId = useDailyStore((state) => state.activeCategoryId);
  const rankedFeedback = useDailyStore((state) => state.feedback);
  const submit = useDailyStore((state) => state.submit);
  const load = useDailyStore((state) => state.load);
  const clearFeedback = useDailyStore((state) => state.clearFeedback);
  const { correct: playCorrect, wrong: playWrong } = useFeedback();
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceScore, setPracticeScore] = useState(0);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [practiceDeadline, setPracticeDeadline] = useState(() => Date.now() + 10_000);
  const [practiceFeedback, setPracticeFeedback] = useState<LocalFeedback | null>(null);
  useDailyStateLifecycle({ categoryId, enabled: hydrated && !isPractice, profile });

  const categorySnapshot = snapshot?.categoryId === categoryId ? snapshot : null;
  const categoryFeedback = activeCategoryId === categoryId ? rankedFeedback : null;
  const practiceRounds = useMemo(() => categorySnapshot?.practiceRounds ?? [], [categorySnapshot?.practiceRounds]);
  const rankedRound = categoryFeedback?.round ?? categorySnapshot?.currentRound ?? null;
  const round = isPractice ? (practiceFeedback?.round ?? practiceRounds[practiceIndex] ?? null) : rankedRound;
  const feedback = isPractice ? practiceFeedback : categoryFeedback;
  const score = isPractice ? practiceScore : (categorySnapshot?.score ?? 0);
  const questionIndex = isPractice ? practiceIndex : (feedback?.round.index ?? categorySnapshot?.questionIndex ?? 0);
  const rankedDeadline = useMemo(
    () => categorySnapshot?.serverNow && categorySnapshot.questionDeadlineAt
      ? localDeadline(categorySnapshot.serverNow, categorySnapshot.questionDeadlineAt)
      : null,
    [categorySnapshot],
  );
  const deadline = isPractice ? practiceDeadline : rankedDeadline;
  const correctChoiceId = feedback?.correctChoiceId ?? (isPractice ? round?.correctChoiceId : null);
  const correctName = feedback?.correctLabel ?? round?.options.find((option) => option.id === correctChoiceId)?.label;
  const assetSource = useMemo<ImageSource | number | undefined>(() => {
    if (!round) return undefined;
    const assetPath = feedback?.revealAssetPath ?? (feedback ? round.revealAssetPath : null) ?? round.assetPath;
    const remoteUrl = assetPath ? getQuizAssetUrl(assetPath) : null;
    return remoteUrl ? { uri: remoteUrl } : flagAssets[round.assetKey];
  }, [feedback, round]);

  useEffect(() => {
    if (!hydrated || (!categorySnapshot && (status === 'idle' || status === 'loading'))) return;
    if (isPractice && categorySnapshot && practiceRounds.length === 0) router.replace({ pathname: '/daily-results', params: { category: categoryId } });
    if (!isPractice && !categorySnapshot) router.replace({ pathname: '/daily-intro', params: { category: categoryId } });
  }, [categoryId, categorySnapshot, hydrated, isPractice, practiceRounds.length, status]);

  useEffect(() => {
    if (!feedback) return;
    if (feedback.isCorrect) playCorrect(); else playWrong();
    const timer = setTimeout(() => {
      if (isPractice) {
        setPracticeFeedback(null);
        if (practiceIndex >= 9) {
          router.replace({ pathname: '/daily-results', params: { category: categoryId, practice: '1', score: String(practiceScore), correct: String(practiceCorrect) } });
        } else {
          setPracticeIndex((value) => value + 1);
          setPracticeDeadline(Date.now() + 10_000);
        }
      } else {
        clearFeedback();
        if (categorySnapshot?.state === 'completed' || categorySnapshot?.state === 'expired') router.replace({ pathname: '/daily-results', params: { category: categoryId } });
      }
    }, 750);
    return () => clearTimeout(timer);
  }, [categoryId, categorySnapshot?.state, clearFeedback, feedback, isPractice, playCorrect, playWrong, practiceCorrect, practiceIndex, practiceScore]);

  const answerPractice = useCallback((choiceId: string | null) => {
    const current = practiceRounds[practiceIndex];
    if (!current || practiceFeedback) return;
    const isCorrect = Boolean(choiceId && choiceId === current.correctChoiceId);
    if (isCorrect) { setPracticeScore((value) => value + 100); setPracticeCorrect((value) => value + 1); }
    const correctLabel = current.options.find((option) => option.id === current.correctChoiceId)?.label ?? null;
    setPracticeFeedback({ round: current, choiceId, correctChoiceId: current.correctChoiceId ?? null, correctLabel, isCorrect, points: isCorrect ? 100 : 0, revealAssetPath: current.revealAssetPath ?? null });
  }, [practiceFeedback, practiceIndex, practiceRounds]);

  const timeout = useCallback(() => {
    if (feedback || status === 'loading') return;
    if (isPractice) answerPractice(null); else void submit(null);
  }, [answerPractice, feedback, isPractice, status, submit]);
  const timer = useGameTimer(deadline, null, Boolean(round) && !feedback, timeout);
  const choose = (choiceId: string) => {
    if (feedback || status === 'loading') return;
    if (isPractice) answerPractice(choiceId); else void submit(choiceId);
  };

  if (!round && (status === 'error' || status === 'unconfigured')) return <View style={styles.loading}><Text accessibilityRole="alert" style={styles.loadErrorTitle}>Ranked challenge unavailable</Text><Text style={styles.loadErrorBody}>{message ?? 'Check your connection and try again.'}</Text><Pressable accessibilityRole="button" onPress={() => void load(backendProfileFromLocal(profile), categoryId)} style={styles.loadAction}><Text style={styles.loadActionText}>Retry</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.loadAction}><Text style={styles.loadActionText}>Back</Text></Pressable></View>;
  if (!round) return <View style={styles.loading}><ActivityIndicator color={colors.sky} size="large" /><Text style={styles.loadingText}>Loading ranked challenge…</Text></View>;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Leave daily challenge" onPress={() => router.replace('/')} style={styles.exit}><Text style={styles.exitText}>×</Text></Pressable>
          <View style={[styles.mode, isPractice && styles.practiceMode]}><Text style={styles.modeText}>{isPractice ? 'PRACTICE' : 'RANKED'}</Text></View>
          <View style={styles.counter}><Text style={styles.counterText}>{questionIndex + 1} / 10</Text></View>
          <View style={styles.scoreBox}><Text style={styles.scoreLabel}>SCORE</Text><Text style={styles.score}>{score}</Text></View>
        </View>
        <View style={styles.timerRow}><Text style={styles.timerHint}>{isPractice ? 'Practice timer' : 'Server-timed question'}</Text><Text style={styles.timerNumber}>{Math.ceil(timer.remainingMs / 1000)}s</Text></View>
        <View style={styles.timerTrack}><View style={[styles.timerFill, { width: `${timer.progress * 100}%`, backgroundColor: timer.progress < 0.3 ? colors.coral : colors.yellow }]} /></View>
        <View style={styles.content}>
          <Text style={styles.prompt}>{copy.prompt}</Text>
          <View style={[styles.flagCard, styles.flagStage, shadow.card]}>
            {assetSource ? <Image accessibilityLabel={feedback && correctName ? `${correctName} identity artwork` : `${copy.label} question symbol ${questionIndex + 1}`} cachePolicy="memory-disk" contentFit="contain" source={assetSource} style={styles.flag} /> : <Text style={styles.assetError}>Image unavailable</Text>}
            {feedback ? <View style={[styles.feedbackBadge, feedback.isCorrect ? styles.correctBadge : styles.wrongBadge]}><Text style={styles.feedbackText}>{feedback.isCorrect ? '✓  +100' : '0 POINTS'}</Text></View> : null}
          </View>
          <View style={styles.answers}>{round.options.map((option, index) => {
            const selected = feedback?.choiceId === option.id;
            const correct = Boolean(feedback && option.id === correctChoiceId);
            return <Pressable accessibilityRole="button" disabled={Boolean(feedback) || status === 'loading'} key={option.id} onPress={() => choose(option.id)} style={[styles.answer, { borderBottomColor: optionEdges[index] }, correct && styles.correctAnswer, selected && !correct && styles.wrongAnswer, feedback && !correct && !selected && styles.dimAnswer]}><Text style={styles.answerText}>{option.label}</Text>{correct ? <Text style={styles.mark}>✓</Text> : selected && feedback ? <Text style={[styles.mark, styles.wrongMark]}>×</Text> : null}</Pressable>;
          })}</View>
          {feedback && !feedback.isCorrect ? <Text style={styles.reveal}>Correct answer: <Text style={styles.revealStrong}>{correctName}</Text></Text> : <Text style={styles.note}>{isPractice ? 'Practice never changes your ranked result' : 'This timer continues in the background'}</Text>}
          {status === 'error' ? <Pressable onPress={() => void load(backendProfileFromLocal(profile), categoryId)} style={styles.retry}><Text style={styles.retryText}>Connection lost • Tap to resume from server</Text></Pressable> : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm }, exit: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, exitText: { ...type.display, color: colors.inkSoft, fontSize: 30 },
  mode: { borderRadius: radius.round, backgroundColor: colors.coral, paddingHorizontal: spacing.md, paddingVertical: 6 }, practiceMode: { backgroundColor: colors.lilac }, modeText: { ...type.heading, color: colors.white, fontSize: 9, letterSpacing: 0.7 }, counter: { borderRadius: radius.round, backgroundColor: colors.skyPale, paddingHorizontal: spacing.md, paddingVertical: 7 }, counterText: { ...type.heading, color: colors.skyDark, fontSize: 11 }, scoreBox: { marginLeft: 'auto', alignItems: 'flex-end' }, scoreLabel: { ...type.heading, color: colors.inkSoft, fontSize: 8 }, score: { ...type.display, fontSize: 22 },
  timerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginTop: spacing.md }, timerHint: { ...type.regular, color: colors.inkSoft, fontSize: 10 }, timerNumber: { ...type.display, fontSize: 18 }, timerTrack: { height: 9, marginHorizontal: spacing.lg, marginTop: 5, backgroundColor: colors.border, borderRadius: radius.round, overflow: 'hidden' }, timerFill: { height: '100%', borderRadius: radius.round },
  content: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: spacing.lg, justifyContent: 'center' }, prompt: { ...type.display, textAlign: 'center', fontSize: 21, marginBottom: spacing.md }, flagCard: { height: 205, borderRadius: radius.xl, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }, flagStage: { backgroundColor: colors.flagStage, borderColor: colors.flagStageBorder }, flag: { width: '100%', height: '100%' },
  assetError: { ...type.heading, color: colors.inkSoft, fontSize: 13 },
  loadingText: { ...type.regular, color: colors.inkSoft, fontSize: 12, marginTop: spacing.md }, loadErrorTitle: { ...type.heading, color: colors.coralDark, fontSize: 18 }, loadErrorBody: { ...type.regular, color: colors.inkSoft, fontSize: 12, textAlign: 'center', marginTop: spacing.sm, maxWidth: 320 }, loadAction: { minWidth: 160, minHeight: 48, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md }, loadActionText: { ...type.heading, color: colors.skyDark, fontSize: 13 },
  feedbackBadge: { position: 'absolute', bottom: -14, borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: 7, borderWidth: 3, borderColor: colors.white }, correctBadge: { backgroundColor: colors.mintDark }, wrongBadge: { backgroundColor: colors.coral }, feedbackText: { ...type.heading, color: colors.white, fontSize: 12 },
  answers: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xxl }, answer: { width: '48%', minHeight: 80, borderRadius: radius.lg, borderWidth: 2, borderBottomWidth: 6, borderColor: colors.border, backgroundColor: colors.white, padding: spacing.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm }, answerText: { ...type.heading, fontSize: 14, textAlign: 'center', flexShrink: 1 }, correctAnswer: { backgroundColor: colors.successPale, borderColor: colors.mintDark, borderBottomColor: colors.mintDark }, wrongAnswer: { backgroundColor: colors.dangerPale, borderColor: colors.coral, borderBottomColor: colors.coral }, dimAnswer: { opacity: 0.45 }, mark: { ...type.display, color: colors.mintDark }, wrongMark: { color: colors.coral },
  note: { ...type.regular, color: colors.inkSoft, fontSize: 10, textAlign: 'center', marginTop: spacing.lg }, reveal: { ...type.regular, color: colors.inkSoft, fontSize: 12, textAlign: 'center', marginTop: spacing.lg }, revealStrong: { ...type.heading, color: colors.ink }, retry: { marginTop: spacing.md, borderRadius: radius.sm, padding: spacing.sm, backgroundColor: colors.dangerPale }, retryText: { ...type.heading, color: colors.coralDark, fontSize: 11, textAlign: 'center' },
});
