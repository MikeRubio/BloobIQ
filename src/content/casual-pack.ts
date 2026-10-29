import type { CasualContentItem, CasualPack, QuizCategoryId } from '@/backend/types';
import type { QuizQuestion } from '@/game/types';

const validDifficulties = new Set(['easy', 'medium', 'hard']);

export function parseCasualPack(value: unknown, expectedCategory: QuizCategoryId): CasualPack {
  if (!value || typeof value !== 'object') throw new Error('The quiz service returned an invalid pack.');
  const candidate = value as Partial<CasualPack>;
  if (candidate.categoryId !== expectedCategory || typeof candidate.contentVersion !== 'string' || !candidate.contentVersion) {
    throw new Error('The quiz service returned the wrong content pack.');
  }
  if (!Array.isArray(candidate.items) || candidate.items.length < 4) throw new Error('This quiz pack is not currently playable.');

  const items = candidate.items.map((raw) => {
    const item = raw as Partial<CasualContentItem>;
    if (
      typeof item.id !== 'string' || !item.id || typeof item.displayName !== 'string' || !item.displayName ||
      typeof item.assetPath !== 'string' || !item.assetPath || typeof item.difficulty !== 'string' ||
      !validDifficulties.has(item.difficulty) || (item.contentType !== null && typeof item.contentType !== 'string')
    ) throw new Error('The quiz service returned incomplete content.');
    if (item.distractorIds != null && (!Array.isArray(item.distractorIds) || item.distractorIds.some((id) => typeof id !== 'string'))) {
      throw new Error('The quiz service returned invalid distractors.');
    }
    return item as CasualContentItem;
  });

  if (new Set(items.map((item) => item.id)).size !== items.length) throw new Error('The quiz pack contains duplicate identities.');
  if (new Set(items.map((item) => item.displayName)).size !== items.length) throw new Error('The quiz pack contains duplicate answer names.');
  return { categoryId: expectedCategory, contentVersion: candidate.contentVersion, items };
}

export function casualPackQuestions(pack: CasualPack, assetUrl: (path: string) => string | null): QuizQuestion[] {
  return pack.items.map((item) => {
    const byId = new Map(pack.items.map((candidate) => [candidate.id, candidate]));
    const specified = (item.distractorIds ?? []).map((id) => byId.get(id)).filter((candidate): candidate is CasualContentItem => Boolean(candidate && candidate.id !== item.id));
    const specifiedIds = new Set(specified.map((candidate) => candidate.id));
    const sameType = pack.items.filter((other) => other.id !== item.id && other.contentType === item.contentType);
    const fallback = pack.items.filter((other) => other.id !== item.id && other.contentType !== item.contentType && !specifiedIds.has(other.id));
    const assetUri = assetUrl(item.assetPath);
    if (!assetUri) throw new Error('Quiz images are unavailable. Check the app configuration and try again.');
    const revealAssetUri = item.revealAssetPath ? assetUrl(item.revealAssetPath) : assetUri;
    if (!revealAssetUri) throw new Error('Quiz reveal images are unavailable. Check the app configuration and try again.');
    return {
      id: item.id,
      categoryId: pack.categoryId,
      displayName: item.displayName,
      assetKey: item.id,
      assetUri,
      revealAssetUri,
      prompt: item.prompt ?? undefined,
      questionDescription: item.questionDescription ?? undefined,
      contentType: item.contentType ?? undefined,
      difficulty: item.difficulty,
      distractorCandidates: [...specified, ...sameType.filter((other) => !specifiedIds.has(other.id)), ...fallback].map((other) => other.id),
      provenance: { sourceName: 'BloopIQ hosted catalogue', sourceUrl: assetUri, license: 'Reviewed quiz identity artwork' },
    };
  });
}
