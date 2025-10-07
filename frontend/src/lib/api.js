import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4000')

export function getToken() { return localStorage.getItem('token') }
export function setToken(t) { localStorage.setItem('token', t) }
export function clearToken() { localStorage.removeItem('token') }

export const api = axios.create({ baseURL: BACKEND_URL })
api.interceptors.request.use((config) => {
  const t = getToken()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

export function mask(s) { if (!s) return ''; return s }
