import axios from 'axios'
import { getBackendBaseUrl } from './baseUrl'

const BACKEND_URL = getBackendBaseUrl()

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
