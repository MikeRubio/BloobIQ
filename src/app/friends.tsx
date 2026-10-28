import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleBackground } from '@/components/bubble-background';
import { GameButton } from '@/components/game-button';
import { ScreenHeader } from '@/components/screen-header';
import type { QuizCategoryId } from '@/backend/types';
import { useFriendsStore } from '@/store/friends-store';
import { useProfileStore } from '@/store/profile-store';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

export default function FriendsScreen() {
  const profile = useProfileStore((state) => state.profile);
  const { createRoom, joinRoom, resumeRoom, loading, message, clearMessage } = useFriendsStore();
  const [category, setCategory] = useState<QuizCategoryId>('flags');
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(true);
  const payload = useMemo(() => ({ name: profile.name, avatar: profile.avatar, color: profile.color }), [profile.avatar, profile.color, profile.name]);

  useEffect(() => {
    let active = true;
    void resumeRoom(payload).then((roomId) => {
      if (active && roomId) router.replace({ pathname: '/friend-room', params: { roomId } });
      else if (active) setChecking(false);
    });
    return () => { active = false; clearMessage(); };
  }, [clearMessage, payload, resumeRoom]);

  const create = async () => {
    const next = await createRoom(payload, category);
    if (next) router.replace({ pathname: '/friend-room', params: { roomId: next.roomId } });
  };
  const join = async () => {
    const next = await joinRoom(payload, code);
    if (next) router.replace({ pathname: '/friend-room', params: { roomId: next.roomId } });
  };

  return <View style={styles.root}><BubbleBackground /><SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Play with Friends" subtitle="Private live quiz rooms" />
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.kicker}>CREATE A ROOM</Text><Text style={styles.title}>Choose the quiz</Text>
          <View style={styles.categories}>{(['flags', 'football'] as const).map((id) => <Pressable accessibilityRole="button" key={id} onPress={() => setCategory(id)} style={[styles.category, category === id && styles.categoryActive]}>
            <Text style={styles.categoryIcon}>{id === 'flags' ? '🌍' : '⚽'}</Text><Text style={styles.categoryText}>{id === 'flags' ? 'Flags' : 'Football'}</Text><Text style={styles.check}>{category === id ? '✓' : ''}</Text>
          </Pressable>)}</View>
          <GameButton disabled={loading || checking} label={checking ? 'Checking for a room…' : 'Create private room'} onPress={create} variant="sky" />
        </View>
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.kicker}>JOIN A ROOM</Text><Text style={styles.title}>Enter the six-character code</Text>
          <TextInput accessibilityLabel="Room code" autoCapitalize="characters" autoCorrect={false} maxLength={6} onChangeText={(value) => setCode(value.toUpperCase().replace(/[^A-HJ-KM-NP-Z2-9]/g, ''))} placeholder="ABC234" placeholderTextColor={colors.inkSoft} style={styles.input} value={code} />
          <GameButton disabled={loading || code.length !== 6} label="Join room" onPress={join} variant="mint" />
        </View>
        {message ? <Text accessibilityRole="alert" style={styles.error}>{message}</Text> : null}
        <Text style={styles.note}>2–8 players · 10 live questions · no account required</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1 }, content: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 2, borderColor: colors.border, padding: spacing.xl, marginTop: spacing.lg, gap: spacing.md },
  kicker: { ...type.heading, color: colors.skyDark, fontSize: 11, letterSpacing: 1 }, title: { ...type.display, fontSize: 22 }, categories: { gap: spacing.sm },
  category: { minHeight: 58, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.md }, categoryActive: { borderColor: colors.sky, backgroundColor: colors.skyPale },
  categoryIcon: { fontSize: 23 }, categoryText: { ...type.heading, fontSize: 16, flex: 1 }, check: { ...type.display, color: colors.sky, fontSize: 20 },
  input: { ...type.display, fontSize: 28, letterSpacing: 7, textAlign: 'center', color: colors.ink, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, minHeight: 64, paddingHorizontal: spacing.lg },
  error: { ...type.body, color: colors.coralDark, backgroundColor: colors.dangerPale, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.lg, textAlign: 'center' }, note: { ...type.regular, color: colors.inkSoft, fontSize: 12, textAlign: 'center', marginTop: spacing.xl },
});
