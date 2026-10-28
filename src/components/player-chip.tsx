import { StyleSheet, Text, View } from 'react-native';
import { useProfileStore } from '@/store/profile-store';
import { colors, radius, spacing, type } from '@/theme/tokens';

export function PlayerChip() {
  const profile = useProfileStore((state) => state.profile);
  return (
    <View style={styles.container}>
      <View style={[styles.avatar, { backgroundColor: profile.color }]}><Text style={styles.avatarText}>{profile.avatar}</Text></View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>GUEST PLAYER</Text>
        <Text numberOfLines={1} style={styles.name}>{profile.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 },
  avatar: { width: 46, height: 46, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.white },
  avatarText: { fontSize: 24 },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { ...type.heading, color: colors.skyDark, fontSize: 10, letterSpacing: 1 },
  name: { ...type.heading, fontSize: 14 },
});
