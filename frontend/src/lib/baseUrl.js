export function getBackendBaseUrl() {
  // Prefer Vite-prefixed var, fall back to legacy BACKEND_URL if present
  const env = import.meta.env.VITE_BACKEND_URL || import.meta.env.BACKEND_URL
  // If an explicit env value is provided, use it (allow localhost too)
  if (env) {
    // Normalize trailing slash
    return env.replace(/\/+$/, '')
  }
  // In browser, default to current origin (useful when frontend is served by backend)
  if (typeof window !== 'undefined') return window.location.origin
  // Server-side / fallback
  return 'http://localhost:4000'
}

