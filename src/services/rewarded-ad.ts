export type RewardedAdEvent = 'earned' | 'closed' | 'failed';
export type RewardAttemptResult = 'earned' | 'cancelled' | 'failed';

export interface RewardedAdService {
  readonly label: string;
  show(onEvent: (event: RewardedAdEvent) => void): Promise<void>;
}

const CLOSE_GRACE_MS = 200;

/** Resolves the full-screen lifecycle once while granting only an earned callback. */
export async function runRewardedAd(service: RewardedAdService, onEarned: () => void): Promise<RewardAttemptResult> {
  return new Promise((resolve) => {
    let settled = false;
    let earned = false;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;
    const settle = (result: RewardAttemptResult) => {
      if (settled) return;
      settled = true;
      if (closeTimer) clearTimeout(closeTimer);
      resolve(result);
    };
    const event = (next: RewardedAdEvent) => {
      if (settled) return;
      if (next === 'earned') {
        if (!earned) { earned = true; onEarned(); }
        return;
      }
      if (next === 'failed') return settle(earned ? 'earned' : 'failed');
      closeTimer = setTimeout(() => settle(earned ? 'earned' : 'cancelled'), CLOSE_GRACE_MS);
    };
    service.show(event).catch(() => settle(earned ? 'earned' : 'failed'));
  });
}

export class SimulatedRewardedAdService implements RewardedAdService {
  readonly label = 'Development ad simulator';

  constructor(
    private readonly outcome: RewardAttemptResult,
    private readonly delayMs = 0,
    private readonly duplicateReward = false,
    private readonly closeBeforeReward = false,
  ) {}

  async show(onEvent: (event: RewardedAdEvent) => void): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    if (this.outcome === 'failed') return onEvent('failed');
    if (this.outcome === 'cancelled') return onEvent('closed');
    if (this.closeBeforeReward) onEvent('closed');
    onEvent('earned');
    if (this.duplicateReward) onEvent('earned');
    if (!this.closeBeforeReward) onEvent('closed');
  }
}
