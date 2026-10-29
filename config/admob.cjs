const GOOGLE_SAMPLE_IDS = {
  androidAppId: 'ca-app-pub-3940256099942544~3347511713',
  iosAppId: 'ca-app-pub-3940256099942544~1458002511',
  androidRewardedId: 'ca-app-pub-3940256099942544/5224354917',
  iosRewardedId: 'ca-app-pub-3940256099942544/1712485313',
};

const splitIdentifiers = (value) => (value ?? '').split(',').map((entry) => entry.trim()).filter(Boolean);

const required = (environment, name) => {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`This ads build requires ${name}.`);
  return value;
};

const resolveAdMobBuildConfig = (environment = process.env) => {
  const production = environment.EAS_BUILD_PROFILE === 'production' || environment.BLOOPIQ_ADS_ENV === 'production';
  const inventoryMode = environment.BLOOPIQ_ADS_INVENTORY ?? (production ? 'production' : 'test');
  const appIdMode = environment.BLOOPIQ_ADS_APP_ID_MODE ?? (production ? 'custom' : 'google-sample');
  if (inventoryMode !== 'test' && inventoryMode !== 'production') {
    throw new Error(`Unsupported BLOOPIQ_ADS_INVENTORY value: ${inventoryMode}.`);
  }
  if (appIdMode !== 'google-sample' && appIdMode !== 'custom') {
    throw new Error(`Unsupported BLOOPIQ_ADS_APP_ID_MODE value: ${appIdMode}.`);
  }

  const appIds = appIdMode === 'custom'
    ? {
        androidAppId: required(environment, 'ADMOB_ANDROID_APP_ID'),
        iosAppId: required(environment, 'ADMOB_IOS_APP_ID'),
      }
    : {
        androidAppId: GOOGLE_SAMPLE_IDS.androidAppId,
        iosAppId: GOOGLE_SAMPLE_IDS.iosAppId,
      };
  const inventory = inventoryMode === 'production'
    ? {
        androidRewardedId: required(environment, 'ADMOB_ANDROID_REWARDED_ID'),
        iosRewardedId: required(environment, 'ADMOB_IOS_REWARDED_ID'),
      }
    : {
        androidRewardedId: GOOGLE_SAMPLE_IDS.androidRewardedId,
        iosRewardedId: GOOGLE_SAMPLE_IDS.iosRewardedId,
      };
  const qaMode = !production && environment.BLOOPIQ_ADS_QA === 'true';

  return {
    mode: inventoryMode,
    appIdMode,
    qaMode,
    ...appIds,
    ...inventory,
    umpDebugGeography: qaMode && environment.BLOOPIQ_UMP_DEBUG_GEOGRAPHY === 'EEA' ? 'EEA' : undefined,
    umpTestDeviceIds: qaMode ? splitIdentifiers(environment.BLOOPIQ_UMP_TEST_DEVICE_IDS) : [],
    mobileAdsTestDeviceIds: qaMode ? splitIdentifiers(environment.BLOOPIQ_MOBILE_ADS_TEST_DEVICE_IDS) : [],
  };
};

module.exports = { GOOGLE_SAMPLE_IDS, resolveAdMobBuildConfig };
