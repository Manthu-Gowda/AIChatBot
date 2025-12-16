import { Router } from 'express'
import fs from 'fs'
import { prisma } from '../prisma/client'
import { AuthRequest, requireAuth } from '../middleware/auth'
import { projectCreateSchema } from '../utils/validator'
import { upload } from '../utils/upload'
import { createEmbeddingsForFile } from '../services/rag/embed'
import { scrapeWebsite } from '../services/scraper'

const router = Router()

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = projectCreateSchema.parse(req.body)
    let scrapedContent = ''
    if (data.websiteUrl) {
       try { scrapedContent = await scrapeWebsite(data.websiteUrl) } catch (e) { console.error(e) }
    }
    const project = await prisma.project.create({ data: { userId: req.user!.id, ...data, scrapedContent } })
    res.json(project)
  } catch (e) { next(e) }
})

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' } })
    // Enrich with file counts and total size (best-effort disk stat)
    const enriched = await Promise.all(projects.map(async (p: any) => {
      const filePaths = await prisma.projectFile.findMany({ where: { projectId: p.id }, select: { path: true } })
      let totalBytes = 0
      for (const f of filePaths) {
        try { const st = fs.statSync(f.path); totalBytes += st.size } catch {}
      }
      return { ...p, fileCount: filePaths.length, totalBytes }
    }))
    res.json(enriched)
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
    const existing = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user!.id } })
    if (!existing) return res.status(404).json({ error: { message: 'Not found' } })
    const p = await prisma.project.update({ where: { id: existing.id }, data })
    if (data.websiteUrl && data.websiteUrl !== existing.websiteUrl) {
       // Re-scrape if url changed
       try {
         const scrapedContent = await scrapeWebsite(data.websiteUrl)
         await prisma.project.update({ where: { id: existing.id }, data: { scrapedContent } })
         // TODO: Embeddings for scraped content
       } catch (e) { console.error(e) }
    }
    res.json(p)
  } catch (e) { next(e) }
})

router.delete('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user!.id }, include: { files: true } })
    if (!project) return res.status(404).json({ error: { message: 'Not found' } })
    // Remove uploaded files from disk (best-effort)
    for (const f of project.files) {
      try { if (f.path) fs.unlinkSync(f.path) } catch {}
    }
    // Delete file records then project
    await prisma.projectFile.deleteMany({ where: { projectId: project.id } })
    await prisma.project.delete({ where: { id: project.id } })
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

// Delete a single file from a project
router.delete('/:id/files/:fileId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, userId: req.user!.id } })
    if (!project) return res.status(404).json({ error: { message: 'Not found' } })
    const file = await prisma.projectFile.findFirst({ where: { id: req.params.fileId, projectId: project.id } })
    if (!file) return res.status(404).json({ error: { message: 'File not found' } })
    try { if (file.path) fs.unlinkSync(file.path) } catch {}
    await prisma.projectFile.delete({ where: { id: file.id } })
    return res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
