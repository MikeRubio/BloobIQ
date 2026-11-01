import { useConsentStore } from '../store/consent-store';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { backendProfileFromLocal } from '@/backend/profile-migration';
import { syncGuestProfile } from '@/backend/supabase';
import { GameButton } from '@/components/game-button';
import {
  getPlayerNameError,
  normalizePlayerName,
  PLAYER_NAME_MAX_LENGTH,
  useProfileStore,
} from '@/store/profile-store';
import { colors, radius, spacing, type } from '@/theme/tokens';

type Props = {
  firstLaunch?: boolean;
  onSaved?: () => void;
};

export function PlayerNameEditor({ firstLaunch = false, onSaved }: Props) {
  const age = useConsentStore((s) => s.age);
  const profile = useProfileStore((state) => state.profile);
  const setPlayerName = useProfileStore((state) => state.setPlayerName);
  const [draft, setDraft] = useState(profile.name);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const save = () => {
    const validationError = getPlayerNameError(draft);
    if (validationError) {
      setError(validationError);
      setMessage(null);
      return;
    }

    const name = normalizePlayerName(draft);
    const updatedProfile = { ...profile, name };
    setDraft(name);
    setError(null);
    setPlayerName(name);
    setMessage('Name saved. Syncing ranked records…');
    onSaved?.();

    void syncGuestProfile(backendProfileFromLocal(updatedProfile))
      .then(() => {
        if (mounted.current) setMessage('Name saved and ranked records updated.');
      })
      .catch(() => {
        if (mounted.current) setMessage('Saved on this device. Ranked records will update when you reconnect.');
      });
  };

  if (age !== 'adult') return <View><Text style={styles.label}>GENERATED PLAYER NAME</Text><Text style={styles.help}>{profile.name}</Text><Text style={styles.help}>Under-18 and offline players use a generated nickname. A parent controls public sharing.</Text></View>;

  return (
    <View>
      <Text style={styles.label}>PLAYER NAME</Text>
      <TextInput
        accessibilityLabel="Player name"
        autoCapitalize="words"
        autoCorrect={false}
        autoFocus={firstLaunch}
        maxLength={PLAYER_NAME_MAX_LENGTH + 8}
        onChangeText={(value) => {
          setDraft(value);
          if (error) setError(null);
          if (message) setMessage(null);
        }}
        onSubmitEditing={save}
        placeholder="Enter your player name"
        placeholderTextColor={colors.inkSoft}
        returnKeyType="done"
        selectionColor={colors.sky}
        style={[styles.input, error && styles.inputError]}
        value={draft}
      />
      <Text style={[styles.help, error && styles.error]} accessibilityRole={error ? 'alert' : undefined}>
        {error ?? `Use ${PLAYER_NAME_MAX_LENGTH} characters or fewer. This name appears on ranked records.`}
      </Text>
      <GameButton
        compact
        label={firstLaunch ? 'Start playing' : 'Save name'}
        onPress={save}
        variant={firstLaunch ? 'yellow' : 'sky'}
        style={styles.button}
      />
      {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...type.heading, color: colors.skyDark, fontSize: 9, letterSpacing: 0.8 },
  input: {
    ...type.heading,
    minHeight: 52,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    fontSize: 17,
    marginTop: spacing.xs,
  },
  inputError: { borderColor: colors.coral },
  help: { ...type.regular, color: colors.inkSoft, fontSize: 11, lineHeight: 15, marginTop: spacing.xs },
  error: { color: colors.coralDark },
  button: { marginTop: spacing.lg },
  message: { ...type.regular, color: colors.inkSoft, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: spacing.sm },
});
