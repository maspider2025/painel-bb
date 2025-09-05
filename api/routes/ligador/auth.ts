import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../../lib/supabase';

const router = express.Router();

// Login do ligador
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e senha são obrigatórios' });
    }

    // Buscar ligador no banco
    const { data: ligador, error } = await supabaseAdmin
      .from('ligadores')
      .select('*')
      .eq('username', username)
      .eq('ativo', true)
      .single();

    if (error || !ligador) {
      return res.status(401).json({ error: 'Credenciais inválidas ou usuário inativo' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, ligador.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = jwt.sign({
      id: ligador.id,
      username: ligador.username,
      role: 'ligador'
    }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: {
        id: ligador.id,
        username: ligador.username,
        nome: ligador.nome,
        cnpjs_diarios: ligador.cnpjs_diarios
      }
    });
  } catch (error) {
    console.error('Erro no login ligador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar token
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    res.json({ success: true, message: 'Token válido' });
  } catch (error) {
    console.error('Erro na verificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;