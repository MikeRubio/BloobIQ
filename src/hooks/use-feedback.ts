import { useCallback } from 'react';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useProfileStore } from '@/store/profile-store';

export function useFeedback() {
  const sound = useProfileStore((state) => state.settings.sound);
  const haptics = useProfileStore((state) => state.settings.haptics);
  const correctPlayer = useAudioPlayer(require('../../assets/sounds/correct.wav'));
  const wrongPlayer = useAudioPlayer(require('../../assets/sounds/wrong.wav'));

  const playAudio = useCallback(async (player: typeof correctPlayer) => {
    try {
      await player.seekTo(0);
      player.play();
    } catch {
      // Feedback must never interrupt the run if a device cannot play audio.
    }
  }, []);

  const correct = useCallback(() => {
    if (sound) void playAudio(correctPlayer);
    if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [correctPlayer, haptics, playAudio, sound]);

  const wrong = useCallback(() => {
    if (sound) void playAudio(wrongPlayer);
    if (haptics) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [haptics, playAudio, sound, wrongPlayer]);

  const tap = useCallback(() => {
    if (haptics) void Haptics.selectionAsync();
  }, [haptics]);

  return { correct, wrong, tap };
}
