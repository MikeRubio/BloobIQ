import { describe, expect, it, vi } from 'vitest';
import { runRewardedAd, SimulatedRewardedAdService } from './rewarded-ad';

describe('rewarded ad gate', () => {
  it.each([
    ['earned', 1],
    ['cancelled', 0],
    ['failed', 0],
  ] as const)('handles %s without granting an incorrect reward', async (outcome, grants) => {
    const onEarned = vi.fn();
    await expect(runRewardedAd(new SimulatedRewardedAdService(outcome, 0), onEarned)).resolves.toBe(outcome);
    expect(onEarned).toHaveBeenCalledTimes(grants);
  });

  it('ignores a duplicate earned callback', async () => {
    const onEarned = vi.fn();
    await runRewardedAd(new SimulatedRewardedAdService('earned', 0, true), onEarned);
    expect(onEarned).toHaveBeenCalledTimes(1);
  });
});
