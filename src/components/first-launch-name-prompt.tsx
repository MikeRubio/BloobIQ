import { useConsentStore } from '../store/consent-store';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleBackground } from '@/components/bubble-background';
import { PlayerNameEditor } from '@/components/player-name-editor';
import { useProfileStore } from '@/store/profile-store';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

export function FirstLaunchNamePrompt() {
  const hydrated = useProfileStore((state) => state.hydrated);
  const nameSetupComplete = useProfileStore((state) => state.nameSetupComplete);
  const consent = useConsentStore();
  const visible = hydrated && !nameSetupComplete && consent.access.onlineAllowed && consent.age === 'adult' && !consent.showGate;

  return (
    <Modal animationType="fade" onRequestClose={() => undefined} statusBarTranslucent visible={visible}>
      <View style={styles.root}>
        <BubbleBackground />
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboard}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled"><View style={[styles.card, shadow.card]}>
              <View style={styles.badge}><Text style={styles.badgeText}>BLOOPIQ</Text></View>
              <Text style={styles.title}>What should we call you?</Text>
              <Text style={styles.body}>Choose the player name shown with your Daily scores and records. You can change it any time in Settings.</Text>
              <View style={styles.form}><PlayerNameEditor firstLaunch /></View>
            </View></ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  safe: { flex: 1, padding: spacing.lg },
  keyboard: { flex: 1, justifyContent: 'center' },
  card: { width: '100%', maxWidth: 520, alignSelf: 'center', borderRadius: radius.xl, backgroundColor: colors.white, padding: spacing.xl, borderWidth: 2, borderColor: colors.border },
  badge: { alignSelf: 'flex-start', borderRadius: radius.round, backgroundColor: colors.skyPale, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  badgeText: { ...type.heading, color: colors.skyDark, fontSize: 10, letterSpacing: 1 },
  title: { ...type.display, fontSize: 28, lineHeight: 33, marginTop: spacing.lg },
  body: { ...type.regular, color: colors.inkSoft, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  form: { marginTop: spacing.xl },
});
