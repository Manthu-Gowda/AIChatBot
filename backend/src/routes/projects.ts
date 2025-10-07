import { Router } from 'express'
import { prisma } from '../prisma/client'
import { AuthRequest, requireAuth } from '../middleware/auth'
import { projectCreateSchema } from '../utils/validator'
import { upload } from '../utils/upload'
import { createEmbeddingsForFile } from '../services/rag/embed'

const router = Router()

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = projectCreateSchema.parse(req.body)
    const project = await prisma.project.create({ data: { userId: req.user!.id, ...data } })
    res.json(project)
  } catch (e) { next(e) }
})

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } })
    res.json(projects)
  } catch (e) { next(e) }
})

router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const p = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user!.id }, include: { files: true } })
    if (!p) return res.status(404).json({ error: { message: 'Not found' } })
    res.json(p)
  } catch (e) { next(e) }
})

router.put('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = projectCreateSchema.partial().parse(req.body)
    const p = await prisma.project.update({ where: { id: req.params.id }, data })
    res.json(p)
  } catch (e) { next(e) }
})

router.delete('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.post('/:id/files', requireAuth, upload.array('files'), async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user!.id } })
    if (!project) return res.status(404).json({ error: { message: 'Not found' } })
    const files = (req.files as Express.Multer.File[] | undefined) || []
    const created = await Promise.all(
      files.map(async (f) => {
        const pf = await prisma.projectFile.create({
          data: { projectId: project.id, filename: f.originalname, mimetype: f.mimetype, path: f.path },
        })
        // Optional embeddings (stub)
        await createEmbeddingsForFile(project.id, f.path)
        return pf
      })
    )
    res.json({ files: created })
  } catch (e) { next(e) }
})

export default router

