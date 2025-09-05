/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import adminAuthRoutes from './routes/admin/auth';
import adminCnpjsRoutes from './routes/admin/cnpjs';
import adminLigadoresRoutes from './routes/admin/ligadores';
import ligadorCnpjsRoutes from './routes/ligador/cnpjs';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();


const app: express.Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Content-Type: ${req.headers['content-type']} - Content-Length: ${req.headers['content-length']}`)
  if (req.path.includes('test-distribute')) {
    console.log('🎯 REQUISIÇÃO PARA TEST-DISTRIBUTE DETECTADA!')
    console.log('🎯 Headers completos:', req.headers)
  }
  next()
})

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

/**
 * API Routes
 */
// Rotas de autenticação centralizadas
app.use('/api/auth', authRoutes);

// Rotas administrativas
app.use('/api/admin', adminRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/cnpjs', adminCnpjsRoutes);
app.use('/api/admin/ligadores', adminLigadoresRoutes);

// Rotas do ligador
app.use('/api/ligador/cnpjs', ligadorCnpjsRoutes);

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;