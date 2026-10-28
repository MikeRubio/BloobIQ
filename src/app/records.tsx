import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleBackground } from '@/components/bubble-background';
import { PlayerChip } from '@/components/player-chip';
import { ScreenHeader } from '@/components/screen-header';
import { useProfileStore } from '@/store/profile-store';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

export default function RecordsScreen() {
  const record = useProfileStore((state) => state.records.flags);
  const stats = [
    { label: 'Best score', value: (record?.highScore ?? 0).toLocaleString(), color: colors.sky },
    { label: 'Best streak', value: `${record?.bestStreak ?? 0}`, color: colors.coral },
    { label: 'Correct flags', value: `${record?.totalCorrect ?? 0}`, color: colors.mintDark },
    { label: 'Runs played', value: `${record?.gamesPlayed ?? 0}`, color: colors.lilacDark },
  ];
  return (
    <View style={styles.root}>
      <BubbleBackground />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Personal records" subtitle="Stored on this device" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.profileCard, shadow.card]}><PlayerChip /></View>
          <View style={styles.titleRow}><Text style={styles.flagIcon}>🌍</Text><View><Text style={styles.title}>Flags</Text><Text style={styles.subtitle}>Casual mode</Text></View></View>
          <View style={styles.grid}>{stats.map((stat) => <View key={stat.label} style={[styles.stat, shadow.card]}><View style={[styles.dot, { backgroundColor: stat.color }]} /><Text style={styles.value}>{stat.value}</Text><Text style={styles.label}>{stat.label}</Text></View>)}</View>
          {!record ? <Text style={styles.empty}>Play your first Flags run to start filling this page.</Text> : null}
          <View style={styles.rankingNote}><Text style={styles.rankingTitle}>Casual records stay separate</Text><Text style={styles.rankingBody}>This screen shows only your local casual results. Ranked Daily scores appear on the real Flags leaderboard.</Text></View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1, paddingHorizontal: spacing.lg }, content: { paddingBottom: spacing.xxl },
  profileCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginVertical: spacing.lg }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }, flagIcon: { fontSize: 32 }, title: { ...type.display, fontSize: 22 }, subtitle: { ...type.regular, color: colors.inkSoft, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, stat: { width: '48%', minHeight: 130, borderRadius: radius.lg, backgroundColor: colors.white, padding: spacing.lg, justifyContent: 'center' }, dot: { width: 11, height: 11, borderRadius: 6, marginBottom: spacing.sm }, value: { ...type.display, fontSize: 28 }, label: { ...type.regular, color: colors.inkSoft, fontSize: 12, marginTop: 2 },
  empty: { ...type.regular, textAlign: 'center', color: colors.inkSoft, fontSize: 13, marginTop: spacing.xl }, rankingNote: { borderRadius: radius.lg, backgroundColor: colors.surfaceWarm, borderWidth: 2, borderColor: '#F5E4AE', padding: spacing.lg, marginTop: spacing.xl }, rankingTitle: { ...type.heading, fontSize: 15 }, rankingBody: { ...type.regular, color: colors.inkSoft, fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
});
