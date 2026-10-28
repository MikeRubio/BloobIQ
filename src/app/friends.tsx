import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleBackground } from '@/components/bubble-background';
import { GameButton } from '@/components/game-button';
import { ScreenHeader } from '@/components/screen-header';
import type { QuizCategoryId } from '@/backend/types';
import type { BrowseGroupId } from '@/content/quiz-catalog';
import { getQuiz, quizzesForMode } from '@/content/quiz-catalog';
import { useFriendsStore } from '@/store/friends-store';
import { useProfileStore } from '@/store/profile-store';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

const eligibleQuizzes = quizzesForMode('friends');

export default function FriendsScreen() {
  const params = useLocalSearchParams<{ action?: string; quiz?: string }>();
  const profile = useProfileStore((state) => state.profile);
  const { createRoom, joinRoom, resumeRoom, loading, message, clearMessage } = useFriendsStore();
  const initialQuiz = getQuiz(params.quiz);
  const [groupId, setGroupId] = useState<Extract<BrowseGroupId, 'flags' | 'sports'>>(initialQuiz.groupId);
  const [category, setCategory] = useState<QuizCategoryId>(initialQuiz.id);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(true);
  const payload = useMemo(() => ({ name: profile.name, avatar: profile.avatar, color: profile.color }), [profile.avatar, profile.color, profile.name]);
  const eligibleGroups = [...new Set(eligibleQuizzes.map((quiz) => quiz.groupId))];
  const groupQuizzes = eligibleQuizzes.filter((quiz) => quiz.groupId === groupId);
  const joiningFirst = params.action === 'join';

  useEffect(() => {
    let active = true;
    void resumeRoom(payload).then((roomId) => {
      if (active && roomId) router.replace({ pathname: '/friend-room', params: { roomId } });
      else if (active) setChecking(false);
    });
    return () => { active = false; clearMessage(); };
  }, [clearMessage, payload, resumeRoom]);

  const create = async () => { const next = await createRoom(payload, category); if (next) router.replace({ pathname: '/friend-room', params: { roomId: next.roomId } }); };
  const join = async () => { const next = await joinRoom(payload, code); if (next) router.replace({ pathname: '/friend-room', params: { roomId: next.roomId } }); };
  const chooseGroup = (nextGroup: Extract<BrowseGroupId, 'flags' | 'sports'>) => {
    setGroupId(nextGroup);
    const first = eligibleQuizzes.find((quiz) => quiz.groupId === nextGroup);
    if (first) setCategory(first.id);
  };

  const createCard = <View style={[styles.card, shadow.card]}>
    <Text style={styles.kicker}>CREATE A ROOM</Text><Text style={styles.title}>Choose a category</Text>
    <View style={styles.groupSelector}>{eligibleGroups.map((id) => <Pressable accessibilityRole="button" key={id} onPress={() => chooseGroup(id)} style={[styles.groupChoice, groupId === id && styles.groupChoiceActive]}><Text style={styles.groupChoiceIcon}>{id === 'flags' ? '🌍' : '⚽'}</Text><Text style={styles.groupChoiceText}>{id === 'flags' ? 'Flags' : 'Sports'}</Text></Pressable>)}</View>
    <Text style={styles.selectionLabel}>ELIGIBLE QUIZ</Text>
    <View style={styles.categories}>{groupQuizzes.map((quiz) => <Pressable accessibilityRole="button" key={quiz.id} onPress={() => setCategory(quiz.id)} style={[styles.category, category === quiz.id && styles.categoryActive]}><Text style={styles.categoryIcon}>{quiz.icon}</Text><View style={styles.quizCopy}><Text style={styles.categoryText}>{quiz.label}</Text><Text style={styles.quizPack}>{quiz.packLabel}</Text></View><Text style={styles.check}>{category === quiz.id ? '✓' : ''}</Text></Pressable>)}</View>
    <GameButton disabled={loading || checking} label={checking ? 'Checking for a room…' : 'Create private room'} onPress={create} variant="sky" />
  </View>;
  const joinCard = <View style={[styles.card, shadow.card]}>
    <Text style={styles.kicker}>JOIN A ROOM</Text><Text style={styles.title}>Enter the six-character code</Text><Text style={styles.joinHint}>The room chooses the quiz automatically.</Text>
    <TextInput accessibilityLabel="Room code" autoCapitalize="characters" autoCorrect={false} autoFocus={joiningFirst} maxLength={6} onChangeText={(value) => setCode(value.toUpperCase().replace(/[^A-HJ-KM-NP-Z2-9]/g, ''))} placeholder="ABC234" placeholderTextColor={colors.inkSoft} style={styles.input} value={code} />
    <GameButton disabled={loading || code.length !== 6} label="Join room" onPress={join} variant="mint" />
  </View>;

  return <View style={styles.root}><BubbleBackground /><SafeAreaView style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><ScreenHeader title="Play with Friends" subtitle="Private live quiz rooms" />
      {joiningFirst ? <>{joinCard}{createCard}</> : <>{createCard}{joinCard}</>}
      {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}<Text style={styles.note}>2–8 players · 10 live questions · no account required</Text>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1 }, content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 2, borderColor: colors.border, padding: spacing.xl, marginTop: spacing.lg, gap: spacing.md }, kicker: { ...type.heading, color: colors.skyDark, fontSize: 11, letterSpacing: 1 }, title: { ...type.display, fontSize: 22 },
  groupSelector: { flexDirection: 'row', gap: spacing.sm }, groupChoice: { flex: 1, minHeight: 52, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }, groupChoiceActive: { backgroundColor: colors.skyPale, borderColor: colors.sky }, groupChoiceIcon: { fontSize: 20 }, groupChoiceText: { ...type.heading, fontSize: 13 }, selectionLabel: { ...type.heading, color: colors.inkSoft, fontSize: 8, letterSpacing: .7, marginTop: spacing.xs },
  categories: { gap: spacing.sm }, category: { minHeight: 62, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.md }, categoryActive: { borderColor: colors.sky, backgroundColor: colors.skyPale }, categoryIcon: { fontSize: 23 }, quizCopy: { flex: 1, minWidth: 0 }, categoryText: { ...type.heading, fontSize: 16 }, quizPack: { ...type.regular, color: colors.inkSoft, fontSize: 10 }, check: { ...type.display, color: colors.sky, fontSize: 20 }, joinHint: { ...type.regular, color: colors.inkSoft, fontSize: 11 },
  input: { ...type.display, fontSize: 28, letterSpacing: 7, textAlign: 'center', color: colors.ink, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, minHeight: 64, paddingHorizontal: spacing.lg }, error: { ...type.body, color: colors.coralDark, backgroundColor: colors.dangerPale, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.lg, textAlign: 'center' }, note: { ...type.regular, color: colors.inkSoft, fontSize: 12, textAlign: 'center', marginTop: spacing.xl },
});
