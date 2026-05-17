import { create } from 'zustand'
import { getShelters } from '../api/shelters'
import { getUsers }    from '../api/users'

const STALE_MS = 5 * 60 * 1000  // 5 minutes — re-fetch if data is older than this

/**
 * Factory for a generic cached entity store.
 * Each store exposes:
 *   load(force?)  — fetch only if stale (or force=true)
 *   append(item)  — optimistically add after create
 *   update(id, item) — optimistically update after edit
 *   remove(id)    — optimistically remove after delete
 *   invalidate()  — mark stale so next load() re-fetches
 */
function createEntityStore(fetchFn) {
  return create((set, get) => ({
    items:       [],
    loading:     false,
    error:       null,
    lastFetched: null,

    async load(force = false) {
      const { lastFetched, loading } = get()
      if (loading) return                                          // already in flight
      if (!force && lastFetched && Date.now() - lastFetched < STALE_MS) return  // fresh enough

      set({ loading: true, error: null })
      try {
        const res = await fetchFn()
        set({ items: res.data ?? [], lastFetched: Date.now() })
      } catch (err) {
        set({ error: err.message ?? 'Failed to load.' })
      } finally {
        set({ loading: false })
      }
    },

    append:     (item)     => set(s => ({ items: [...s.items, item] })),
    update:     (id, item) => set(s => ({ items: s.items.map(d => d.id === id ? item : d) })),
    remove:     (id)       => set(s => ({ items: s.items.filter(d => d.id !== id) })),
    invalidate: ()         => set({ lastFetched: null }),          // force re-fetch on next load
  }))
}

export const useSheltersStore = createEntityStore(getShelters)
export const useAllUsersStore = createEntityStore(getUsers)
