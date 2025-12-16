
import { Router } from 'express'
import { Provider } from '@prisma/client'

const router = Router()

router.get('/providers', (req, res) => {
  res.json(Object.keys(Provider))
})

export default router
