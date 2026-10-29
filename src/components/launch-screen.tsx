import { colors, radius, spacing, type } from "@/theme/tokens";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function LaunchScreen({
  progress,
  label,
}: {
  progress: number;
  label: string;
}) {
  return (
    <View style={styles.root}>
      <View style={[styles.bubble, styles.bubbleOne]} />
      <View style={[styles.bubble, styles.bubbleTwo]} />
      <View style={[styles.bubble, styles.bubbleThree]} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.markShell}>
          <Image
            source={require("../../assets/branding/mark.png")}
            resizeMode="contain"
            style={styles.mark}
          />
        </View>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>BLOOP</Text>
          <Text style={[styles.brand, styles.brandAccent]}>IQ</Text>
          <View style={styles.brandDot} />
        </View>
        <View style={styles.loader}>
          <View
            style={[
              styles.loaderFill,
              { width: `${Math.max(8, Math.round(progress * 100))}%` },
            ]}
          />
        </View>
        <Text style={styles.status}>{label}</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sky, overflow: "hidden" },
  safe: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  bubble: {
    position: "absolute",
    borderRadius: radius.round,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  bubbleOne: { width: 220, height: 220, right: -72, top: -38 },
  bubbleTwo: { width: 150, height: 150, left: -54, bottom: 80 },
  bubbleThree: { width: 54, height: 54, left: 42, top: 110 },
  markShell: {
    width: 190,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: { width: "100%", height: "100%" },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  brand: {
    ...type.display,
    color: colors.white,
    fontSize: 42,
    letterSpacing: -2,
  },
  brandAccent: { color: colors.yellow },
  brandDot: {
    width: 9,
    height: 9,
    borderRadius: 9,
    backgroundColor: colors.coral,
    marginLeft: 4,
    marginTop: -24,
  },
  tagline: {
    ...type.regular,
    color: "#EAF8FF",
    fontSize: 14,
    marginTop: spacing.xs,
  },
  loader: {
    width: "72%",
    maxWidth: 280,
    height: 9,
    borderRadius: radius.round,
    backgroundColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
    marginTop: spacing.xxxl,
  },
  loaderFill: {
    height: "100%",
    borderRadius: radius.round,
    backgroundColor: colors.yellow,
  },
  status: {
    ...type.heading,
    color: colors.white,
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: spacing.md,
  },
});
