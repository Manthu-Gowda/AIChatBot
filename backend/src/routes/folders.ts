import { Router } from 'express'
import { prisma } from '../prisma/client'
import { folderCreateSchema } from '../utils/validator'
import { AuthRequest, requireAuth } from '../middleware/auth'

const router = Router()

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = folderCreateSchema.parse(req.body)
    const folder = await prisma.folder.create({ data: { userId: req.user!.id, ...data } })
    res.json(folder)
  } catch (e) { next(e) }
})

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const folders = await prisma.folder.findMany({ where: { userId: req.user!.id } })
    res.json(folders)
  } catch (e) { next(e) }
})

export default router

