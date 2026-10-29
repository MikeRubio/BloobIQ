import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BubbleBackground } from '@/components/bubble-background';
import { ScreenHeader } from '@/components/screen-header';
import { useFeedback } from '@/hooks/use-feedback';
import { useAdsRuntime } from '@/hooks/use-ads-runtime';
import { adsRuntime } from '@/services/ads-runtime';
import { useProfileStore } from '@/store/profile-store';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

const rows = [
  { key: 'sound' as const, icon: '♪', title: 'Sound effects', body: 'Cheerful cues for right and wrong answers.' },
  { key: 'haptics' as const, icon: '≋', title: 'Haptics', body: 'Tactile feedback for answers and taps.' },
  { key: 'reducedMotion' as const, icon: '◌', title: 'Reduce motion', body: 'Turns off bounces, wobbles, and celebrations.' },
];

const PRIVACY_POLICY_URL = 'https://bloopiq-privacy.merry-coin-3817.chatgpt.site/';

export default function SettingsScreen() {
  const settings = useProfileStore((state) => state.settings);
  const toggle = useProfileStore((state) => state.toggleSetting);
  const systemReduced = useReducedMotion();
  const { tap } = useFeedback();
  const ads = useAdsRuntime();
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const onToggle = (key: keyof typeof settings) => { toggle(key); if (key !== 'haptics') tap(); };
  return (
    <View style={styles.root}>
      <BubbleBackground />
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Settings" subtitle="Make BloopIQ feel right" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, shadow.card]}>
            {rows.map((row, index) => (
              <View key={row.key} style={[styles.row, index < rows.length - 1 && styles.divider]}>
                <View style={styles.icon}><Text style={styles.iconText}>{row.icon}</Text></View>
                <View style={styles.copy}><Text style={styles.title}>{row.title}</Text><Text style={styles.body}>{row.body}</Text></View>
                <Switch accessibilityLabel={row.title} onValueChange={() => onToggle(row.key)} thumbColor={colors.white} trackColor={{ false: '#B9C9D3', true: colors.mintDark }} value={settings[row.key]} />
              </View>
            ))}
          </View>
          {systemReduced ? <View style={styles.systemNote}><Text style={styles.noteIcon}>✓</Text><Text style={styles.noteText}>Your device’s reduced-motion preference is active and is always honoured.</Text></View> : null}
          {ads.privacyOptionsRequired ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Ad privacy</Text>
              <Text style={styles.infoBody}>Review or change the privacy choices used for optional rewarded ads.</Text>
              <Pressable
                accessibilityRole="button"
                disabled={privacyBusy}
                onPress={() => {
                  setPrivacyBusy(true);
                  void adsRuntime.showPrivacyOptions().finally(() => setPrivacyBusy(false));
                }}
                style={styles.privacyButton}
              >
                <Text style={styles.privacyButtonText}>{privacyBusy ? 'Opening…' : 'Manage ad privacy'}</Text>
              </Pressable>
            </View>
          ) : null}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Privacy policy (draft)</Text>
            <Text style={styles.infoBody}>Review the current draft policy. It remains under review and is not a claim that children&#39;s privacy requirements are complete.</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => { void Linking.openURL(PRIVACY_POLICY_URL); }}
              style={styles.privacyButton}
            >
              <Text style={styles.privacyButtonText}>Open draft policy</Text>
            </Pressable>
          </View>
          {ads.qaMode ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Advertising QA</Text>
              <Text style={styles.infoBody}>Adult tester only. EEA debug geography is {ads.umpDebugGeography === 'EEA' ? 'enabled' : 'off'}; it takes effect only on a registered UMP test device.</Text>
              <Text style={styles.infoBody}>UMP test device: {ads.umpTestDeviceConfigured ? 'configured' : 'not configured'}.</Text>
              <Text style={styles.infoBody}>Mobile Ads test device: {ads.mobileAdsTestDeviceConfigured ? 'configured' : 'not configured (not required for Google sample units)'}.</Text>
              <Pressable
                accessibilityRole="button"
                disabled={resetBusy}
                onPress={() => {
                  setResetBusy(true);
                  void adsRuntime.resetConsentForTesting().finally(() => setResetBusy(false));
                }}
                style={styles.resetButton}
              >
                <Text style={styles.resetButtonText}>{resetBusy ? 'Resetting...' : 'Reset consent for testing'}</Text>
              </Pressable>
              <Text style={styles.qaMessage}>{ads.message}</Text>
            </View>
          ) : null}
          <View style={styles.infoCard}><Text style={styles.infoTitle}>Casual data stays here</Text><Text style={styles.infoBody}>Your guest name and avatar sync to the anonymous Daily identity. Settings and casual personal records remain stored only on this device.</Text></View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface }, safe: { flex: 1, paddingHorizontal: spacing.lg }, content: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, paddingHorizontal: spacing.lg }, row: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.md }, divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.skyPale, alignItems: 'center', justifyContent: 'center' }, iconText: { ...type.display, color: colors.skyDark, fontSize: 23 }, copy: { flex: 1 },
  title: { ...type.heading, fontSize: 16 }, body: { ...type.regular, color: colors.inkSoft, fontSize: 12, lineHeight: 16, marginTop: 3 },
  systemNote: { marginTop: spacing.lg, padding: spacing.lg, backgroundColor: colors.successPale, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm }, noteIcon: { ...type.heading, color: colors.mintDark }, noteText: { ...type.regular, flex: 1, fontSize: 12, lineHeight: 17 },
  infoCard: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.7)' }, infoTitle: { ...type.heading, fontSize: 15 }, infoBody: { ...type.regular, color: colors.inkSoft, fontSize: 12, lineHeight: 17, marginTop: spacing.xs },
  privacyButton: { alignSelf: 'flex-start', marginTop: spacing.md, borderRadius: radius.md, backgroundColor: colors.sky, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  privacyButtonText: { ...type.heading, color: colors.white, fontSize: 13 },
  resetButton: { alignSelf: 'flex-start', marginTop: spacing.md, borderRadius: radius.md, borderWidth: 2, borderColor: colors.sky, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  resetButtonText: { ...type.heading, color: colors.skyDark, fontSize: 13 },
  qaMessage: { ...type.regular, color: colors.inkSoft, fontSize: 11, lineHeight: 16, marginTop: spacing.sm },
});
