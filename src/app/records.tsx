import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleBackground } from '@/components/bubble-background';
import { PlayerChip } from '@/components/player-chip';
import { ScreenHeader } from '@/components/screen-header';
import { useProfileStore } from '@/store/profile-store';
import { quizzesForMode } from '@/content/quiz-catalog';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

export default function RecordsScreen() {
  const records = useProfileStore((state) => state.records);
  const casualQuizzes = quizzesForMode('casual');
  return (
    <View style={styles.root}>
      <BubbleBackground />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Personal records" subtitle="Stored on this device" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.profileCard, shadow.card]}><PlayerChip /></View>
          {casualQuizzes.map((quiz) => <RecordSection icon={quiz.icon} key={quiz.id} label={quiz.label} record={records[quiz.id]} />)}
          <View style={styles.rankingNote}><Text style={styles.rankingTitle}>Casual records stay separate</Text><Text style={styles.rankingBody}>Every quiz keeps an independent local record. Ranked Daily scores appear only in that quiz’s leaderboard.</Text></View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function RecordSection({ icon, label, record }: { icon: string; label: string; record: { highScore: number; gamesPlayed: number; totalCorrect: number; bestStreak: number } | undefined }) {
  const stats = [
    { label: 'Best score', value: (record?.highScore ?? 0).toLocaleString(), color: colors.sky },
    { label: 'Best streak', value: `${record?.bestStreak ?? 0}`, color: colors.coral },
    { label: 'Correct answers', value: `${record?.totalCorrect ?? 0}`, color: colors.mintDark },
    { label: 'Runs played', value: `${record?.gamesPlayed ?? 0}`, color: colors.lilacDark },
  ];
  return <View style={styles.recordSection}><View style={styles.titleRow}><Text style={styles.flagIcon}>{icon}</Text><View><Text style={styles.title}>{label}</Text><Text style={styles.subtitle}>Casual mode</Text></View></View><View style={styles.grid}>{stats.map((stat) => <View key={stat.label} style={[styles.stat, shadow.card]}><View style={[styles.dot, { backgroundColor: stat.color }]} /><Text style={styles.value}>{stat.value}</Text><Text style={styles.label}>{stat.label}</Text></View>)}</View>{!record ? <Text style={styles.empty}>No {label} runs yet.</Text> : null}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1, paddingHorizontal: spacing.lg }, content: { paddingBottom: spacing.xxl },
  profileCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginVertical: spacing.lg }, recordSection: { marginBottom: spacing.xl }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }, flagIcon: { fontSize: 32 }, title: { ...type.display, fontSize: 22 }, subtitle: { ...type.regular, color: colors.inkSoft, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, stat: { width: '48%', minHeight: 130, borderRadius: radius.lg, backgroundColor: colors.white, padding: spacing.lg, justifyContent: 'center' }, dot: { width: 11, height: 11, borderRadius: 6, marginBottom: spacing.sm }, value: { ...type.display, fontSize: 28 }, label: { ...type.regular, color: colors.inkSoft, fontSize: 12, marginTop: 2 },
  empty: { ...type.regular, textAlign: 'center', color: colors.inkSoft, fontSize: 13, marginTop: spacing.xl }, rankingNote: { borderRadius: radius.lg, backgroundColor: colors.surfaceWarm, borderWidth: 2, borderColor: '#F5E4AE', padding: spacing.lg, marginTop: spacing.xl }, rankingTitle: { ...type.heading, fontSize: 15 }, rankingBody: { ...type.regular, color: colors.inkSoft, fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
});
