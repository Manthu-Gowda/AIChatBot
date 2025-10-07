export function getBackendBaseUrl() {
  const env = import.meta.env.VITE_BACKEND_URL
  if (typeof window !== 'undefined') {
    if (env && !/^(http:\/\/localhost|http:\/\/127\.0\.0\.1)/i.test(env)) {
      return env
    }
    return window.location.origin
  }
  return env || 'http://localhost:4000'
}

