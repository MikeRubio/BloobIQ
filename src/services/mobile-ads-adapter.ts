import type { RewardedAdService } from './rewarded-ad';

export type NativeAdsInitialization = {
  canRequestAds: boolean;
  privacyOptionsRequired: boolean;
  requestNonPersonalizedAdsOnly: boolean;
  message?: string;
};

export type NativeAdsQaConfig = {
  enabled: boolean;
  umpDebugGeography?: 'EEA';
  umpTestDeviceIds: string[];
  mobileAdsTestDeviceIds: string[];
};

export async function initializeNativeAds(_qa?: NativeAdsQaConfig): Promise<NativeAdsInitialization> {
  throw new Error('Google Mobile Ads is available only in an Android or iOS development build.');
}

export async function showNativePrivacyOptions(_qa?: NativeAdsQaConfig): Promise<NativeAdsInitialization> {
  throw new Error('Privacy options are available only in an Android or iOS development build.');
}

export async function resetNativeConsentForTesting(_qa?: NativeAdsQaConfig): Promise<void> {
  throw new Error('Consent testing is available only in an Android or iOS development build.');
}

export async function createNativeRewardedAd(
  _adUnitId: string,
  _reference: string,
  _requestNonPersonalizedAdsOnly: boolean,
): Promise<RewardedAdService & { destroy(): void }> {
  throw new Error('Rewarded ads are available only in an Android or iOS development build.');
}
