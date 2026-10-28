import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useProfileStore } from '@/store/profile-store';
import { colors, motion, radius, shadow, spacing, type } from '@/theme/tokens';

type ButtonVariant = 'sky' | 'coral' | 'mint' | 'yellow' | 'ghost' | 'dark';

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
};

const palettes: Record<ButtonVariant, { background: string; edge: string; text: string }> = {
  sky: { background: colors.sky, edge: colors.skyDark, text: colors.white },
  coral: { background: colors.coral, edge: colors.coralDark, text: colors.white },
  mint: { background: colors.mint, edge: colors.mintDark, text: colors.ink },
  yellow: { background: colors.yellow, edge: colors.yellowDark, text: colors.ink },
  ghost: { background: colors.white, edge: colors.border, text: colors.ink },
  dark: { background: colors.ink, edge: '#0B2136', text: colors.white },
};

export function GameButton({ label, onPress, variant = 'sky', icon, disabled, compact, style, accessibilityHint }: Props) {
  const scale = useSharedValue(1);
  const systemReduced = useReducedMotion();
  const forceReduced = useProfileStore((state) => state.settings.reducedMotion);
  const reduced = systemReduced || forceReduced;
  const palette = palettes[variant];
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.wrapper, shadow.button, disabled && styles.disabled, animatedStyle, style]}>
      <View style={[styles.edge, { backgroundColor: palette.edge }]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => { scale.set(reduced ? 1 : withTiming(0.96, { duration: motion.quick })); }}
        onPressOut={() => { scale.set(reduced ? 1 : withSpring(1, motion.spring)); }}
        style={[styles.face, compact && styles.compact, { backgroundColor: palette.background }]}
      >
        {icon}
        <Text style={[styles.label, compact && styles.compactLabel, { color: palette.text }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { minHeight: 58, borderRadius: radius.md, position: 'relative', paddingBottom: 5 },
  edge: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 5, borderRadius: radius.md },
  face: { minHeight: 58, borderRadius: radius.md, paddingHorizontal: spacing.xl, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm },
  compact: { minHeight: 48, paddingHorizontal: spacing.lg },
  label: { ...type.heading, fontSize: 18, textAlign: 'center' },
  compactLabel: { fontSize: 15 },
  disabled: { opacity: 0.55 },
});
