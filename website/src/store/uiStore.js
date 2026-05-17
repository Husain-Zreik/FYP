import { create } from 'zustand'

export const useUiStore = create((set) => ({
  shelterPendingCount: 0,
  setShelterPendingCount: (n) => set({ shelterPendingCount: n }),

  shelterPendingNeedsCount: 0,
  setShelterPendingNeedsCount: (n) => set({ shelterPendingNeedsCount: n }),

  govPendingAidCount: 0,
  setGovPendingAidCount: (n) => set({ govPendingAidCount: n }),
}))
