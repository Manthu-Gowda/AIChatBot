import { NextFunction, Request, Response } from 'express'

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500
  const message = err.message || 'Internal Server Error'
  const details = err.details || undefined
  // Log additional context to help debug static asset 500s
  // eslint-disable-next-line no-console
  console.error(`Error on ${req.method} ${req.path} -> ${status}: ${message}`)
  if (err.stack) {
    // eslint-disable-next-line no-console
    console.error(err.stack)
  }
  res.status(status).json({ error: { message, details } })
}

