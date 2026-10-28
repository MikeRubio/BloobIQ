import { Asset } from 'expo-asset';
import { Image } from 'expo-image';
import { getQuizAssetUrl } from '@/backend/supabase';
import type { QuizCategoryId } from '@/backend/types';
import { flagAssets } from '@/content/flag-assets';
import { hostedAssetPathsByQuiz } from '@/content/hosted-assets';

export type PreloadProgress = { completed: number; total: number; label: string };

const bundledAssets = [
  ...Object.values(flagAssets),
  require('../../assets/images/bloopiq-splash-mark.png'),
  require('../../assets/sounds/correct.wav'),
  require('../../assets/sounds/wrong.wav'),
];

async function mapLimit<T>(values: readonly T[], limit: number, task: (value: T) => Promise<unknown>) {
  let next = 0;
  async function worker() {
    while (next < values.length) {
      const index = next++;
      await task(values[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
}

export async function preloadStartupAssets(onProgress?: (progress: PreloadProgress) => void) {
  const startupPaths = Object.values(hostedAssetPathsByQuiz).flatMap((paths) => paths.slice(0, 4));
  const remoteUrls = startupPaths.map(getQuizAssetUrl).filter((url): url is string => Boolean(url));
  const total = remoteUrls.length + 1;
  let completed = 0;
  const report = (label: string) => onProgress?.({ completed, total, label });

  report('Loading game assets');
  try { await Asset.loadAsync(bundledAssets); } catch { /* Bundled assets still resolve on demand. */ }
  completed += 1;
  report('Preparing quiz images');

  await mapLimit(remoteUrls, 5, async (url) => {
    try { await Image.prefetch(url); } catch { /* Remote images retry naturally when rendered. */ }
    completed += 1;
    report('Preparing quiz images');
  });

  report('Ready to play');
}

export async function preloadFriendCategory(categoryId: QuizCategoryId, onProgress?: (progress: PreloadProgress) => void) {
  const paths: readonly string[] = hostedAssetPathsByQuiz[categoryId];
  const urls = paths.map(getQuizAssetUrl).filter((url): url is string => Boolean(url));
  let completed = 0;
  onProgress?.({ completed, total: urls.length, label: `Preparing ${categoryId}` });
  await mapLimit(urls, 6, async (url) => {
    try { await Image.prefetch(url); } catch { /* Rendering retries unavailable assets. */ }
    completed += 1;
    onProgress?.({ completed, total: urls.length, label: `Preparing ${categoryId}` });
  });
}
