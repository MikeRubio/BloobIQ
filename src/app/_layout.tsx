import { AppState } from 'react-native';
import { OnlineAccessGate } from '../components/online-access-gate';
import { useConsentStore } from '../store/consent-store';
import { refreshOnlineAccess } from '../backend/online-access';
import { clearCasualPackCache } from '../backend/casual-api';
import { useDailyStore } from '../store/daily-store';
import { useFriendsStore } from '../store/friends-store';
import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black, useFonts } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';
import { startAuthLifecycle } from '@/backend/auth-lifecycle';
import { LaunchScreen } from '@/components/launch-screen';
import { FirstLaunchNamePrompt } from '@/components/first-launch-name-prompt';
import { preloadStartupAssets, type PreloadProgress } from '@/services/startup-preload';
import { adsRuntime } from '@/services/ads-runtime';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function RootLayout() {
  const permission = useConsentStore((s) => s.access.onlineAllowed);
  const sharing = useConsentStore((s) => s.access.sharingAllowed);
  const priorPermission = useRef(false);
  const priorSharing = useRef(false);
  const privacyHydrated = useConsentStore((s) => s.hydrated);
  const [loaded, fontError] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });
  const [ready, setReady] = useState(false);
  const [preload, setPreload] = useState<PreloadProgress>({ completed: 0, total: 213, label: 'Loading game assets' });
  const fontsReady = loaded || Boolean(fontError);

  useEffect(() => {
    if (!fontsReady) return;
    let active = true;
    void SplashScreen.hideAsync();
    const preloadWithTimeout = Promise.race([preloadStartupAssets((next) => { if (active) setPreload(next); }), wait(4500)]);
    void Promise.all([preloadWithTimeout, wait(900)]).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [fontsReady]);
  useEffect(() => { if (permission) return startAuthLifecycle(); }, [permission]);
  useEffect(() => {
    if (permission) void adsRuntime.initialize();
    else adsRuntime.suspend();
    if (priorPermission.current && !permission) { clearCasualPackCache(); useDailyStore.getState().reset(); void useFriendsStore.getState().clearLocalData(); }
    priorPermission.current = permission;
  }, [permission]);
  useEffect(() => {
    if (priorSharing.current && !sharing) void useFriendsStore.getState().clearLocalData();
    priorSharing.current = sharing;
  }, [sharing]);
  useEffect(() => {
    if (!privacyHydrated) return;
    void refreshOnlineAccess();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void refreshOnlineAccess(); });
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refreshOnlineAccess(); }, 60_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [privacyHydrated]);
  if (!fontsReady) return null;
  if (!ready) return <LaunchScreen label={preload.label} progress={preload.total ? preload.completed / preload.total : 0} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface }, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="game" options={{ gestureEnabled: false }} />
          <Stack.Screen name="results" options={{ gestureEnabled: false }} />
          <Stack.Screen name="records" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="daily-intro" />
          <Stack.Screen name="daily" options={{ gestureEnabled: false }} />
          <Stack.Screen name="daily-results" options={{ gestureEnabled: false }} />
          <Stack.Screen name="rankings" />
          <Stack.Screen name="friends" />
          <Stack.Screen name="friend-room" options={{ gestureEnabled: false }} />
          <Stack.Screen name="category" />
          <Stack.Screen name="quiz" />
        </Stack>
        <FirstLaunchNamePrompt />
        <OnlineAccessGate />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
