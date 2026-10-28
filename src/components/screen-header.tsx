import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing, type } from '@/theme/tokens';

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityLabel="Go back" accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  back: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
  backText: { ...type.display, fontSize: 38, lineHeight: 39, marginTop: -4 },
  copy: { flex: 1, alignItems: 'center' },
  title: { ...type.display, fontSize: 24 },
  subtitle: { ...type.regular, color: colors.inkSoft, fontSize: 12 },
  spacer: { width: 48 },
});
