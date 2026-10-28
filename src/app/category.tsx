import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleBackground } from '@/components/bubble-background';
import { ScreenHeader } from '@/components/screen-header';
import { getBrowseGroup, quizPath, quizzesForGroup } from '@/content/quiz-catalog';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

const accentDark = { sky: colors.skyDark, mint: colors.mintDark, lilac: colors.lilacDark, orange: colors.orangeDark } as const;

export default function CategoryScreen() {
  const { group: groupParam } = useLocalSearchParams<{ group?: string }>();
  const group = getBrowseGroup(groupParam);
  if (!group?.available) return <View style={styles.root}><SafeAreaView style={styles.safe}><ScreenHeader title="Explore" /><Text style={styles.missing}>This category is not available yet.</Text></SafeAreaView></View>;
  const available = quizzesForGroup(group.id);
  return <View style={styles.root}><BubbleBackground /><SafeAreaView style={styles.safe}>
    <ScreenHeader title={group.label} subtitle="Explore quizzes" />
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.hero, shadow.card]}><Text style={styles.heroIcon}>{group.icon}</Text><View style={styles.heroCopy}><Text style={styles.heroTitle}>{group.label}</Text><Text style={styles.heroBody}>{group.description}</Text></View></View>
      <Text style={styles.sectionTitle}>Available now</Text>
      {available.map((quiz) => <Pressable accessibilityRole="button" key={quiz.id} onPress={() => router.push(quizPath(quiz.id))} style={[styles.quizCard, { borderColor: colors[quiz.accent] }, shadow.card]}><View style={[styles.quizIcon, { backgroundColor: `${colors[quiz.accent]}22` }]}><Text style={styles.quizEmoji}>{quiz.icon}</Text></View><View style={styles.quizCopy}><Text style={styles.quizLabel}>{quiz.label}</Text><Text style={[styles.packLabel, { color: accentDark[quiz.accent] }]}>{quiz.packLabel}</Text><Text style={styles.quizMeta}>{quiz.onlineCount} hosted identities · {quiz.supportedModes.length} modes</Text></View><Text style={[styles.arrow, { color: accentDark[quiz.accent] }]}>›</Text></Pressable>)}
      {group.futureItems.length ? <View style={styles.future}><Text style={styles.futureTitle}>More sports coming soon</Text><View style={styles.futureItems}>{group.futureItems.map((item) => <View key={item} style={styles.futurePill}><Text style={styles.futureText}>{item}</Text></View>)}</View><Text style={styles.futureBody}>These are previews only—no empty quiz screens or placeholder games.</Text></View> : null}
    </ScrollView>
  </SafeAreaView></View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1, paddingHorizontal: spacing.lg }, content: { width: '100%', maxWidth: 580, alignSelf: 'center', paddingBottom: spacing.xxl }, missing: { ...type.body, color: colors.inkSoft, textAlign: 'center', marginTop: spacing.xxl },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.mint, borderRadius: radius.xl, padding: spacing.xl, marginTop: spacing.md }, heroIcon: { fontSize: 46 }, heroCopy: { flex: 1 }, heroTitle: { ...type.display, fontSize: 27 }, heroBody: { ...type.regular, color: colors.ink, opacity: .72, fontSize: 12 }, sectionTitle: { ...type.display, fontSize: 20, marginTop: spacing.xl, marginBottom: spacing.md },
  quizCard: { minHeight: 108, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.mint, padding: spacing.lg }, quizIcon: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.skyPale, alignItems: 'center', justifyContent: 'center' }, quizEmoji: { fontSize: 29 }, quizCopy: { flex: 1, minWidth: 0 }, quizLabel: { ...type.display, fontSize: 19 }, packLabel: { ...type.heading, color: colors.mintDark, fontSize: 12 }, quizMeta: { ...type.regular, color: colors.inkSoft, fontSize: 10, marginTop: 3 }, arrow: { ...type.display, color: colors.mintDark, fontSize: 30 },
  future: { marginTop: spacing.xl, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, padding: spacing.lg }, futureTitle: { ...type.heading, fontSize: 15 }, futureItems: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }, futurePill: { borderRadius: radius.round, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, futureText: { ...type.heading, color: colors.inkSoft, fontSize: 10 }, futureBody: { ...type.regular, color: colors.inkSoft, fontSize: 10, lineHeight: 15, marginTop: spacing.md },
});
