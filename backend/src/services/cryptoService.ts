import crypto from 'crypto'

// AES-256-GCM encrypt/decrypt for provider keys
const keyHex = process.env.ENCRYPTION_KEY || ''
if (!keyHex) {
  // In dev we allow empty but warn (do not log secrets)
  // eslint-disable-next-line no-console
  console.warn('[warn] ENCRYPTION_KEY not set; using insecure default for dev')
}
const key = keyHex && keyHex.length === 64 ? Buffer.from(keyHex, 'hex') : crypto.createHash('sha256').update('insecure-dev-key').digest()

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.from(Buffer.concat([iv, tag, enc])).toString('base64')
}

export function decrypt(b64: string): string {
  const raw = Buffer.from(b64, 'base64')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const data = raw.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(data), decipher.final()])
  return dec.toString('utf8')
}

export function maskKey(key: string): string {
  if (!key) return ''
  const last4 = key.slice(-4)
  return `sk-****${last4}`
}

