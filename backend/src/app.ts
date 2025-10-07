import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { exec } from 'child_process'
import authRoutes from './routes/auth'
import meRoutes from './routes/me'
import settingsRoutes from './routes/settings'
import projectRoutes from './routes/projects'
import folderRoutes from './routes/folders'
import chatRoutes from './routes/chat'
import widgetRoutes from './routes/widget'
import { authLimiter, chatLimiter } from './middleware/rateLimit'
import { errorHandler } from './middleware/error'

dotenv.config({ path: path.resolve('.env') })

const app = express()
// In development we disable helmet's contentSecurityPolicy because it can be
// overly restrictive (default-src 'none') and block DevTools/.well-known
// requests. Keep CSP enabled in production.
if (process.env.NODE_ENV === 'production') {
  app.use(helmet())
} else {
  app.use(helmet({ contentSecurityPolicy: false }))
}
app.use(express.json({ limit: '2mb' }))

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL // e.g., https://aichatbot-yd2o.onrender.com
const isProd = process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true'
// Resolve the frontend build directory robustly across ts-node (src) and compiled (dist)
function resolveFrontendDist(): string {
  if (process.env.FRONTEND_DIST_PATH) {
    return path.resolve(process.env.FRONTEND_DIST_PATH)
  }
  const byCwd = path.resolve(process.cwd(), 'frontend', 'dist')
  if (fs.existsSync(byCwd)) return byCwd
  const bySrc = path.resolve(__dirname, '..', '..', 'frontend', 'dist')
  if (fs.existsSync(bySrc)) return bySrc
  const byDist = path.resolve(__dirname, '..', '..', '..', 'frontend', 'dist')
  return byDist
}
const FRONTEND_DIST = resolveFrontendDist()
const WIDGET_ALLOWED_ORIGINS = (process.env.WIDGET_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)

// CORS: allow configured frontend, widget origins, and same-origin backend
const allowedOrigins = new Set([
  FRONTEND_URL,
  BACKEND_URL,
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  RENDER_EXTERNAL_URL,
  ...WIDGET_ALLOWED_ORIGINS,
].filter(Boolean))

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true)
      if (allowedOrigins.has(origin)) return cb(null, true)
      return cb(new Error('CORS blocked'), false)
    },
    credentials: true,
  })
)

// Static widget assets: serve the single widget.js file directly
app.get('/widget.js', (_req, res) => {
  return res.sendFile(path.resolve(process.cwd(), 'backend', 'public', 'widget.js'))
})

// Serve built frontend in production
if (isProd) {
  // Serve static files from the frontend build directory
  app.use(express.static(FRONTEND_DIST))

  // Catch-all route to serve the frontend's index.html for client-side routing.
  // Exclude API and widget paths so they are handled by their routes above.
  app.get('*', (req, res, next) => {
    const p = req.path
    if (
      p.startsWith('/auth') ||
      p.startsWith('/me') ||
      p.startsWith('/settings') ||
      p.startsWith('/projects') ||
      p.startsWith('/folders') ||
      p.startsWith('/chat') ||
      p.startsWith('/widget') ||
      p.startsWith('/widget.js')
    ) {
      return next()
    }
    return res.sendFile(path.join(FRONTEND_DIST, 'index.html'))
  })
}
// Routes
app.use('/auth', authLimiter, authRoutes)
app.use('/me', meRoutes)
app.use('/settings', settingsRoutes)
app.use('/projects', projectRoutes)
app.use('/folders', folderRoutes)
app.use('/chat', chatLimiter, chatRoutes)
app.use('/widget', widgetRoutes)

// Widget layout
app.get(['/widget-layout', '/widget'], (req, res) => {
  const q = new URLSearchParams(req.query as any).toString()
  if (isProd) {
    // Serve the SPA entry; route is handled client-side
    return res.sendFile(path.join(FRONTEND_DIST, 'index.html'))
  }
  const url = `${FRONTEND_URL}/widget-layout${q ? `?${q}` : ''}`
  res.redirect(url)
})

// Note: a single catch-all above is sufficient when isProd; avoid duplicates.

app.use(errorHandler)

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT} (prod=${isProd})`)
  if (isProd) {
    // eslint-disable-next-line no-console
    console.log(`Serving frontend from: ${FRONTEND_DIST}`)
  }
  // Auto-open the UI when serving the frontend from the backend
  const shouldOpen = process.env.SERVE_FRONTEND === 'true' || process.env.OPEN_BROWSER === 'true'
  const urlToOpen = isProd ? `http://localhost:${PORT}` : FRONTEND_URL
  if (shouldOpen) {
    const platform = process.platform
    const cmd = platform === 'win32' ? `start "" "${urlToOpen}"` : platform === 'darwin' ? `open "${urlToOpen}"` : `xdg-open "${urlToOpen}` + `"`
    exec(cmd, (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to open browser:', err.message)
      }
    })
  }
})
