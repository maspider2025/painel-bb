import { Router } from 'express'
import cnpjsRouter from './cnpjs'

const router = Router()

// Rotas de CNPJs do ligador
router.use('/cnpjs', cnpjsRouter)

export default router