import Constants from 'expo-constants';
import { Platform, TurboModuleRegistry, type TurboModule } from 'react-native';
import type { CategoryId } from '@/game/types';
import { issueAdRewardReference, markAdRewardClientEarned } from '@/backend/reward-api';
import { runRewardedAd, type RewardedAdService } from './rewarded-ad';
import type { NativeAdsInitialization, NativeAdsQaConfig } from './mobile-ads-adapter';

export type AdLifecycle = 'unavailable' | 'loading' | 'ready' | 'showing' | 'reward-earned' | 'closed' | 'failed';
export type AdsRuntimeState = {
  lifecycle: AdLifecycle;
  message: string;
  isTest: boolean;
  privacyOptionsRequired: boolean;
  qaMode: boolean;
  umpDebugGeography?: 'EEA';
  umpTestDeviceConfigured: boolean;
  mobileAdsTestDeviceConfigured: boolean;
};

type LoadedService = RewardedAdService & { destroy(): void };
type Listener = () => void;

const config = (Constants.expoConfig?.extra?.ads ?? {}) as {
  mode?: 'test' | 'production';
  qaMode?: boolean;
  androidRewardedId?: string;
  iosRewardedId?: string;
  umpDebugGeography?: 'EEA';
  umpTestDeviceIds?: string[];
  mobileAdsTestDeviceIds?: string[];
};
const qaConfig: NativeAdsQaConfig = {
  enabled: config.qaMode === true && config.mode !== 'production',
  umpDebugGeography: config.qaMode === true && config.mode !== 'production' ? config.umpDebugGeography : undefined,
  umpTestDeviceIds: config.qaMode === true && config.mode !== 'production' ? (config.umpTestDeviceIds ?? []) : [],
  mobileAdsTestDeviceIds: config.qaMode === true && config.mode !== 'production' ? (config.mobileAdsTestDeviceIds ?? []) : [],
};
const listeners = new Set<Listener>();
const requiredNativeAdsModules = [
  'RNAppModule',
  'RNGoogleMobileAdsModule',
  'RNGoogleMobileAdsConsentModule',
  'RNGoogleMobileAdsAppOpenModule',
  'RNGoogleMobileAdsNativeModule',
  'RNGoogleMobileAdsPoolModule',
  'RNGoogleMobileAdsInterstitialModule',
  'RNGoogleMobileAdsRewardedModule',
  'RNGoogleMobileAdsRewardedInterstitialModule',
] as const;
let state: AdsRuntimeState = {
  lifecycle: 'unavailable',
  message: 'Ads are preparing.',
  isTest: config.mode !== 'production',
  privacyOptionsRequired: false,
  qaMode: qaConfig.enabled,
  umpDebugGeography: qaConfig.umpDebugGeography,
  umpTestDeviceConfigured: qaConfig.umpTestDeviceIds.length > 0,
  mobileAdsTestDeviceConfigured: qaConfig.mobileAdsTestDeviceIds.length > 0,
};
let consent: NativeAdsInitialization | null = null;
let initialization: Promise<void> | null = null;
let service: LoadedService | null = null;
let preparedRunId: string | null = null;
let rewardReference: string | null = null;

const emit = (next: Partial<AdsRuntimeState>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};

const unavailableReason = (): string | null => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return 'Rewarded ads are available only on Android and iOS.';
  if (Constants.executionEnvironment === 'storeClient') return 'Expo Go cannot load native ads. Install the BloopIQ development build.';
  if (requiredNativeAdsModules.some((name) => !TurboModuleRegistry.get<TurboModule>(name))) {
    return 'This installed BloopIQ build predates the native ads integration. Install a newly built development client.';
  }
  const adUnitId = Platform.OS === 'ios' ? config.iosRewardedId : config.androidRewardedId;
  if (!adUnitId) return 'This build does not include a rewarded ad unit ID.';
  return null;
};

function requireNativeAds(): void {
  const reason = unavailableReason();
  if (reason) throw new Error(reason);
}

export const adsRuntime = {
  getSnapshot: () => state,
  subscribe(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); },

  initialize(): Promise<void> {
    initialization ??= (async () => {
      const reason = unavailableReason();
      if (reason) return emit({ lifecycle: 'unavailable', message: reason });
      try {
        const adapter = await import('./mobile-ads-adapter');
        consent = await adapter.initializeNativeAds(qaConfig);
        emit({
          lifecycle: consent.canRequestAds ? 'closed' : 'unavailable',
          message: consent.canRequestAds ? (consent.message ?? 'Rewarded ads are available.') : 'Ads are unavailable under the current privacy choice.',
          privacyOptionsRequired: consent.privacyOptionsRequired,
        });
      } catch (error) {
        emit({ lifecycle: 'unavailable', message: error instanceof Error ? error.message : 'Ads could not be initialized.' });
      }
    })();
    return initialization;
  },

  async showPrivacyOptions(): Promise<void> {
    requireNativeAds();
    const adapter = await import('./mobile-ads-adapter');
    consent = await adapter.showNativePrivacyOptions(qaConfig);
    emit({
      lifecycle: consent.canRequestAds ? 'closed' : 'unavailable',
      message: consent.canRequestAds ? 'Your ad privacy choices were updated.' : 'Ads are unavailable under the current privacy choice.',
      privacyOptionsRequired: consent.privacyOptionsRequired,
    });
  },

  async resetConsentForTesting(): Promise<void> {
    if (!qaConfig.enabled) throw new Error('Consent reset is disabled in this build.');
    requireNativeAds();
    service?.destroy();
    service = null;
    preparedRunId = null;
    rewardReference = null;
    consent = null;
    initialization = null;
    const adapter = await import('./mobile-ads-adapter');
    await adapter.resetNativeConsentForTesting(qaConfig);
    emit({
      lifecycle: 'unavailable',
      privacyOptionsRequired: false,
      message: 'Consent reset. Fully close and reopen BloopIQ to test the first-launch flow again.',
    });
  },

  async prepare(runId: string, categoryId: CategoryId): Promise<void> {
    if (preparedRunId === runId && service) return;
    await this.initialize();
    if (!consent?.canRequestAds) return;
    service?.destroy(); service = null; rewardReference = null; preparedRunId = runId;
    emit({ lifecycle: 'loading', message: 'Loading a rewarded ad…' });
    try {
      rewardReference = await issueAdRewardReference(runId, categoryId);
      const adapter = await import('./mobile-ads-adapter');
      const unitId = Platform.OS === 'ios' ? config.iosRewardedId : config.androidRewardedId;
      if (!unitId) throw new Error('This build has no rewarded ad unit.');
      service = await adapter.createNativeRewardedAd(unitId, rewardReference, consent.requestNonPersonalizedAdsOnly);
      emit({ lifecycle: 'ready', message: state.isTest ? 'Test ad ready.' : 'Ad ready.' });
    } catch (error) {
      service?.destroy(); service = null;
      emit({ lifecycle: 'failed', message: error instanceof Error ? error.message : 'The ad could not be loaded.' });
    }
  },

  async show(onEarned: () => void): Promise<'earned' | 'cancelled' | 'failed'> {
    if (!service || !rewardReference || state.lifecycle !== 'ready') return 'failed';
    emit({ lifecycle: 'showing', message: 'Ad in progress…' });
    const activeService = service;
    const activeReference = rewardReference;
    const result = await runRewardedAd(activeService, () => {
      emit({ lifecycle: 'reward-earned', message: 'Revive earned. Server verification is pending.' });
      onEarned();
      void markAdRewardClientEarned(activeReference).catch(() => undefined);
    });
    activeService.destroy(); service = null;
    emit({
      lifecycle: result === 'failed' ? 'failed' : 'closed',
      message: result === 'earned' ? 'Revive earned.' : result === 'cancelled' ? 'Ad closed before the reward was earned.' : 'The ad could not be shown.',
    });
    return result;
  },

  resetRun(): void {
    service?.destroy(); service = null; preparedRunId = null; rewardReference = null;
  },
};
