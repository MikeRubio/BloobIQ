import { describe, expect, it } from 'vitest';
import { GOOGLE_SAMPLE_IDS, resolveAdMobBuildConfig } from './admob.cjs';

describe('AdMob build configuration', () => {
  it('uses only official Google test IDs outside production', () => {
    expect(resolveAdMobBuildConfig({ BLOOPIQ_ADS_ENV: 'test' })).toEqual({
      mode: 'test', appIdMode: 'google-sample', qaMode: false, ...GOOGLE_SAMPLE_IDS,
      umpDebugGeography: undefined, umpTestDeviceIds: [], mobileAdsTestDeviceIds: [],
    });
  });

  it('fails a production build instead of falling back to test inventory', () => {
    expect(() => resolveAdMobBuildConfig({ EAS_BUILD_PROFILE: 'production' })).toThrow('ADMOB_ANDROID_APP_ID');
  });

  it('uses explicit production app and placement IDs', () => {
    const config = resolveAdMobBuildConfig({
      BLOOPIQ_ADS_ENV: 'production',
      ADMOB_ANDROID_APP_ID: 'android-app', ADMOB_IOS_APP_ID: 'ios-app',
      ADMOB_ANDROID_REWARDED_ID: 'android-unit', ADMOB_IOS_REWARDED_ID: 'ios-unit',
    });
    expect(config).toEqual({
      mode: 'production', appIdMode: 'custom', qaMode: false, androidAppId: 'android-app', iosAppId: 'ios-app',
      androidRewardedId: 'android-unit', iosRewardedId: 'ios-unit',
      umpDebugGeography: undefined, umpTestDeviceIds: [], mobileAdsTestDeviceIds: [],
    });
  });

  it('keeps BloopIQ app IDs separate from Google sample rewarded inventory in ads QA', () => {
    expect(resolveAdMobBuildConfig({
      EAS_BUILD_PROFILE: 'ads-qa',
      BLOOPIQ_ADS_APP_ID_MODE: 'custom',
      BLOOPIQ_ADS_INVENTORY: 'test',
      BLOOPIQ_ADS_QA: 'true',
      BLOOPIQ_UMP_DEBUG_GEOGRAPHY: 'EEA',
      BLOOPIQ_UMP_TEST_DEVICE_IDS: 'ump-a, ump-b',
      BLOOPIQ_MOBILE_ADS_TEST_DEVICE_IDS: 'gma-a',
      ADMOB_ANDROID_APP_ID: 'ca-app-pub-6478004441965465~2620495643',
      ADMOB_IOS_APP_ID: 'ca-app-pub-6478004441965465~4153069168',
    })).toEqual({
      mode: 'test', appIdMode: 'custom', qaMode: true,
      androidAppId: 'ca-app-pub-6478004441965465~2620495643',
      iosAppId: 'ca-app-pub-6478004441965465~4153069168',
      androidRewardedId: GOOGLE_SAMPLE_IDS.androidRewardedId,
      iosRewardedId: GOOGLE_SAMPLE_IDS.iosRewardedId,
      umpDebugGeography: 'EEA', umpTestDeviceIds: ['ump-a', 'ump-b'], mobileAdsTestDeviceIds: ['gma-a'],
    });
  });

  it('never includes QA debug settings in production', () => {
    const config = resolveAdMobBuildConfig({
      EAS_BUILD_PROFILE: 'production', BLOOPIQ_ADS_QA: 'true', BLOOPIQ_UMP_DEBUG_GEOGRAPHY: 'EEA',
      BLOOPIQ_UMP_TEST_DEVICE_IDS: 'ump-a', BLOOPIQ_MOBILE_ADS_TEST_DEVICE_IDS: 'gma-a',
      ADMOB_ANDROID_APP_ID: 'android-app', ADMOB_IOS_APP_ID: 'ios-app',
      ADMOB_ANDROID_REWARDED_ID: 'android-unit', ADMOB_IOS_REWARDED_ID: 'ios-unit',
    });
    expect(config).toMatchObject({ qaMode: false, umpTestDeviceIds: [], mobileAdsTestDeviceIds: [] });
    expect(config.umpDebugGeography).toBeUndefined();
  });
});
