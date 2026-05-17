import { create } from 'zustand'

/*
 * Lightweight UI state shared across components.
 * Currently holds the shelter pending-requests count so
 * ShelterLayout can show the badge without making its own API call.
 */
export const useUiStore = create((set) => ({
  shelterPendingCount: 0,
  setShelterPendingCount: (n) => set({ shelterPendingCount: n }),
}))
