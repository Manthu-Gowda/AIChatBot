import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: { id: string; email: string }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || ''
    // Debug: log whether an auth header was received (do not log token contents)
    // Remove or reduce logging in production.
    // eslint-disable-next-line no-console
    console.debug('requireAuth: Authorization header present=', !!header)
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!token) return res.status(401).json({ error: { message: 'Unauthorized' } })
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me') as any
    req.user = { id: payload.sub, email: payload.email }
    next()
  } catch {
    return res.status(401).json({ error: { message: 'Unauthorized' } })
  }
}

export function requireWidget(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    if (!token) return res.status(401).json({ error: { message: 'Unauthorized' } })
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me', { audience: 'widget' }) as any
    if (payload.aud !== 'widget') return res.status(401).json({ error: { message: 'Invalid widget token' } })
    req.user = { id: payload.userId, email: payload.email || '' }
    // Attach projectId optionally
    ;(req as any).projectId = payload.projectId
    next()
  } catch {
    return res.status(401).json({ error: { message: 'Unauthorized' } })
  }
}

