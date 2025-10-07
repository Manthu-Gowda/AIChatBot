import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me'

export function signJwt(payload: object, opts?: jwt.SignOptions) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', ...(opts || {}) })
}

export function verifyJwt<T = any>(token: string, opts?: jwt.VerifyOptions): T {
  return jwt.verify(token, JWT_SECRET, opts) as T
}

