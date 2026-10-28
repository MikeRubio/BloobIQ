import { BubbleBackground } from "@/components/bubble-background";
import { GameButton } from "@/components/game-button";
import { ScreenHeader } from "@/components/screen-header";
import { getQuiz, supportsMode } from "@/content/quiz-catalog";
import { useGameStore } from "@/store/game-store";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuizScreen() {
  const { quiz: quizParam } = useLocalSearchParams<{ quiz?: string }>();
  const quiz = getQuiz(quizParam);
  const startCasual = useGameStore((state) => state.start);
  const launching = useGameStore((state) => state.launching);
  const launchError = useGameStore((state) => state.launchError);
  const playCasual = async (forceRefresh = false) => {
    if (await startCasual(quiz.id, undefined, forceRefresh)) router.push("/game");
  };
  return (
    <View style={styles.root}>
      <BubbleBackground />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader
          title={quiz.label}
          subtitle={quiz.groupId === "sports" ? `Sports › ${quiz.label}` : "Flags"}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.hero, { backgroundColor: colors[quiz.accent] }, shadow.card]}>
            <Text style={styles.heroIcon}>{quiz.icon}</Text>
            <Text style={styles.pack}>{quiz.packLabel}</Text>
            <Text style={styles.description}>{quiz.description}</Text>
            <View style={styles.counts}>
              <View style={styles.count}>
                <Text style={styles.countValue}>{quiz.onlineCount}</Text>
                <Text style={styles.countLabel}>ONLINE CATALOGUE</Text>
              </View>
              {quiz.bundledCount ? (
                <View style={styles.count}>
                  <Text style={styles.countValue}>{quiz.bundledCount}</Text>
                  <Text style={styles.countLabel}>BUNDLED OFFLINE</Text>
                </View>
              ) : null}
            </View>
          </View>
          <Text style={styles.sectionTitle}>How do you want to play?</Text>
          <View style={styles.modes}>
            {supportsMode(quiz.id, "casual") ? (
              <ModeCard
                icon="▶"
                title="Casual"
                body={quiz.id === "flags" ? "Offline play with hearts, streaks, and local records" : `Online play with all ${quiz.onlineCount} identities, hearts, streaks, and local records`}
              >
                <GameButton
                  compact
                  disabled={launching}
                  label={launching ? "Loading pack…" : "Play Casual"}
                  onPress={() => void playCasual(Boolean(launchError))}
                  variant="yellow"
                />
              </ModeCard>
            ) : (
              <View style={styles.unavailable}>
                <View>
                  <Text style={styles.unavailableTitle}>Casual</Text>
                  <Text style={styles.unavailableBody}>
                    Not available for this quiz yet.
                  </Text>
                </View>
                <Text style={styles.comingSoon}>COMING LATER</Text>
              </View>
            )}
            {launchError ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.errorText}>{launchError}</Text><Text style={styles.errorHint}>{quiz.label} Casual requires a connection. Retry when you are back online.</Text></View> : null}
            {supportsMode(quiz.id, "daily") ? (
              <ModeCard
                icon="☀"
                title="Daily Challenge"
                body="One ranked attempt with quiz-specific standings"
              >
                <GameButton
                  compact
                  label="Open Daily"
                  onPress={() =>
                    router.push({
                      pathname: "/daily-intro",
                      params: { category: quiz.id },
                    })
                  }
                  variant="coral"
                />
              </ModeCard>
            ) : null}
            {supportsMode(quiz.id, "friends") ? (
              <ModeCard
                icon="👥"
                title="With Friends"
                body="Create a private live room for 2–8 players"
              >
                <GameButton
                  compact
                  label="Create Room"
                  onPress={() =>
                    router.push({
                      pathname: "/friends",
                      params: { action: "create", quiz: quiz.id },
                    })
                  }
                  variant="mint"
                />
              </ModeCard>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ModeCard({
  icon,
  title,
  body,
  children,
}: {
  icon: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.mode, shadow.card]}>
      <View style={styles.modeIcon}>
        <Text style={styles.modeEmoji}>{icon}</Text>
      </View>
      <View style={styles.modeCopy}>
        <Text style={styles.modeTitle}>{title}</Text>
        <Text style={styles.modeBody}>{body}</Text>
      </View>
      <View style={styles.modeAction}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  safe: { flex: 1, paddingHorizontal: spacing.lg },
  content: {
    width: "100%",
    maxWidth: 580,
    alignSelf: "center",
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: "center",
    backgroundColor: colors.sky,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  heroIcon: { fontSize: 48 },
  pack: {
    ...type.display,
    color: colors.white,
    fontSize: 26,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  description: {
    ...type.regular,
    color: "#EAF8FF",
    textAlign: "center",
    fontSize: 12,
  },
  counts: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  count: {
    minWidth: 110,
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,.18)",
    padding: spacing.md,
    alignItems: "center",
  },
  countValue: { ...type.display, color: colors.white, fontSize: 21 },
  countLabel: {
    ...type.heading,
    color: "#EAF8FF",
    fontSize: 7,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    ...type.display,
    fontSize: 20,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  modes: { gap: spacing.md },
  mode: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  modeEmoji: { ...type.display, fontSize: 20 },
  modeCopy: { gap: 2 },
  modeTitle: { ...type.display, fontSize: 18 },
  modeBody: { ...type.regular, color: colors.inkSoft, fontSize: 11 },
  modeAction: { marginTop: spacing.xs },
  unavailable: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
  },
  unavailableTitle: { ...type.heading, fontSize: 14 },
  unavailableBody: { ...type.regular, color: colors.inkSoft, fontSize: 10 },
  comingSoon: {
    ...type.heading,
    color: colors.inkSoft,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  errorBox: { borderRadius: radius.md, backgroundColor: colors.dangerPale, borderWidth: 2, borderColor: colors.coral, padding: spacing.md },
  errorText: { ...type.heading, color: colors.coralDark, fontSize: 12 },
  errorHint: { ...type.regular, color: colors.inkSoft, fontSize: 10, marginTop: 2 },
  scope: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 2,
    borderColor: "#F5E4AE",
    padding: spacing.lg,
  },
  scopeTitle: { ...type.heading, fontSize: 14 },
  scopeBody: {
    ...type.regular,
    color: colors.inkSoft,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
});
