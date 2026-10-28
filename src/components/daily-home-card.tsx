import { backendProfileFromLocal } from "@/backend/profile-migration";
import type { QuizCategoryId } from "@/backend/types";
import { quizzesForMode } from "@/content/quiz-catalog";
import { formatCountdown } from "@/daily/time";
import { useDailyStore } from "@/store/daily-store";
import { useProfileStore } from "@/store/profile-store";
import { colors, radius, shadow, spacing, type } from "@/theme/tokens";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const dailyQuizzes = quizzesForMode("daily");

export function DailyHomeCard() {
  const profile = useProfileStore((state) => state.profile);
  const hydrated = useProfileStore((state) => state.hydrated);
  const status = useDailyStore((state) => state.status);
  const snapshot = useDailyStore((state) => state.snapshot);
  const activeCategoryId = useDailyStore((state) => state.activeCategoryId);
  const message = useDailyStore((state) => state.message);
  const load = useDailyStore((state) => state.load);
  const [selectedQuizId, setSelectedQuizId] = useState<QuizCategoryId>("flags");
  const [, refreshClock] = useState(0);

  useEffect(() => {
    if (
      !hydrated ||
      (status === "loading" && activeCategoryId === selectedQuizId)
    )
      return;
    if (
      activeCategoryId !== selectedQuizId ||
      snapshot?.categoryId !== selectedQuizId
    )
      void load(backendProfileFromLocal(profile), selectedQuizId);
  }, [
    activeCategoryId,
    hydrated,
    load,
    profile,
    selectedQuizId,
    snapshot?.categoryId,
    status,
  ]);
  useEffect(() => {
    const timer = setInterval(() => refreshClock((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const quiz = dailyQuizzes.find(
    (candidate) => candidate.id === selectedQuizId,
  )!;
  const selectedSnapshot =
    snapshot?.categoryId === selectedQuizId ? snapshot : null;
  const attemptState = selectedSnapshot?.state;
  const action =
    attemptState === "in_progress"
      ? "Resume"
      : attemptState === "completed" || attemptState === "expired"
        ? "View Result"
        : "Start";
  const open = () => {
    if (attemptState === "in_progress")
      router.push({ pathname: "/daily", params: { category: selectedQuizId } });
    else if (attemptState === "completed" || attemptState === "expired")
      router.push({
        pathname: "/daily-results",
        params: { category: selectedQuizId },
      });
    else
      router.push({
        pathname: "/daily-intro",
        params: { category: selectedQuizId },
      });
  };
  const countdown = selectedSnapshot?.resetAt
    ? formatCountdown(selectedSnapshot.resetAt)
    : null;
  const body =
    status === "loading" || !selectedSnapshot
      ? "Checking today’s challenge…"
      : status === "unconfigured"
        ? "Ranked backend setup needed"
        : status === "error"
          ? (message ?? "Ranked service unavailable")
          : attemptState === "completed"
            ? `${selectedSnapshot.score}/1000 · Rank ${selectedSnapshot.rank ?? "pending"}`
            : attemptState === "in_progress"
              ? `Question ${(selectedSnapshot.questionIndex ?? 0) + 1} of 10`
              : attemptState === "expired"
                ? "Ranked attempt expired"
                : "10 questions · One ranked attempt";

  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>DAILY CHALLENGE</Text>
          <Text style={styles.title}>Today’s quiz</Text>
        </View>
        <View style={styles.sun}>
          <Text style={styles.sunText}>☀</Text>
        </View>
      </View>
      <View accessibilityRole="tablist" style={styles.selector}>
        {dailyQuizzes.map((candidate) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedQuizId === candidate.id }}
            key={candidate.id}
            onPress={() => setSelectedQuizId(candidate.id)}
            style={[
              styles.quizTab,
              selectedQuizId === candidate.id && styles.quizTabActive,
            ]}
          >
            <Text style={styles.quizIcon}>{candidate.icon}</Text>
            <Text
              style={[
                styles.quizTabText,
                selectedQuizId === candidate.id && styles.quizTabTextActive,
              ]}
            >
              {candidate.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.summary}>
        <View style={styles.copy}>
          <Text style={styles.pack}>{quiz.packLabel}</Text>
          <Text style={styles.body}>{body}</Text>
          {selectedSnapshot ? (
            <Text style={styles.meta}>
              🔥 {selectedSnapshot.dailyStreak} day streak
              {countdown ? `  ·  New in ${countdown}` : ""}
            </Text>
          ) : null}
          {selectedSnapshot?.contentVersion ? (
            <Text style={styles.version}>
              Pack {selectedSnapshot.contentVersion}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={status === "loading"}
          onPress={
            status === "error"
              ? () =>
                  void load(backendProfileFromLocal(profile), selectedQuizId)
              : open
          }
          style={[styles.action, status === "loading" && styles.disabled]}
        >
          <Text style={styles.actionText}>
            {status === "error"
              ? "Retry"
              : status === "unconfigured"
                ? "Setup"
                : action}
          </Text>
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/rankings', params: { category: selectedQuizId } })} style={styles.rankings}><Text style={styles.rankingsText}>View {quiz.label} rankings</Text><Text style={styles.rankingsArrow}>›</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: "#F5E4AE",
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    ...type.heading,
    color: colors.coralDark,
    fontSize: 10,
    letterSpacing: 1,
  },
  title: { ...type.display, fontSize: 22 },
  sun: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  sunText: { color: colors.ink, fontSize: 22 },
  selector: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 4,
    borderRadius: radius.md,
    backgroundColor: "#F2E6C4",
    gap: 4,
  },
  quizTab: {
    flexGrow: 1,
    flexBasis: "48%",
    minHeight: 46,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  quizTabActive: { backgroundColor: colors.white },
  quizIcon: { fontSize: 18 },
  quizTabText: { ...type.heading, color: colors.inkSoft, fontSize: 12 },
  quizTabTextActive: { color: colors.ink },
  summary: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  copy: { flex: 1, minWidth: 0 },
  pack: { ...type.heading, fontSize: 15 },
  body: { ...type.regular, color: colors.inkSoft, fontSize: 11, marginTop: 2 },
  meta: { ...type.heading, color: colors.coralDark, fontSize: 9, marginTop: 5 },
  version: {
    ...type.regular,
    color: colors.inkSoft,
    fontSize: 8,
    marginTop: 3,
  },
  action: {
    minWidth: 82,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.coral,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { ...type.heading, color: colors.white, fontSize: 12 },
  disabled: { opacity: 0.55 },
  rankings: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
  },
  rankingsText: { ...type.heading, color: colors.skyDark, fontSize: 11 },
  rankingsArrow: { ...type.display, color: colors.sky, fontSize: 24 },
});
