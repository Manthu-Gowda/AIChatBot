import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import path from 'path'
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
app.use(helmet())
app.use(express.json({ limit: '2mb' }))

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const isProd = process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true'
const FRONTEND_DIST = path.resolve('frontend', 'dist')
const WIDGET_ALLOWED_ORIGINS = (process.env.WIDGET_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true)
      if (origin === FRONTEND_URL || WIDGET_ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
      return cb(new Error('CORS blocked'), false)
    },
    credentials: true,
  })
)

// Static widget assets
app.use('/widget.js', express.static(path.resolve('backend/public/widget.js')))

// Serve built frontend in production
if (isProd) {
  app.use(express.static(FRONTEND_DIST))
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

// SPA fallback (after API and static). Exclude API/widget paths.
if (isProd) {
  app.get('*', (req, res, next) => {
    const p = req.path
    if (p.startsWith('/auth') || p.startsWith('/me') || p.startsWith('/settings') || p.startsWith('/projects') || p.startsWith('/folders') || p.startsWith('/chat') || p.startsWith('/widget') || p.startsWith('/widget.js')) {
      return next()
    }
    return res.sendFile(path.join(FRONTEND_DIST, 'index.html'))
  })
}

app.use(errorHandler)

const PORT = Number(process.env.PORT || 4000)
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${PORT} (prod=${isProd})`)
})
