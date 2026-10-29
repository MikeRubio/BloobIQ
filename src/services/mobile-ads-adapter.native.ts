import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentPrivacyOptionsRequirementStatus,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import type { RewardedAdEvent, RewardedAdService } from './rewarded-ad';
import type { NativeAdsInitialization, NativeAdsQaConfig } from './mobile-ads-adapter';

let initialized: Promise<void> | null = null;

async function consentResult(canRequestAds: boolean, message?: string): Promise<NativeAdsInitialization> {
  const info = await AdsConsent.getConsentInfo();
  let requestNonPersonalizedAdsOnly = false;
  try {
    const gdprApplies = await AdsConsent.getGdprApplies();
    if (gdprApplies) requestNonPersonalizedAdsOnly = !(await AdsConsent.getUserChoices()).selectPersonalisedAds;
  } catch {
    requestNonPersonalizedAdsOnly = false;
  }
  return {
    canRequestAds,
    privacyOptionsRequired: info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    requestNonPersonalizedAdsOnly,
    message,
  };
}

async function startSdkIfAllowed(canRequestAds: boolean, qa?: NativeAdsQaConfig): Promise<void> {
  if (!canRequestAds) return;
  if (qa?.enabled && qa.mobileAdsTestDeviceIds.length) {
    await mobileAds().setRequestConfiguration({ testDeviceIdentifiers: qa.mobileAdsTestDeviceIds });
  }
  initialized ??= mobileAds().initialize().then(() => undefined);
  await initialized;
}

export async function initializeNativeAds(qa?: NativeAdsQaConfig): Promise<NativeAdsInitialization> {
  let info;
  let message: string | undefined;
  try {
    info = await AdsConsent.gatherConsent(qa?.enabled ? {
      debugGeography: qa.umpDebugGeography === 'EEA' ? AdsConsentDebugGeography.EEA : undefined,
      testDeviceIdentifiers: qa.umpTestDeviceIds,
    } : undefined);
  } catch (error) {
    message = error instanceof Error ? error.message : 'Consent refresh failed; the previous consent state is being used.';
    info = await AdsConsent.getConsentInfo();
  }
  await startSdkIfAllowed(info.canRequestAds, qa);
  return consentResult(info.canRequestAds, message);
}

export async function showNativePrivacyOptions(qa?: NativeAdsQaConfig): Promise<NativeAdsInitialization> {
  const info = await AdsConsent.showPrivacyOptionsForm();
  await startSdkIfAllowed(info.canRequestAds, qa);
  return consentResult(info.canRequestAds);
}

export async function resetNativeConsentForTesting(qa?: NativeAdsQaConfig): Promise<void> {
  if (!qa?.enabled) throw new Error('Consent reset is disabled in this build.');
  AdsConsent.reset();
}

class NativeRewardedAd implements RewardedAdService {
  readonly label = 'Google rewarded ad';
  private sink: ((event: RewardedAdEvent) => void) | null = null;
  private readonly unsubscribers: (() => void)[] = [];

  constructor(private readonly ad: RewardedAd) {}

  load(): Promise<void> {
    return new Promise((resolve, reject) => {
      let loaded = false;
      this.unsubscribers.push(
        this.ad.addAdEventListener(RewardedAdEventType.LOADED, () => { loaded = true; resolve(); }),
        this.ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => this.sink?.('earned')),
        this.ad.addAdEventListener(AdEventType.CLOSED, () => this.sink?.('closed')),
        this.ad.addAdEventListener(AdEventType.ERROR, (error) => {
          if (loaded) this.sink?.('failed'); else reject(error);
        }),
      );
      this.ad.load();
    });
  }

  async show(onEvent: (event: RewardedAdEvent) => void): Promise<void> {
    this.sink = onEvent;
    await this.ad.show({ immersiveModeEnabled: true });
  }

  destroy(): void {
    this.sink = null;
    this.unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
    this.ad.destroy();
  }
}

export async function createNativeRewardedAd(
  adUnitId: string,
  reference: string,
  requestNonPersonalizedAdsOnly: boolean,
): Promise<RewardedAdService & { destroy(): void }> {
  const service = new NativeRewardedAd(RewardedAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly,
    serverSideVerificationOptions: { userId: reference, customData: reference },
  }));
  await service.load();
  return service;
}
