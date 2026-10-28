import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { fetchLeaderboard } from '@/backend/daily-api';
import type { LeaderboardResponse, QuizCategoryId } from '@/backend/types';
import { BubbleBackground } from '@/components/bubble-background';
import { GameButton } from '@/components/game-button';
import { ScreenHeader } from '@/components/screen-header';
import { useProfileStore } from '@/store/profile-store';
import { backendProfileFromLocal } from '@/backend/profile-migration';
import { normalizeQuizCategory, quizCategoryCopy } from '@/backend/categories';
import { browseGroups, quizzes, quizzesForMode } from '@/content/quiz-catalog';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

const rankingQuizzes = quizzesForMode('daily');
const rankingGroups = browseGroups.filter((group) => rankingQuizzes.some((quiz) => quiz.groupId === group.id));

export default function RankingsScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const profile = useProfileStore((state) => state.profile);
  const hydrated = useProfileStore((state) => state.hydrated);
  const [period, setPeriod] = useState<'today' | 'week'>('today');
  const [categoryId, setCategoryId] = useState<QuizCategoryId>(() => normalizeQuizCategory(params.category));
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [message, setMessage] = useState('');
  const selectedQuiz = quizzes[categoryId];
  const visibleQuizzes = rankingQuizzes.filter((quiz) => quiz.groupId === selectedQuiz.groupId);
  const load = useCallback(async () => {
    setStatus('loading');
    try { setData(await fetchLeaderboard(backendProfileFromLocal(profile), period, categoryId)); setStatus('ready'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Rankings are unavailable.'); setStatus('error'); }
  }, [categoryId, period, profile]);
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [hydrated, load]);

  return (
    <View style={styles.root}>
      <BubbleBackground />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Rankings" subtitle="Real completed daily attempts" />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.selectorLabel}>BROWSE GROUP</Text>
          <View style={styles.categories}>{rankingGroups.map((group) => <Pressable key={group.id} onPress={() => { const first = rankingQuizzes.find((quiz) => quiz.groupId === group.id); if (first) setCategoryId(first.id); }} style={[styles.category, selectedQuiz.groupId === group.id && styles.categoryActive]}><Text style={styles.categoryIcon}>{group.icon}</Text><Text style={[styles.categoryText, selectedQuiz.groupId !== group.id && styles.categoryMuted]}>{group.label}</Text></Pressable>)}</View>
          <Text style={styles.selectorLabel}>QUIZ</Text>
          <View style={styles.quizSelector}>{visibleQuizzes.map((quiz) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: categoryId === quiz.id }} key={quiz.id} onPress={() => setCategoryId(quiz.id)} style={[styles.quizChoice, categoryId === quiz.id && styles.quizChoiceActive]}><Text style={styles.quizChoiceIcon}>{quiz.icon}</Text><Text style={styles.quizChoiceText}>{quiz.label}</Text></Pressable>)}</View>
          <View style={styles.quizScope}><Text style={styles.quizScopeLabel}>STANDINGS FOR</Text><Text style={styles.quizScopeTitle}>{selectedQuiz.label} · {selectedQuiz.packLabel}</Text><Text style={styles.quizScopeBody}>This leaderboard is scoped only to the {selectedQuiz.label} quiz.</Text></View>
          <View style={styles.tabs}>
            <Pressable onPress={() => setPeriod('today')} style={[styles.tab, period === 'today' && styles.tabActive]}><Text style={[styles.tabText, period === 'today' && styles.tabTextActive]}>Today</Text></Pressable>
            <Pressable onPress={() => setPeriod('week')} style={[styles.tab, period === 'week' && styles.tabActive]}><Text style={[styles.tabText, period === 'week' && styles.tabTextActive]}>This Week</Text></Pressable>
          </View>
          <Text style={styles.boundary}>{period === 'today' ? 'UTC day • completed attempts only' : 'Monday–Sunday UTC • daily scores summed'}</Text>

          {status === 'loading' ? <ActivityIndicator color={colors.sky} size="large" style={styles.state} /> : null}
          {status === 'error' ? <View style={styles.error}><Text style={styles.errorTitle}>Couldn’t load rankings</Text><Text style={styles.errorBody}>{message}</Text><GameButton compact label="Retry" onPress={() => void load()} variant="ghost" style={styles.retry} /></View> : null}
          {status === 'ready' && !data?.entries.length ? <View style={styles.empty}><Text style={styles.emptyIcon}>☆</Text><Text style={styles.emptyTitle}>No completed attempts yet</Text><Text style={styles.emptyBody}>Finish today’s {quizCategoryCopy[categoryId].label} challenge to put the first real score on the board.</Text></View> : null}
          {status === 'ready' && data?.entries.length ? <View style={[styles.board, shadow.card]}>{data.entries.map((entry, index) => (
            <View key={`${entry.position}-${entry.displayName}-${index}`} style={[styles.row, entry.isCurrentPlayer && styles.currentRow, index < data.entries.length - 1 && styles.rowDivider]}>
              <Text style={[styles.position, entry.position <= 3 && styles.topPosition]}>{entry.position}</Text>
              <View style={[styles.avatar, { backgroundColor: entry.avatarColor }]}><Text style={styles.avatarText}>{entry.avatar}</Text></View>
              <View style={styles.player}><Text numberOfLines={1} style={styles.name}>{entry.displayName}{entry.isCurrentPlayer ? '  •  YOU' : ''}</Text><Text style={styles.duration}>{(entry.durationMs / 1000).toFixed(1)}s server-measured active time</Text></View>
              <Text style={styles.points}>{entry.score.toLocaleString()}</Text>
            </View>
          ))}</View> : null}
          <View style={styles.note}><Text style={styles.noteTitle}>How ties work</Text><Text style={styles.noteBody}>Higher score ranks first, then lower server-measured answering duration. Equal score and duration share a rank. Network travel time is included, so this is consistent but cannot perfectly isolate reaction speed.</Text></View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1, paddingHorizontal: spacing.lg }, content: { width: '100%', maxWidth: 580, alignSelf: 'center', paddingBottom: spacing.xxl },
  selectorLabel: { ...type.heading, color: colors.inkSoft, fontSize: 8, letterSpacing: .8, marginTop: spacing.md }, categories: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }, category: { minHeight: 50, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: spacing.lg, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }, categoryActive: { borderColor: colors.sky, backgroundColor: colors.skyPale }, categoryIcon: { fontSize: 21 }, categoryText: { ...type.heading, color: colors.skyDark, fontSize: 14 }, categoryMuted: { color: colors.inkSoft }, quizScope: { borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, padding: spacing.md, marginTop: spacing.sm }, quizScopeLabel: { ...type.heading, color: colors.inkSoft, fontSize: 8, letterSpacing: .7 }, quizScopeTitle: { ...type.heading, fontSize: 14, marginTop: 2 }, quizScopeBody: { ...type.regular, color: colors.inkSoft, fontSize: 10 },
  quizSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }, quizChoice: { minHeight: 44, flexGrow: 1, flexBasis: '45%', borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }, quizChoiceActive: { borderColor: colors.sky, backgroundColor: colors.skyPale }, quizChoiceIcon: { fontSize: 18 }, quizChoiceText: { ...type.heading, fontSize: 11 },
  tabs: { flexDirection: 'row', borderRadius: radius.md, backgroundColor: colors.border, padding: 4, marginTop: spacing.lg }, tab: { flex: 1, minHeight: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' }, tabActive: { backgroundColor: colors.white }, tabText: { ...type.heading, color: colors.inkSoft, fontSize: 13 }, tabTextActive: { color: colors.ink }, boundary: { ...type.regular, color: colors.inkSoft, fontSize: 10, textAlign: 'center', marginTop: spacing.sm },
  state: { marginTop: 80 }, error: { marginTop: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.dangerPale, padding: spacing.xl, alignItems: 'center' }, errorTitle: { ...type.heading, color: colors.coralDark, fontSize: 17 }, errorBody: { ...type.regular, color: colors.inkSoft, textAlign: 'center', fontSize: 12, marginTop: spacing.xs }, retry: { marginTop: spacing.lg }, empty: { marginTop: spacing.xxl, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, padding: spacing.xxl, alignItems: 'center' }, emptyIcon: { color: colors.yellowDark, fontSize: 38 }, emptyTitle: { ...type.heading, fontSize: 17, marginTop: spacing.sm }, emptyBody: { ...type.regular, color: colors.inkSoft, textAlign: 'center', fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  board: { backgroundColor: colors.white, borderRadius: radius.lg, marginTop: spacing.lg, overflow: 'hidden' }, row: { minHeight: 74, paddingHorizontal: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, currentRow: { backgroundColor: colors.skyPale }, rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border }, position: { ...type.display, color: colors.inkSoft, fontSize: 17, width: 24, textAlign: 'center' }, topPosition: { color: colors.coral }, avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontSize: 22 }, player: { flex: 1, minWidth: 0 }, name: { ...type.heading, fontSize: 13 }, duration: { ...type.regular, color: colors.inkSoft, fontSize: 9, marginTop: 2 }, points: { ...type.display, color: colors.skyDark, fontSize: 17 },
  note: { marginTop: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceWarm, borderWidth: 2, borderColor: '#F5E4AE', padding: spacing.lg }, noteTitle: { ...type.heading, fontSize: 14 }, noteBody: { ...type.regular, color: colors.inkSoft, fontSize: 11, lineHeight: 16, marginTop: spacing.xs },
});
