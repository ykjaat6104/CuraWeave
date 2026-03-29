import { create } from 'zustand'

interface User {
  id: string
  email: string
  name?: string
  full_name?: string
  role: string
  clinic_id: string
}

interface AuthStore {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string, remember?: boolean) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: JSON.parse(localStorage.getItem('curaweave_user') || sessionStorage.getItem('curaweave_user') || 'null'),
  token: localStorage.getItem('curaweave_token') || sessionStorage.getItem('curaweave_token'),

  setAuth: (user, token, remember = true) => {
    if (remember) {
      localStorage.setItem('curaweave_token', token)
      localStorage.setItem('curaweave_user', JSON.stringify(user))
    } else {
      sessionStorage.setItem('curaweave_token', token)
      sessionStorage.setItem('curaweave_user', JSON.stringify(user))
    }
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('curaweave_token')
    localStorage.removeItem('curaweave_user')
    sessionStorage.removeItem('curaweave_token')
    sessionStorage.removeItem('curaweave_user')
    set({ user: null, token: null })
  },

  isAuthenticated: () => {
    const { token } = get()
    return !!token
  },
}))
