import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameButton } from '@/components/game-button';
import { flagAssets } from '@/content/flag-assets';
import { getQuiz, quizPath } from '@/content/quiz-catalog';
import { quizCategoryCopy } from '@/backend/categories';
import { useFeedback } from '@/hooks/use-feedback';
import { useGameTimer } from '@/hooks/use-game-timer';
import { runRewardedAd, SimulatedRewardedAdService, type RewardedAdEvent } from '@/services/rewarded-ad';
import { useGameStore } from '@/store/game-store';
import { useProfileStore } from '@/store/profile-store';
import { colors, motion, radius, shadow, spacing, type } from '@/theme/tokens';

const answerColors = [colors.sky, colors.coral, colors.mintDark, colors.lilac];

export default function GameScreen() {
  const phase = useGameStore((state) => state.phase);
  const categoryId = useGameStore((state) => state.categoryId);
  const questions = useGameStore((state) => state.questions);
  const rounds = useGameStore((state) => state.rounds);
  const currentIndex = useGameStore((state) => state.currentIndex);
  const hearts = useGameStore((state) => state.hearts);
  const score = useGameStore((state) => state.score);
  const streak = useGameStore((state) => state.streak);
  const feedback = useGameStore((state) => state.feedback);
  const selectedOptionId = useGameStore((state) => state.selectedOptionId);
  const deadlineAt = useGameStore((state) => state.deadlineAt);
  const pausedRemainingMs = useGameStore((state) => state.pausedRemainingMs);
  const answer = useGameStore((state) => state.answer);
  const advance = useGameStore((state) => state.advance);
  const questionReady = useGameStore((state) => state.questionReady);
  const reset = useGameStore((state) => state.reset);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const loadedQuestionId = useRef<string | null>(null);
  const [imageState, setImageState] = useState({ questionId: '', failed: false, retry: 0 });
  const [simulatedOutcome, setSimulatedOutcome] = useState<RewardedAdEvent>('earned');
  const forceReduced = useProfileStore((state) => state.settings.reducedMotion);
  const systemReduced = useReducedMotion();
  const reduced = forceReduced || systemReduced;
  const { correct: playCorrect, wrong: playWrong } = useFeedback();
  const cardX = useSharedValue(0);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    if (phase === 'idle') router.replace(quizPath(getQuiz(categoryId).id));
  }, [categoryId, phase]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setAppActive(true);
        const current = useGameStore.getState();
        if (current.phase === 'loading' && loadedQuestionId.current === current.rounds[current.currentIndex]?.questionId) current.questionReady();
        else current.resume();
      } else {
        setAppActive(false);
        useGameStore.getState().pause();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (phase !== 'feedback' || !appActive) return;
    const timer = setTimeout(() => advance(), motion.feedback);
    return () => clearTimeout(timer);
  }, [advance, appActive, feedback, phase]);

  useEffect(() => {
    if (phase === 'complete') router.replace('/results');
  }, [phase]);

  useEffect(() => {
    if (!feedback || reduced) return;
    if (feedback.kind === 'correct') {
      cardScale.value = withSequence(withTiming(1.04, { duration: 120 }), withSpring(1, motion.spring));
    } else {
      cardX.value = withSequence(withTiming(-10, { duration: 65 }), withTiming(10, { duration: 65 }), withTiming(-6, { duration: 65 }), withTiming(0, { duration: 65 }));
    }
  }, [cardScale, cardX, feedback, reduced]);

  const round = rounds[currentIndex];
  const question = round ? questions.find((item) => item.id === round.questionId) : undefined;
  const nextRound = rounds[currentIndex + 1];
  const nextQuestion = nextRound ? questions.find((item) => item.id === nextRound.questionId) : undefined;

  const imageFailed = imageState.questionId === question?.id && imageState.failed;
  const imageRetry = imageState.questionId === question?.id ? imageState.retry : 0;
  const imageLoaded = () => {
    if (!question) return;
    loadedQuestionId.current = question.id;
    setImageState((current) => ({ questionId: question.id, failed: false, retry: current.questionId === question.id ? current.retry : 0 }));
    if (appActive) questionReady();
    if (nextQuestion?.assetUri) void Image.prefetch(nextQuestion.assetUri, 'memory-disk').catch(() => undefined);
  };
  const handleTimeout = useCallback(() => {
    if (useGameStore.getState().phase !== 'answering') return;
    playWrong();
    answer(null);
  }, [answer, playWrong]);
  const { remainingMs, progress } = useGameTimer(deadlineAt, pausedRemainingMs, phase === 'answering' && appActive, handleTimeout);

  const choose = (optionId: string) => {
    if (phase !== 'answering' || !question) return;
    if (optionId === question.id) playCorrect(); else playWrong();
    answer(optionId);
  };

  const animatedCard = useAnimatedStyle(() => ({ transform: [{ translateX: cardX.value }, { scale: cardScale.value }] }));
  const quiz = getQuiz(categoryId);
  const exit = () => { reset(); router.replace(quizPath(quiz.id)); };

  if (!round || !question) return <View style={styles.loading}><ActivityIndicator color={colors.sky} size="large" /></View>;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Exit run" onPress={exit} style={styles.exit}><Text style={styles.exitText}>×</Text></Pressable>
          <View style={styles.questionPill}><Text style={styles.questionPillText}>{currentIndex + 1} / {rounds.length}</Text></View>
          <View style={styles.scoreBox}><Text style={styles.scoreLabel}>SCORE</Text><Text style={styles.score}>{score.toLocaleString()}</Text></View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}><Text style={styles.hearts}>{Array.from({ length: 3 }, (_, index) => index < hearts ? '♥' : '♡').join(' ')}</Text></View>
          <View style={styles.streakPill}><Text style={styles.streakIcon}>⚡</Text><Text style={styles.streakText}>{streak} streak</Text></View>
          <View style={styles.timerNumber}><Text style={styles.timerText}>{Math.ceil(remainingMs / 1000)}</Text><Text style={styles.timerUnit}>s</Text></View>
        </View>
        <View style={styles.timerTrack}><View style={[styles.timerFill, { width: `${progress * 100}%`, backgroundColor: progress < 0.3 ? colors.coral : colors.yellow }]} /></View>

        <ScrollView contentContainerStyle={styles.gameContent} scrollEnabled={false} style={styles.gameScroll}>
          <Text style={styles.prompt}>{quizCategoryCopy[quiz.id].prompt}</Text>
          <Animated.View style={[styles.flagCard, styles.flagStage, shadow.card, animatedCard]}>
            <Image
              accessibilityLabel={`${quiz.label} question artwork ${currentIndex + 1}`}
              cachePolicy="memory-disk"
              contentFit="contain"
              key={`${question.id}:${imageRetry}`}
              onError={() => setImageState((current) => ({ questionId: question.id, failed: true, retry: current.questionId === question.id ? current.retry : 0 }))}
              onLoad={imageLoaded}
              source={question.assetUri ? { uri: question.assetUri } : flagAssets[question.assetKey]}
              style={styles.flag}
            />
            {phase === 'loading' && !imageFailed ? <View style={styles.imageStatus}><ActivityIndicator color={colors.sky} /><Text style={styles.imageStatusText}>Preparing question…</Text></View> : null}
            {imageFailed ? <View style={styles.imageStatus}><Text style={styles.imageErrorTitle}>Image unavailable</Text><Text style={styles.imageStatusText}>No heart was used. Check your connection and retry.</Text><GameButton compact label="Retry image" onPress={() => setImageState((current) => ({ questionId: question.id, failed: false, retry: current.questionId === question.id ? current.retry + 1 : 1 }))} variant="ghost" /></View> : null}
            {feedback ? (
              <View style={[styles.feedbackBadge, feedback.kind === 'correct' ? styles.correctBadge : styles.wrongBadge]}>
                <Text style={styles.feedbackBadgeText}>{feedback.kind === 'correct' ? `✓  +${feedback.points}` : feedback.kind === 'timeout' ? 'TIME!' : 'NOT QUITE'}</Text>
              </View>
            ) : null}
          </Animated.View>

          <View style={styles.answerGrid}>
            {round.optionIds.map((optionId, index) => {
              const option = questions.find((item) => item.id === optionId);
              const isCorrect = optionId === question.id;
              const isSelected = selectedOptionId === optionId;
              const showingFeedback = phase === 'feedback';
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: phase !== 'answering', selected: isSelected }}
                  disabled={phase !== 'answering' || imageFailed}
                  key={optionId}
                  onPress={() => choose(optionId)}
                  style={[
                    styles.answer,
                    { borderBottomColor: answerColors[index] },
                    showingFeedback && isCorrect && styles.correctAnswer,
                    showingFeedback && isSelected && !isCorrect && styles.wrongAnswer,
                    showingFeedback && !isCorrect && !isSelected && styles.dimAnswer,
                  ]}
                >
                  <Text style={[styles.answerText, showingFeedback && isCorrect && styles.correctAnswerText]}>{option?.displayName}</Text>
                  {showingFeedback && isCorrect ? <Text style={styles.answerMark}>✓</Text> : null}
                  {showingFeedback && isSelected && !isCorrect ? <Text style={[styles.answerMark, styles.wrongMark]}>×</Text> : null}
                </Pressable>
              );
            })}
          </View>
          {feedback && feedback.kind !== 'correct' ? <Text style={styles.reveal}>Correct answer: <Text style={styles.revealStrong}>{question.displayName}</Text></Text> : <Text style={styles.hint}>Choose one answer before time runs out</Text>}
        </ScrollView>
      </SafeAreaView>
      <ReviveModal outcome={simulatedOutcome} setOutcome={setSimulatedOutcome} />
    </View>
  );
}

function ReviveModal({ outcome, setOutcome }: { outcome: RewardedAdEvent; setOutcome: (value: RewardedAdEvent) => void }) {
  const phase = useGameStore((state) => state.phase);
  const message = useGameStore((state) => state.adMessage);
  const startAd = useGameStore((state) => state.startAd);
  const adDidNotReward = useGameStore((state) => state.adDidNotReward);
  const finish = useGameStore((state) => state.finish);
  const { correct } = useFeedback();
  const visible = phase === 'revive-offer' || phase === 'ad-in-progress';
  const loading = phase === 'ad-in-progress';

  const watch = async () => {
    startAd();
    const service = new SimulatedRewardedAdService(outcome);
    const result = await runRewardedAd(service, () => useGameStore.getState().revive());
    if (result === 'earned') correct();
    if (result === 'cancelled') adDidNotReward('Simulator cancelled. No revive was granted—try again or finish.');
    if (result === 'failed') adDidNotReward('Simulator failed. No revive was granted—try again or finish.');
  };

  return (
    <Modal animationType="fade" onRequestClose={() => undefined} transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={[styles.reviveCard, shadow.card]}>
          <View style={styles.heartCircle}><Text style={styles.bigHeart}>♥</Text></View>
          <Text style={styles.reviveTitle}>One more chance?</Text>
          <Text style={styles.reviveBody}>Revive with one heart and continue on the next question.</Text>
          <View style={styles.simulatorBox}>
            <Text style={styles.simulatorTitle}>DEVELOPMENT AD SIMULATOR</Text>
            <Text style={styles.simulatorBody}>This is not a real advertisement. Pick a test outcome:</Text>
            <View style={styles.outcomeRow}>
              {(['earned', 'cancelled', 'failed'] as RewardedAdEvent[]).map((value) => (
                <Pressable disabled={loading} key={value} onPress={() => setOutcome(value)} style={[styles.outcomeChip, outcome === value && styles.outcomeChipActive]}>
                  <Text style={[styles.outcomeText, outcome === value && styles.outcomeTextActive]}>{value === 'earned' ? 'Success' : value === 'cancelled' ? 'Cancel' : 'Failure'}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          {message ? <Text style={styles.adMessage}>{message}</Text> : null}
          <GameButton disabled={loading} label={loading ? 'Simulating…' : 'Watch & Revive'} onPress={() => void watch()} variant="coral" icon={loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.videoIcon}>▶</Text>} />
          <Pressable disabled={loading} onPress={() => finish()} style={styles.finishLink}><Text style={styles.finishLinkText}>Finish Run</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', backgroundColor: colors.surface, alignItems: 'center' }, safe: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  exit: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, exitText: { ...type.display, fontSize: 30, lineHeight: 32, color: colors.inkSoft },
  questionPill: { marginLeft: spacing.md, backgroundColor: colors.skyPale, borderRadius: radius.round, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, questionPillText: { ...type.heading, color: colors.skyDark, fontSize: 12 },
  scoreBox: { marginLeft: 'auto', alignItems: 'flex-end' }, scoreLabel: { ...type.heading, color: colors.inkSoft, fontSize: 9, letterSpacing: 1 }, score: { ...type.display, fontSize: 23 },
  stats: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm }, statItem: { flex: 1 }, hearts: { ...type.heading, color: colors.coral, fontSize: 21, letterSpacing: 1 },
  streakPill: { flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: colors.surfaceWarm, borderRadius: radius.round, paddingHorizontal: spacing.md, paddingVertical: 6 }, streakIcon: { fontSize: 13 }, streakText: { ...type.heading, color: colors.yellowDark, fontSize: 12 },
  timerNumber: { width: 42, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'flex-end' }, timerText: { ...type.display, fontSize: 20 }, timerUnit: { ...type.heading, color: colors.inkSoft, fontSize: 10 },
  timerTrack: { height: 9, marginHorizontal: spacing.lg, marginTop: spacing.sm, backgroundColor: colors.border, borderRadius: radius.round, overflow: 'hidden' }, timerFill: { height: '100%', borderRadius: radius.round },
  gameScroll: { width: '100%' }, gameContent: { flexGrow: 1, alignSelf: 'center', width: '100%', maxWidth: 560, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: spacing.xl, justifyContent: 'center' }, prompt: { ...type.display, textAlign: 'center', fontSize: 21, marginBottom: spacing.md },
  flagCard: { height: 210, backgroundColor: colors.white, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, borderWidth: 2, borderColor: colors.border }, flagStage: { backgroundColor: colors.flagStage, borderColor: colors.flagStageBorder }, flag: { width: '100%', height: '100%' },
  imageStatus: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius.xl, backgroundColor: colors.flagStage, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm }, imageStatusText: { ...type.regular, color: colors.inkSoft, textAlign: 'center', fontSize: 12 }, imageErrorTitle: { ...type.heading, color: colors.coralDark, fontSize: 15 },
  feedbackBadge: { position: 'absolute', bottom: -15, borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: 7, borderWidth: 3, borderColor: colors.white }, correctBadge: { backgroundColor: colors.mintDark }, wrongBadge: { backgroundColor: colors.coral }, feedbackBadgeText: { ...type.heading, color: colors.white, fontSize: 13, letterSpacing: 0.5 },
  answerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.xxl },
  answer: { width: '48%', minWidth: 0, minHeight: 82, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, borderBottomWidth: 6, backgroundColor: colors.white, padding: spacing.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm },
  answerText: { ...type.heading, fontSize: 15, textAlign: 'center', flexShrink: 1 }, correctAnswer: { backgroundColor: colors.successPale, borderColor: colors.mintDark, borderBottomColor: colors.mintDark }, wrongAnswer: { backgroundColor: colors.dangerPale, borderColor: colors.coral, borderBottomColor: colors.coral }, dimAnswer: { opacity: 0.45 }, correctAnswerText: { color: colors.mintDark }, answerMark: { ...type.display, color: colors.mintDark, fontSize: 19 }, wrongMark: { color: colors.coral },
  hint: { ...type.regular, color: colors.inkSoft, textAlign: 'center', fontSize: 11, marginTop: spacing.lg }, reveal: { ...type.regular, color: colors.inkSoft, textAlign: 'center', fontSize: 13, marginTop: spacing.lg }, revealStrong: { ...type.heading, color: colors.ink },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, padding: spacing.lg, alignItems: 'center', justifyContent: 'center' }, reviveCard: { width: '100%', maxWidth: 440, borderRadius: radius.xl, backgroundColor: colors.white, padding: spacing.xl, alignItems: 'stretch' },
  heartCircle: { width: 74, height: 74, borderRadius: 37, backgroundColor: colors.dangerPale, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: -60, borderWidth: 5, borderColor: colors.white }, bigHeart: { color: colors.coral, fontSize: 38 }, reviveTitle: { ...type.display, textAlign: 'center', fontSize: 25, marginTop: spacing.md }, reviveBody: { ...type.regular, color: colors.inkSoft, textAlign: 'center', fontSize: 13, lineHeight: 18, marginTop: spacing.xs, marginBottom: spacing.lg },
  simulatorBox: { backgroundColor: colors.skyPale, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }, simulatorTitle: { ...type.heading, color: colors.skyDark, fontSize: 10, letterSpacing: 0.7 }, simulatorBody: { ...type.regular, color: colors.inkSoft, fontSize: 11, marginTop: 2 }, outcomeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }, outcomeChip: { flex: 1, minHeight: 38, borderRadius: radius.sm, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, outcomeChipActive: { backgroundColor: colors.sky, borderColor: colors.skyDark }, outcomeText: { ...type.heading, color: colors.inkSoft, fontSize: 11 }, outcomeTextActive: { color: colors.white },
  adMessage: { ...type.regular, color: colors.coralDark, backgroundColor: colors.dangerPale, borderRadius: radius.sm, padding: spacing.sm, fontSize: 11, textAlign: 'center', marginBottom: spacing.md }, videoIcon: { color: colors.white, fontSize: 15 }, finishLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm }, finishLinkText: { ...type.heading, color: colors.inkSoft, fontSize: 14, textDecorationLine: 'underline' },
});
