export type AdMobBuildConfig = {
  mode: 'test' | 'production';
  appIdMode: 'google-sample' | 'custom';
  qaMode: boolean;
  androidAppId: string;
  iosAppId: string;
  androidRewardedId: string;
  iosRewardedId: string;
  umpDebugGeography?: 'EEA';
  umpTestDeviceIds: string[];
  mobileAdsTestDeviceIds: string[];
};
export const GOOGLE_SAMPLE_IDS: Pick<AdMobBuildConfig, 'androidAppId' | 'iosAppId' | 'androidRewardedId' | 'iosRewardedId'>;
export function resolveAdMobBuildConfig(environment?: Record<string, string | undefined>): AdMobBuildConfig;
