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
import inquiryRoutes from './routes/inquiry'
import { prisma } from './prisma/client'
import configRoutes from './routes/config'
import { authLimiter, chatLimiter } from './middleware/rateLimit'
import { errorHandler } from './middleware/error'

dotenv.config({ path: path.resolve('.env') })
// Fallback: when started from repo root, also try backend/.env if needed
if (!process.env.DATABASE_URL) {
  const backendEnv = path.resolve(process.cwd(), 'backend', '.env')
  try { if (fs.existsSync(backendEnv)) dotenv.config({ path: backendEnv }) } catch {}
}

// --- Startup environment validation: fail fast with a helpful message ---
function checkRequiredEnvVars() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY']
  const missing = required.filter(k => !process.env[k])
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error('\nFATAL: Missing required environment variables:')
    // eslint-disable-next-line no-console
    console.error(missing.map(m => ` - ${m}`).join('\n'))
    // Helpful guidance
    // eslint-disable-next-line no-console
    console.error('\nIf you are running on Render: open your service in the Render dashboard -> Environment -> Add the variables (DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY)')
    // eslint-disable-next-line no-console
    console.error('If running locally, create a .env file in the backend folder or the repository root with these values.')
    // eslint-disable-next-line no-console
    console.error('The deployment post-deploy step (prisma db push) requires DATABASE_URL to be present at deploy time.')
    process.exit(1)
  }
}

checkRequiredEnvVars()

const app = express()

app.get('/version', (req, res) => {
  res.json({ version: 'ProjectLinkDebug-v1', timestamp: new Date().toISOString() })
})

// In development we disable helmet's contentSecurityPolicy because it can be
// overly restrictive (default-src 'none') and block DevTools/.well-known
// requests. Keep CSP enabled in production.
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:", "blob:"],
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
        "connect-src": ["'self'", "https:", "wss:"], // Allow WebSocket if needed
      },
    },
  }))
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
// Normalize configured widget origins: split, trim whitespace and trailing slashes
function normalizeOrigin(raw?: string) {
  if (!raw) return ''
  return raw.trim().replace(/\/+$|:\/\/$/g, '').replace(/\/$/, '')
}
const rawWidgetAllowed = process.env.WIDGET_ALLOWED_ORIGINS || ''
const WIDGET_ALLOWED_ORIGINS = rawWidgetAllowed.split(',').map(s => s.trim()).map(s => s.replace(/\/+$/, '')).filter(Boolean)
// Normalize RENDER_EXTERNAL_URL (remove trailing slash if present)
const RENDER_EXTERNAL_URL_NORMALIZED = RENDER_EXTERNAL_URL ? String(RENDER_EXTERNAL_URL).replace(/\/+$/, '') : undefined

// CORS: allow configured frontend, widget origins, and same-origin backend
const allowedOrigins = new Set([
  FRONTEND_URL,
  BACKEND_URL,
  'http://localhost:4000',
  'http://127.0.0.1:4000',
  RENDER_EXTERNAL_URL,
  ...WIDGET_ALLOWED_ORIGINS,
].filter(Boolean))

app.use((req, res, next) => {
  cors({
    origin: function (origin, cb) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return cb(null, true)
      
      // Always allow widget routes
      if (req.path.startsWith('/widget')) {
        return cb(null, true)
      }

      // Check allowed origins for other routes
      if (allowedOrigins.has(origin)) return cb(null, true)
      return cb(new Error('CORS blocked'), false)
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })(req, res, next)
})

// Static widget assets: serve the single widget.js file directly (robust path resolution)
function resolveWidgetScript(): string {
  const candidates = [
    path.resolve(process.cwd(), 'backend', 'public', 'widget.js'),
    path.resolve(process.cwd(), 'public', 'widget.js'),
    path.resolve(__dirname, '..', '..', 'public', 'widget.js'), // when running from compiled dist
    path.resolve(__dirname, '..', '..', '..', 'public', 'widget.js'),
  ]
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p } catch {}
  }
  // Fallback to repo-style path
  return path.resolve(process.cwd(), 'backend', 'public', 'widget.js')
}
app.get('/widget.js', (_req, res) => {
  const file = resolveWidgetScript()
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  res.setHeader('Access-Control-Allow-Origin', '*')
  return res.sendFile(file)
})

// Serve built frontend in production
if (isProd) {
  // Serve static files from the frontend build directory
  app.use(express.static(FRONTEND_DIST))

  app.get('*', (req, res, next) => {
    const accept = String(req.headers.accept || '')
    if (req.method === 'GET' && accept.includes('text/html')) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
      return res.sendFile(path.join(FRONTEND_DIST, 'index.html'))
    }
    return next()
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
app.use('/widget', inquiryRoutes) // Mount inquiry routes (otp, inquiry) under /widget
app.use('/config', configRoutes)

// Widget layout (Allows iframe embedding)
app.get(['/widget-layout', '/widget'], async (req, res) => {
  const q = new URLSearchParams(req.query as any).toString()
  if (isProd) {
    // Serve the SPA entry; route is handled client-side
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    // Log request origin and referer for debugging CSP/frame-ancestors issues
    // This helps identify the actual embedding origin seen by the server.
    // NOTE: these logs may contain origins/hosts; do not paste secrets publicly.
    // eslint-disable-next-line no-console
    console.log('[Widget] Request headers - origin:', req.headers.origin, 'referer:', req.headers.referer, 'host:', req.get('host'))
    // Allow embedding in iframes from other origins (widget use-case)
    res.removeHeader('X-Frame-Options')
    // Loosen CSP frame-ancestors specifically for widget layout.
    // Always compute a frame-ancestors value including the current Render URL
    // and any configured WIDGET_ALLOWED_ORIGINS so hosts embedding the widget
    // are explicitly allowed.
    res.removeHeader('Content-Security-Policy')
      const faParts = ["'self'"]
      if (RENDER_EXTERNAL_URL_NORMALIZED) faParts.push(RENDER_EXTERNAL_URL_NORMALIZED)
      if (WIDGET_ALLOWED_ORIGINS.length > 0) faParts.push(...WIDGET_ALLOWED_ORIGINS)
    // If the request includes a projectId, add that project's `projectLink` to allowed frame-ancestors
    const projectId = String((req.query as any).projectId || '')
    if (projectId) {
      try {
        const project = await prisma.project.findFirst({ where: { id: projectId }, select: { projectLink: true } })
        const pLink = project?.projectLink ? String(project.projectLink).replace(/\/+$/, '') : ''
        if (pLink) faParts.push(pLink)
      } catch (err) {
        console.error('[Widget] Failed to load project for CSP:', err)
      }
    }

    // DYNAMIC LOCALHOST SUPPORT
    // If the request comes from a localhost origin (IPv4 or IPv6 or 'localhost' hostname), allow it dynamically.
    // This allows users to test on any local port without configuring it.
    const reqOrigin = req.headers.origin || req.headers.referer
    if (reqOrigin) {
      try {
        const u = new URL(reqOrigin)
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '[::1]') {
          const originVal = `${u.protocol}//${u.host}` // protocol + host (host includes port)
          if (!faParts.includes(originVal)) {
            faParts.push(originVal)
            // eslint-disable-next-line no-console
            console.log(`[Widget] Dynamically allowed localhost origin: ${originVal}`)
          }
        }
      } catch (e) { /* ignore parse errors */ }
    }

    const fa = faParts.filter(Boolean).join(' ')
    if (faParts.length > 0) {
      res.setHeader('Content-Security-Policy', `frame-ancestors ${fa}`)
      console.log('[Widget] CSP Set:', `frame-ancestors ${fa}`)
    } else {
      console.log('[Widget] No origins configured for frame-ancestors; leaving CSP unset')
    }
      console.log('[Widget] Origins Configured:', faParts)
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
  console.log('Server started [v:ProjectLinkDebug]')
  if (isProd) {
    // eslint-disable-next-line no-console
    console.log(`Serving frontend from: ${FRONTEND_DIST}`)
  }
  // Auto-open the UI when serving the frontend from the backend (only in dev or if explicitly requested)
  // We disable this in production (isProd) to avoid 'xdg-open' errors on servers.
  const shouldOpen = !isProd && (process.env.SERVE_FRONTEND === 'true' || process.env.OPEN_BROWSER === 'true')
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
