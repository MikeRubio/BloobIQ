import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black, useFonts } from '@expo-google-fonts/nunito';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/theme/tokens';
import { startAuthLifecycle } from '@/backend/auth-lifecycle';
import { LaunchScreen } from '@/components/launch-screen';
import { preloadStartupAssets, type PreloadProgress } from '@/services/startup-preload';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function RootLayout() {
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
  useEffect(() => startAuthLifecycle(), []);
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
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
