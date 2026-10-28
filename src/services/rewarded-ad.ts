export type RewardedAdEvent = 'earned' | 'cancelled' | 'failed';
export type RewardAttemptResult = RewardedAdEvent;

export interface RewardedAdService {
  readonly label: string;
  show(onEvent: (event: RewardedAdEvent) => void): Promise<void>;
}

export async function runRewardedAd(service: RewardedAdService, onEarned: () => void): Promise<RewardAttemptResult> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (event: RewardedAdEvent) => {
      if (settled) return;
      settled = true;
      if (event === 'earned') onEarned();
      resolve(event);
    };
    service.show(settle).catch(() => settle('failed'));
  });
}

export class SimulatedRewardedAdService implements RewardedAdService {
  readonly label = 'Development ad simulator';

  constructor(private readonly outcome: RewardedAdEvent, private readonly delayMs = 900, private readonly duplicateReward = false) {}

  async show(onEvent: (event: RewardedAdEvent) => void): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    onEvent(this.outcome);
    if (this.outcome === 'earned' && this.duplicateReward) onEvent('earned');
  }
}
