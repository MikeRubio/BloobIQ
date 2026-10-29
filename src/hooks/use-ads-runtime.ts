import { useSyncExternalStore } from 'react';
import { adsRuntime } from '@/services/ads-runtime';

export function useAdsRuntime() {
  return useSyncExternalStore(adsRuntime.subscribe, adsRuntime.getSnapshot, adsRuntime.getSnapshot);
}
