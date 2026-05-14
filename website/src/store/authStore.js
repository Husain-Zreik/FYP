import { create } from 'zustand'
import * as authApi from '../api/auth'

export const useAuthStore = create((set) => ({
  user:            null,
  token:           localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  initialized:     false,

  // Called once on app mount — validates stored token against the API
  initialize: async () => {
    if (!localStorage.getItem('token')) {
      set({ initialized: true })
      return
    }
    try {
      const { data } = await authApi.me()
      set({ user: data, isAuthenticated: true, initialized: true })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, isAuthenticated: false, initialized: true })
    }
  },

  login: async (email, password) => {
    const { data } = await authApi.login(email, password)
    localStorage.setItem('token', data.token)
    set({ user: data.user, token: data.token, isAuthenticated: true })
  },

  logout: async () => {
    try { await authApi.logout() } catch { /* token already invalid */ }
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },
}))
