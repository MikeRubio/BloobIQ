import { useState } from 'react';
import { Linking, Modal, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GameButton } from './game-button';
import { useConsentStore } from '../store/consent-store';
import { createParentRequest, requireOnlineAccess } from '../backend/online-access';
import { POLICY_URL, NOTICE_VERSION } from '../privacy/rules';
import { colors, radius, spacing, type } from '../theme/tokens';
export function OnlineAccessGate() {
  const consent = useConsentStore();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const visible = consent.hydrated && (consent.age === 'unknown' || (consent.age === 'adult' && consent.acceptedNoticeVersion !== NOTICE_VERSION) || consent.showGate);
  const run = (task: () => Promise<unknown>) => {
    setBusy(true); setMessage('');
    void task().catch((e) => setMessage(e instanceof Error ? e.message : 'Please retry.')).finally(() => setBusy(false));
  };
  const finishOffline = () => { if (!consent.access.onlineAllowed && consent.age !== 'under18') consent.chooseAge('offline'); consent.closeGate(); };
  const parentUrl = `${POLICY_URL}parent-consent.html#${consent.requestCode ?? ''}`;
  return <Modal visible={visible} animationType="fade" onRequestClose={finishOffline}>
    <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.brand}>BLOOPIQ · ONLINE ACCESS</Text>
        <Text style={styles.title}>Play your way</Text>
        <Text style={styles.body}>Offline Flags works without an online account. Daily challenges and Friends use a guest account and save scores online.</Text>
        {consent.age !== 'under18' ? <>
          <Text style={styles.body}>Which age group are you in? We do not ask for your birth date.</Text>
          <GameButton label="18 or older" variant="sky" disabled={busy} onPress={() => run(async () => { consent.chooseAge('adult'); await requireOnlineAccess(true); consent.closeGate(); })} style={styles.button} />
          <GameButton label="Under 18" variant="mint" disabled={busy} onPress={() => run(async () => { consent.chooseAge('under18'); await createParentRequest(); })} style={styles.button} />
          <Text style={styles.small}>Selecting “18 or older” acknowledges the privacy notice and enables online guest play. Your nickname and scores can appear in rankings and private Friends rooms. You can delete your account in Settings.</Text>
        </> : <>
          <Text style={styles.heading}>Ask a parent or legal guardian</Text>
          <Text style={styles.body}>A parent must read and sign our consent form. BloopIQ’s publisher checks it before enabling online play. Approval is renewed each year. There are no ads for under-18 players.</Text>
          <Text style={styles.body}>Parents separately decide whether your generated nickname and scores may be shared in rankings and Friends rooms. Without that extra permission, Daily scores stay private.</Text>
          {consent.requestCode ? <>
            <GameButton label="Prepare / renew parent form" variant="sky" disabled={busy} onPress={() => run(createParentRequest)} style={styles.button} />
            <GameButton label="Share parent form" variant="sky" disabled={busy} onPress={() => run(() => Share.share({ message: `Parent or guardian: review BloopIQ's notice and signed consent form. Keep this request link private. ${parentUrl}` }))} style={styles.button} />
            <GameButton label="Open parent form" variant="mint" disabled={busy} onPress={() => run(() => Linking.openURL(parentUrl))} style={styles.button} />
            <Text style={styles.small}>Request code (keep private):</Text><Text selectable style={styles.code}>{consent.requestCode}</Text>
          </> : <GameButton label="Prepare parent form" variant="sky" disabled={busy} onPress={() => run(createParentRequest)} style={styles.button} />}
          <GameButton label={busy ? 'Checking…' : 'Check parent approval'} variant="yellow" disabled={busy} onPress={() => run(async () => { await requireOnlineAccess(true); consent.closeGate(); })} style={styles.button} />
          {consent.access.onlineAllowed ? <Text style={styles.body}>Approval active until {new Date(consent.access.expiresAt!).toLocaleDateString()}. Public sharing: {consent.access.sharingAllowed ? 'allowed' : 'off'}. Parents can change permissions or delete data using their separate private control link.</Text> : null}
          <Text style={styles.small}>Unapproved requests expire after 30 days. The parent receives a separate private control link after approval. Do not share that parent link with players.</Text>
        </>}
        <GameButton label={consent.access.onlineAllowed ? 'Back to game' : 'Play offline Flags'} variant="yellow" onPress={finishOffline} disabled={busy} style={styles.button} />
        <GameButton label="Privacy notice & contact" variant="sky" onPress={() => run(() => Linking.openURL(POLICY_URL))} disabled={busy} style={styles.button} />
        {message ? <Text accessibilityRole="alert" style={styles.body}>{message}</Text> : null}
      </View>
    </ScrollView></SafeAreaView>
  </Modal>;
}
export function OnlineAccessSettings() {
  const { age, access, openGate } = useConsentStore();
  return <View style={styles.card}><Text style={styles.heading}>Online access & parents</Text>
    <Text style={styles.body}>{access.onlineAllowed ? (age === 'under18' ? `Parent approved · ${access.sharingAllowed ? 'sharing enabled' : 'private scores'}` : 'Adult online guest') : 'Offline Flags · online permission needed'}</Text>
    <GameButton compact label="Manage online access" variant="sky" onPress={openGate} style={styles.button} />
  </View>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface }, content: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, width: '100%', maxWidth: 560, alignSelf: 'center' },
  brand: { ...type.heading, fontSize: 11, color: colors.skyDark }, title: { ...type.display, fontSize: 28, marginTop: spacing.md },
  heading: { ...type.heading, fontSize: 18, marginTop: spacing.md }, body: { ...type.regular, fontSize: 14, lineHeight: 21, marginTop: spacing.md, color: colors.inkSoft },
  small: { ...type.regular, fontSize: 12, lineHeight: 18, marginTop: spacing.md, color: colors.inkSoft }, button: { marginTop: spacing.md },
  code: { ...type.regular, fontSize: 12, marginTop: spacing.sm, color: colors.ink },
});
