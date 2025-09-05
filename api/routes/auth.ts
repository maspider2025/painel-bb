/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement register logic
});

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement login logic
});

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement logout logic
});

// Login admin
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password, username } = req.body
    
    // Se veio username em vez de email, usar username como email
    const emailToUse = email || username;
    
    if (!emailToUse || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' })
    }
    
    // Buscar admin no banco
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, nome, password_hash')
      .eq('email', emailToUse)
      .single()
    
    if (error || !admin) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }
    
    const isValidPassword = await bcrypt.compare(password, admin.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }
    
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    )
    
    res.json({ token, user: { id: admin.id, email: admin.email, nome: admin.nome, role: 'admin' } })
  } catch (error) {
    console.error('Erro no login admin:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Login ligador
router.post('/ligador/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e senha são obrigatórios' })
    }
    
    // Buscar ligador no banco
    const { data: ligador, error } = await supabaseAdmin
      .from('ligadores')
      .select('id, username, nome, password_hash, ativo')
      .eq('username', username)
      .single()
    
    if (error || !ligador) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }
    
    if (!ligador.ativo) {
      return res.status(401).json({ error: 'Conta desativada' })
    }
    
    const isValidPassword = await bcrypt.compare(password, ligador.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }
    
    const token = jwt.sign(
      { id: ligador.id, username: ligador.username, nome: ligador.nome, role: 'ligador' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    )
    
    res.json({ 
      token, 
      user: { 
        id: ligador.id, 
        username: ligador.username, 
        nome: ligador.nome, 
        role: 'ligador' 
      } 
    })
  } catch (error) {
    console.error('Erro no login ligador:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router;