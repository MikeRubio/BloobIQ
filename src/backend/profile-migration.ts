import type { GuestProfilePayload } from './types';
import type { GuestProfile } from '@/store/profile-store';

export function backendProfileFromLocal(profile: GuestProfile): GuestProfilePayload {
  return { name: profile.name, avatar: profile.avatar, color: profile.color };
}
