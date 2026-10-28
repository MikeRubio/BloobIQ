import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleBackground } from '@/components/bubble-background';
import { GameButton } from '@/components/game-button';
import { useGameStore } from '@/store/game-store';
import { useProfileStore } from '@/store/profile-store';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

const confetti = Array.from({ length: 14 }, (_, index) => ({
  left: `${4 + ((index * 17) % 92)}%`, top: 20 + ((index * 37) % 140),
  color: [colors.coral, colors.yellow, colors.mint, colors.lilac, colors.sky][index % 5],
  rotate: `${index * 23}deg`,
}));

export default function ResultsScreen() {
  const result = useGameStore((state) => state.result);
  const start = useGameStore((state) => state.start);
  const reset = useGameStore((state) => state.reset);
  const forcedReduced = useProfileStore((state) => state.settings.reducedMotion);
  const systemReduced = useReducedMotion();
  const reduced = forcedReduced || systemReduced;

  useEffect(() => { if (!result) router.replace('/'); }, [result]);
  if (!result) return null;
  const accuracy = result.answeredQuestions === 0 ? 0 : Math.round((result.correctAnswers / result.answeredQuestions) * 100);
  const replay = () => { start(); router.replace('/game'); };
  const home = () => { reset(); router.replace('/'); };

  return (
    <View style={styles.root}>
      <BubbleBackground />
      {result.isNewPersonalBest ? <View pointerEvents="none" style={StyleSheet.absoluteFill}>{confetti.map((piece, index) => <Animated.View entering={reduced ? undefined : FadeInDown.delay(index * 45).springify()} key={index} style={[styles.confetti, { left: piece.left, top: piece.top, backgroundColor: piece.color, transform: [{ rotate: piece.rotate }] }]} />)}</View> : null}
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Animated.View entering={reduced ? undefined : FadeInDown.springify()} style={styles.trophy}><Text style={styles.trophyText}>{result.completedPack ? '🏆' : '🌟'}</Text></Animated.View>
          <Text style={styles.eyebrow}>{result.completedPack ? 'FLAG PACK COMPLETE!' : 'RUN COMPLETE'}</Text>
          <Text style={styles.title}>{result.completedPack ? 'World explorer!' : 'Great guessing!'}</Text>
          {result.isNewPersonalBest ? <View style={styles.newBest}><Text style={styles.newBestText}>✦  NEW PERSONAL BEST!  ✦</Text></View> : null}

          <View style={[styles.scoreCard, shadow.card]}>
            <Text style={styles.scoreLabel}>FINAL SCORE</Text><Text style={styles.score}>{result.score.toLocaleString()}</Text><Text style={styles.points}>POINTS</Text>
            <View style={styles.rule} />
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statValue}>{result.correctAnswers}/{result.answeredQuestions}</Text><Text style={styles.statLabel}>Correct</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.stat}><Text style={styles.statValue}>{accuracy}%</Text><Text style={styles.statLabel}>Accuracy</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.stat}><Text style={styles.statValue}>{result.bestStreak}</Text><Text style={styles.statLabel}>Best streak</Text></View>
            </View>
          </View>

          <View style={styles.bestRow}><Text style={styles.bestLabel}>Previous best</Text><Text style={styles.bestValue}>{result.previousBest.toLocaleString()} pts</Text></View>
          <View style={styles.actions}><GameButton label="Play Again" onPress={replay} variant="coral" icon={<Text style={styles.replayIcon}>↻</Text>} /><GameButton label="Back Home" onPress={home} variant="ghost" /></View>
          <Text style={styles.localNote}>Results saved to your local guest profile</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1 }, content: { flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center', justifyContent: 'center', padding: spacing.xl },
  confetti: { position: 'absolute', width: 9, height: 18, borderRadius: 3 }, trophy: { width: 92, height: 92, borderRadius: 46, backgroundColor: colors.surfaceWarm, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.yellow }, trophyText: { fontSize: 48 },
  eyebrow: { ...type.heading, color: colors.skyDark, textAlign: 'center', fontSize: 11, letterSpacing: 1.5, marginTop: spacing.lg }, title: { ...type.display, textAlign: 'center', fontSize: 31, marginTop: spacing.xs },
  newBest: { backgroundColor: colors.yellow, borderRadius: radius.round, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: 7, marginTop: spacing.md }, newBestText: { ...type.heading, fontSize: 11, color: colors.ink },
  scoreCard: { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', marginTop: spacing.xl, borderWidth: 2, borderColor: colors.border }, scoreLabel: { ...type.heading, color: colors.inkSoft, fontSize: 10, letterSpacing: 1.4 }, score: { ...type.display, color: colors.skyDark, fontSize: 48, lineHeight: 54 }, points: { ...type.heading, color: colors.inkSoft, fontSize: 10 }, rule: { height: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginVertical: spacing.lg },
  statsRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' }, stat: { flex: 1, alignItems: 'center' }, statValue: { ...type.display, fontSize: 20 }, statLabel: { ...type.regular, color: colors.inkSoft, fontSize: 10, marginTop: 2 }, statDivider: { width: 1, height: 38, backgroundColor: colors.border },
  bestRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, marginTop: spacing.md }, bestLabel: { ...type.regular, color: colors.inkSoft, fontSize: 12 }, bestValue: { ...type.heading, fontSize: 12 }, actions: { gap: spacing.md, marginTop: spacing.xl }, replayIcon: { color: colors.white, fontSize: 20 }, localNote: { ...type.regular, color: colors.inkSoft, textAlign: 'center', fontSize: 10, marginTop: spacing.lg },
});
