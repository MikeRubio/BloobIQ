import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleBackground } from '@/components/bubble-background';
import { DailyHomeCard } from '@/components/daily-home-card';
import { GameButton } from '@/components/game-button';
import { PlayerChip } from '@/components/player-chip';
import { flagAssets } from '@/content/flag-assets';
import { useGameStore } from '@/store/game-store';
import { useProfileStore } from '@/store/profile-store';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

const categories = [
  { id: 'flags', label: 'Flags', icon: '🌍', color: colors.sky, playable: true },
  { id: 'brands', label: 'Brands', icon: '✦', color: colors.coral, playable: false },
  { id: 'football', label: 'Football', icon: '⚽', color: colors.mint, playable: true },
  { id: 'nfl', label: 'American football', icon: '🏈', color: colors.yellow, playable: false },
  { id: 'baseball', label: 'Baseball', icon: '⚾', color: colors.lilac, playable: false },
  { id: 'basketball', label: 'Basketball', icon: '🏀', color: '#FF9A62', playable: false },
  { id: 'hockey', label: 'Hockey', icon: '🏒', color: '#78C7E8', playable: false },
] as const;

export default function HomeScreen() {
  const bestScore = useProfileStore((state) => state.records.flags?.highScore ?? 0);
  const start = useGameStore((state) => state.start);
  const play = () => { start(); router.push('/game'); };
  const openCategory = (categoryId: (typeof categories)[number]['id']) => {
    if (categoryId === 'flags') play();
    else if (categoryId === 'football') router.push({ pathname: '/daily-intro', params: { category: 'football' } });
  };

  return (
    <View style={styles.root}>
      <BubbleBackground />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} style={styles.scroll}>
          <View style={styles.topRow}>
            <PlayerChip />
            <Pressable accessibilityLabel="Rankings" onPress={() => router.push('/rankings')} style={styles.rankingsButton}><Text style={styles.rankingsIcon}>🏆</Text><Text style={styles.rankingsText}>Rankings</Text></Pressable>
            <Pressable accessibilityLabel="Personal records" onPress={() => router.push('/records')} style={styles.iconButton}><Text style={styles.iconText}>★</Text></Pressable>
            <Pressable accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={styles.iconButton}><Text style={styles.gear}>⚙</Text></Pressable>
          </View>
          <View style={styles.brandRow}><Text style={styles.logo}>BLOOP</Text><Text style={[styles.logo, styles.logoAccent]}>IQ</Text><View style={styles.logoDot} /></View>
          <Text style={styles.tagline}>See it. Know it. Score it.</Text>

          <View style={[styles.hero, shadow.card]}>
            <View style={styles.heroCopy}>
              <View style={styles.pill}><Text style={styles.pillText}>48 FLAGS • OFFLINE</Text></View>
              <Text style={styles.heroTitle}>How well do you know the world?</Text>
              <Text style={styles.heroBody}>Race the clock, build a streak, and protect your hearts.</Text>
            </View>
            <View style={styles.flagStack}>
              <Image source={flagAssets.jp} resizeMode="contain" style={[styles.miniFlag, styles.flagOne]} />
              <Image source={flagAssets.br} resizeMode="contain" style={[styles.miniFlag, styles.flagTwo]} />
              <Image source={flagAssets.us} resizeMode="contain" style={[styles.miniFlag, styles.flagThree]} />
            </View>
            <GameButton label="Play Flags" onPress={play} variant="yellow" icon={<Text style={styles.playIcon}>▶</Text>} />
            <Text style={styles.best}>Personal best  •  {bestScore.toLocaleString()} pts</Text>
          </View>

          <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Pick a category</Text><Text style={styles.sectionMeta}>More coming soon</Text></View>
          <View style={styles.grid}>
            {categories.map((category) => (
              <Pressable accessibilityRole={category.playable ? 'button' : undefined} key={category.id} onPress={category.playable ? () => openCategory(category.id) : undefined} style={[styles.category, shadow.card, category.playable && styles.playableCategory, category.playable && { borderColor: category.color }]}>
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}><Text style={styles.categoryEmoji}>{category.icon}</Text></View>
                <View style={styles.categoryCopy}><Text numberOfLines={2} style={styles.categoryName}>{category.label}</Text><Text style={[styles.categoryStatus, category.playable && styles.ready]}>{category.id === 'football' ? 'DAILY NOW' : category.playable ? 'PLAY NOW' : 'COMING SOON'}</Text></View>
                {category.playable ? <Text style={styles.arrow}>›</Text> : null}
              </Pressable>
            ))}
          </View>

          <DailyHomeCard />
          <View style={[styles.friendsCard, shadow.card]}>
            <View style={styles.friendsIcon}><Text style={styles.friendsEmoji}>👥</Text></View>
            <View style={styles.friendsCopy}><Text style={styles.friendsTitle}>Play with Friends</Text><Text style={styles.friendsBody}>Create a private room for 2–8 players.</Text></View>
            <GameButton compact label="Play" onPress={() => router.push('/friends')} variant="mint" />
          </View>
          <Text style={styles.footer}>Instant guest play • No account needed</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%', backgroundColor: colors.surface, alignItems: 'center' }, safe: { flex: 1, width: '100%' }, scroll: { width: '100%' },
  content: { alignSelf: 'center', width: '100%', maxWidth: 620, paddingHorizontal: spacing.lg, paddingBottom: 40 },
  topRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  iconButton: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.yellowDark, fontSize: 22 }, gear: { color: colors.ink, fontSize: 23 },
  rankingsButton: { minWidth: 86, height: 46, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceWarm, borderWidth: 2, borderColor: '#F1D66A', flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center' }, rankingsIcon: { fontSize: 15 }, rankingsText: { ...type.heading, color: colors.ink, fontSize: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl },
  logo: { ...type.display, fontSize: 38, letterSpacing: -2 }, logoAccent: { color: colors.coral },
  logoDot: { width: 9, height: 9, borderRadius: 9, backgroundColor: colors.yellow, marginLeft: 3, marginTop: -22 },
  tagline: { ...type.regular, color: colors.inkSoft, textAlign: 'center', marginBottom: spacing.lg },
  hero: { backgroundColor: colors.sky, borderRadius: radius.xl, padding: spacing.xl, overflow: 'hidden', marginBottom: spacing.xxl, flexShrink: 1 },
  heroCopy: { maxWidth: '72%', zIndex: 2 }, pill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.22)', paddingVertical: 5, paddingHorizontal: 9, borderRadius: radius.round },
  pillText: { ...type.heading, color: colors.white, fontSize: 10, letterSpacing: 0.7 },
  heroTitle: { ...type.display, color: colors.white, fontSize: 27, lineHeight: 30, marginTop: spacing.md },
  heroBody: { ...type.regular, color: '#EAF8FF', fontSize: 14, lineHeight: 19, marginTop: spacing.sm, marginBottom: spacing.lg },
  flagStack: { position: 'absolute', right: -4, top: 12, width: 130, height: 145 },
  miniFlag: { position: 'absolute', width: 84, height: 58, borderRadius: 8, backgroundColor: colors.white, borderWidth: 4, borderColor: colors.white },
  flagOne: { right: 4, top: 2, transform: [{ rotate: '7deg' }] }, flagTwo: { right: 34, top: 45, transform: [{ rotate: '-6deg' }] }, flagThree: { right: -5, top: 88, transform: [{ rotate: '5deg' }] },
  playIcon: { color: colors.ink, fontSize: 16 }, best: { ...type.heading, color: colors.white, opacity: 0.9, textAlign: 'center', fontSize: 12, marginTop: spacing.md },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.md }, sectionTitle: { ...type.display, fontSize: 21 }, sectionMeta: { ...type.regular, fontSize: 11, color: colors.inkSoft },
  grid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  category: { width: '48%', minWidth: 0, minHeight: 94, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 2, borderColor: 'transparent' },
  playableCategory: { borderColor: colors.sky }, categoryIcon: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }, categoryEmoji: { fontSize: 24 }, categoryCopy: { flex: 1, minWidth: 0 },
  categoryName: { ...type.heading, fontSize: 14, lineHeight: 17 }, categoryStatus: { ...type.heading, color: colors.inkSoft, fontSize: 8, marginTop: 4, letterSpacing: 0.5 }, ready: { color: colors.skyDark }, arrow: { ...type.display, color: colors.sky, fontSize: 28 },
  footer: { ...type.regular, color: colors.inkSoft, fontSize: 11, textAlign: 'center', marginTop: spacing.xl },
  friendsCard: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.mint, borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.xl, gap: spacing.md },
  friendsIcon: { width: 50, height: 50, borderRadius: radius.md, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }, friendsEmoji: { fontSize: 25 },
  friendsCopy: { gap: 3 }, friendsTitle: { ...type.display, fontSize: 20 }, friendsBody: { ...type.regular, color: colors.inkSoft, fontSize: 12 },
});
