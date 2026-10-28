import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/tokens';

export function BubbleBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.bubble, styles.one]} />
      <View style={[styles.bubble, styles.two]} />
      <View style={[styles.bubble, styles.three]} />
      <View style={[styles.bubble, styles.four]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { position: 'absolute', borderRadius: 999, opacity: 0.2 },
  one: { width: 110, height: 110, backgroundColor: colors.yellow, top: 80, right: -45 },
  two: { width: 70, height: 70, backgroundColor: colors.lilac, top: 320, left: -25 },
  three: { width: 46, height: 46, backgroundColor: colors.mint, bottom: 150, right: 16 },
  four: { width: 28, height: 28, backgroundColor: colors.coral, top: 210, left: 30 },
});
