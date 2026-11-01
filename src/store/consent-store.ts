import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { NO_ACCESS, NOTICE_VERSION, type AccessState, type AgeChoice } from '../privacy/rules';
type ConsentStore = {
  age: AgeChoice; acceptedNoticeVersion: string | null; requestCode: string | null; requestCreatedAt: number | null; requestLinked: boolean;
  access: AccessState; checkedAt: number; hydrated: boolean; showGate: boolean;
  chooseAge: (age: AgeChoice) => void; setRequest: (code: string) => void;
  setAccess: (access: AccessState) => void; setHydrated: () => void; openGate: () => void; closeGate: () => void; reset: () => void;
};
export const useConsentStore = create<ConsentStore>()(persist((set) => ({
  age: 'unknown', acceptedNoticeVersion: null, requestCode: null, requestCreatedAt: null, requestLinked: false, access: NO_ACCESS, checkedAt: 0, hydrated: false, showGate: false,
  chooseAge: (age) => set((s) => ({ age: s.age === 'under18' ? 'under18' : age, acceptedNoticeVersion: NOTICE_VERSION, access: NO_ACCESS, checkedAt: 0 })),
  setRequest: (requestCode) => set({ requestCode, requestCreatedAt: Date.now(), requestLinked: false }),
  setAccess: (access) => set((s) => ({ access, checkedAt: Date.now(), requestLinked: s.requestLinked || access.kind === 'child' })),
  setHydrated: () => set({ hydrated: true }),
  openGate: () => set({ showGate: true }), closeGate: () => set({ showGate: false }),
  reset: () => set({ age: 'unknown', acceptedNoticeVersion: null, requestCode: null, requestCreatedAt: null, requestLinked: false, access: NO_ACCESS, checkedAt: 0, showGate: false }),
}), {
  name: 'bloopiq-online-permission-v1', storage: createJSONStorage(() => AsyncStorage),
  // An approval is always checked again with the server after a restart.
  partialize: ({ age, acceptedNoticeVersion, requestCode, requestCreatedAt, requestLinked }) => ({ age, acceptedNoticeVersion, requestCode, requestCreatedAt, requestLinked }),
  onRehydrateStorage: () => (state) => state?.setHydrated(),
}));
