import { BubbleBackground } from "@/components/bubble-background";
import { DailyHomeCard } from "@/components/daily-home-card";
import { GameButton } from "@/components/game-button";
import {
  browseGroups,
  browsePath,
  quickPlayQuiz,
} from "@/content/quiz-catalog";
import { useGameStore } from "@/store/game-store";
import { useProfileStore } from "@/store/profile-store";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const activeGroups = browseGroups.filter((group) => group.available);
const futureGroups = browseGroups.filter((group) => !group.available);
const groupColors = {
  sky: colors.sky,
  mint: colors.mint,
  coral: colors.coral,
  lilac: colors.lilac,
} as const;

export default function HomeScreen() {
  const records = useProfileStore((state) => state.records);
  const lastPlayed = useProfileStore((state) => state.lastPlayedCasualQuizId);
  const start = useGameStore((state) => state.start);
  const launching = useGameStore((state) => state.launching);
  const launchError = useGameStore((state) => state.launchError);
  const quickQuiz = quickPlayQuiz(lastPlayed);
  const bestScore = records[quickQuiz.id]?.highScore ?? 0;
  const quickPlay = async () => {
    if (await start(quickQuiz.id, undefined, Boolean(launchError))) router.push("/game");
  };

  return (
    <View style={styles.root}>
      <BubbleBackground />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerTop}>
            <View style={styles.brand}>
              <Text style={styles.brandText}>BLOOP</Text>
              <Text style={[styles.brandText, styles.brandAccent]}>IQ</Text>
              <View style={styles.brandDot} />
            </View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityLabel="Rankings"
                onPress={() => router.push("/rankings")}
                style={styles.headerButton}
              >
                <Text style={styles.headerEmoji}>🏆</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Personal records"
                onPress={() => router.push("/records")}
                style={styles.headerButton}
              >
                <Text style={styles.headerEmoji}>★</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Settings"
                onPress={() => router.push("/settings")}
                style={styles.headerButton}
              >
                <Text style={styles.headerEmoji}>⚙</Text>
              </Pressable>
            </View>
          </View>

          <DailyHomeCard />

          <View style={[styles.friendsCard, shadow.card]}>
            <View style={styles.friendsTop}>
              <View style={styles.friendsIcon}>
                <Text style={styles.friendsEmoji}>👥</Text>
              </View>
              <View style={styles.friendsCopy}>
                <Text style={styles.friendsKicker}>LIVE MULTIPLAYER</Text>
                <Text style={styles.friendsTitle}>Play with Friends</Text>
                <Text style={styles.friendsBody}>
                  Private rooms for 2–8 players.
                </Text>
              </View>
            </View>
            <View style={styles.friendActions}>
              <GameButton
                compact
                label="Create Room"
                onPress={() =>
                  router.push({
                    pathname: "/friends",
                    params: { action: "create" },
                  })
                }
                variant="mint"
                style={styles.flexButton}
              />
              <GameButton
                compact
                label="Join Room"
                onPress={() =>
                  router.push({
                    pathname: "/friends",
                    params: { action: "join" },
                  })
                }
                variant="ghost"
                style={styles.flexButton}
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore Categories</Text>
            <Text style={styles.sectionMeta}>What do you want to guess?</Text>
          </View>
          <View style={styles.activeGrid}>
            {activeGroups.map((group) => (
              <Pressable
                accessibilityRole="button"
                key={group.id}
                onPress={() => router.push(browsePath(group.id))}
                style={[
                  styles.groupCard,
                  shadow.card,
                  { borderColor: groupColors[group.color] },
                ]}
              >
                <View
                  style={[
                    styles.groupIcon,
                    { backgroundColor: groupColors[group.color] },
                  ]}
                >
                  <Text style={styles.groupEmoji}>{group.icon}</Text>
                </View>
                <Text style={styles.groupTitle}>{group.label}</Text>
                <Text style={styles.groupBody}>{group.description}</Text>
                <Text style={styles.groupAction}>
                  {group.quizIds.length} {group.quizIds.length === 1 ? "quiz" : "quizzes"} available ›
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.futureRow}>
            {futureGroups.map((group) => (
              <View key={group.id} style={styles.futureCard}>
                <View
                  style={[
                    styles.futureIcon,
                    { backgroundColor: groupColors[group.color] },
                  ]}
                >
                  <Text>{group.icon}</Text>
                </View>
                <View style={styles.futureCopy}>
                  <Text style={styles.futureTitle}>{group.label}</Text>
                  <Text style={styles.futureMeta}>COMING SOON</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Play</Text>
            <Text style={styles.sectionMeta}>Casual · {quickQuiz.bundledCount ? "offline" : "online"}</Text>
          </View>
          <View style={[styles.quickCard, shadow.card]}>
            <View style={styles.quickTop}>
              <View style={styles.quickIcon}>
                <Text style={styles.quickEmoji}>{quickQuiz.icon}</Text>
              </View>
              <View style={styles.quickCopy}>
                <Text style={styles.quickKicker}>
                  {quickQuiz.packLabel.toUpperCase()}
                </Text>
                <Text style={styles.quickTitle}>Play {quickQuiz.label}</Text>
                <Text style={styles.quickBody}>
                  {quickQuiz.bundledCount ? `${quickQuiz.bundledCount} bundled offline · ${quickQuiz.onlineCount} in the online catalogue` : `${quickQuiz.onlineCount} hosted identities · connection required`}
                </Text>
              </View>
            </View>
            <GameButton
              compact
              disabled={launching}
              label={launching ? "Loading pack…" : "Quick Play"}
              onPress={() => void quickPlay()}
              variant="yellow"
            />
            {launchError ? <Text accessibilityRole="alert" style={styles.quickError}>{launchError} Tap Quick Play to retry.</Text> : null}
            <Text style={styles.best}>
              Personal best · {bestScore.toLocaleString()} pts
            </Text>
          </View>
          <Text style={styles.footer}>
            Instant guest play · No account needed
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  safe: { flex: 1, width: "100%" },
  content: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 620,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  brand: { flexDirection: "row", alignItems: "center" },
  brandText: { ...type.display, fontSize: 24, letterSpacing: -1.5 },
  brandAccent: { color: colors.coral },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: colors.yellow,
    marginLeft: 2,
    marginTop: -14,
  },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerEmoji: { color: colors.ink, fontSize: 19 },
  playerRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tagline: {
    ...type.regular,
    color: colors.inkSoft,
    fontSize: 9,
    textAlign: "right",
    maxWidth: 96,
  },
  friendsCard: {
    backgroundColor: colors.skyPale,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.mint,
    gap: spacing.md,
  },
  friendsTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  friendsIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  friendsEmoji: { fontSize: 26 },
  friendsCopy: { flex: 1, minWidth: 0 },
  friendsKicker: {
    ...type.heading,
    color: colors.mintDark,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  friendsTitle: { ...type.display, fontSize: 20 },
  friendsBody: { ...type.regular, color: colors.inkSoft, fontSize: 11 },
  friendActions: { flexDirection: "row", gap: spacing.sm },
  flexButton: { flex: 1 },
  sectionHeader: { marginTop: spacing.sm },
  sectionTitle: { ...type.display, fontSize: 21 },
  sectionMeta: {
    ...type.regular,
    color: colors.inkSoft,
    fontSize: 10,
    marginTop: 1,
  },
  activeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  groupCard: {
    flexGrow: 1,
    flexBasis: 150,
    minHeight: 170,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing.lg,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  groupEmoji: { fontSize: 24 },
  groupTitle: { ...type.display, fontSize: 19, marginTop: spacing.md },
  groupBody: {
    ...type.regular,
    color: colors.inkSoft,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    flex: 1,
  },
  groupAction: {
    ...type.heading,
    color: colors.skyDark,
    fontSize: 10,
    marginTop: spacing.sm,
  },
  futureRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  futureCard: {
    flex: 1,
    minWidth: 130,
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  futureIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.72,
  },
  futureCopy: { flex: 1, minWidth: 0 },
  futureTitle: { ...type.heading, fontSize: 13 },
  futureMeta: {
    ...type.heading,
    color: colors.inkSoft,
    fontSize: 7,
    letterSpacing: 0.5,
  },
  quickCard: {
    backgroundColor: colors.sky,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  quickTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  quickIcon: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickEmoji: { fontSize: 28 },
  quickCopy: { flex: 1, minWidth: 0 },
  quickKicker: {
    ...type.heading,
    color: "#DDF4FF",
    fontSize: 8,
    letterSpacing: 0.7,
  },
  quickTitle: { ...type.display, color: colors.white, fontSize: 21 },
  quickBody: {
    ...type.regular,
    color: "#EAF8FF",
    fontSize: 10,
    lineHeight: 14,
  },
  best: {
    ...type.heading,
    color: colors.white,
    opacity: 0.9,
    textAlign: "center",
    fontSize: 11,
  },
  quickError: { ...type.regular, color: colors.white, backgroundColor: "rgba(100,20,20,.28)", borderRadius: radius.sm, padding: spacing.sm, textAlign: "center", fontSize: 11 },
  footer: {
    ...type.regular,
    color: colors.inkSoft,
    fontSize: 11,
    textAlign: "center",
  },
});
