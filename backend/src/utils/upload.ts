import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadDir = path.resolve('backend', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')
    cb(null, `${Date.now()}_${safe}`)
  },
})

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/x-markdown',
  ]
  if (!allowed.includes(file.mimetype)) return cb(new Error('Unsupported file type'))
  cb(null, true)
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } })

