import { Router, type Request, type Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Middleware para verificar se é admin
const requireAdmin = (req: any, res: Response, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

// Middleware será aplicado individualmente nas rotas que precisam

// GET /api/admin/stats - Estatísticas do dashboard
router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Buscar estatísticas de ligadores
    const { data: ligadores, error: ligadoresError } = await supabaseAdmin
      .from('ligadores')
      .select('id, ativo')
      .order('created_at', { ascending: false });

    if (ligadoresError) {
      throw ligadoresError;
    }

    // Buscar estatísticas de CNPJs
    const { data: cnpjsTotal, error: cnpjsTotalError } = await supabaseAdmin
      .from('cnpjs')
      .select('id', { count: 'exact', head: true });

    const { data: cnpjsDisponiveis, error: cnpjsDisponiveisError } = await supabaseAdmin
      .from('cnpjs')
      .select('id', { count: 'exact', head: true })
      .eq('disponivel', true);

    const { data: cnpjsAtribuidos, error: cnpjsAtribuidosError } = await supabaseAdmin
      .from('cnpjs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'atribuido');

    if (cnpjsTotalError || cnpjsDisponiveisError || cnpjsAtribuidosError) {
      throw cnpjsTotalError || cnpjsDisponiveisError || cnpjsAtribuidosError;
    }

    const totalLigadores = ligadores?.length || 0;
    const ligadoresAtivos = ligadores?.filter(l => l.ativo).length || 0;
    const ligadoresInativos = totalLigadores - ligadoresAtivos;

    // Estatísticas completas
    const stats = {
      totalLigadores,
      ligadoresAtivos,
      ligadoresInativos,
      total_cnpjs: cnpjsTotal?.length || 0,
      cnpjs_disponiveis: cnpjsDisponiveis?.length || 0,
      cnpjs_atribuidos: cnpjsAtribuidos?.length || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/ligadores - Lista de ligadores
router.get('/ligadores', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: ligadores, error } = await supabaseAdmin
      .from('ligadores')
      .select('id, username, nome, ativo, cnpjs_diarios, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(ligadores || []);
  } catch (error) {
    console.error('Erro ao buscar ligadores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/admin/ligadores - Criar novo ligador
router.post('/ligadores', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, nome, password, cnpjs_diarios } = req.body;

    if (!username || !nome || !password) {
      res.status(400).json({ error: 'Username, nome e senha são obrigatórios' });
      return;
    }

    // Verificar se username já existe
    const { data: existingLigador } = await supabaseAdmin
      .from('ligadores')
      .select('id')
      .eq('username', username)
      .single();

    if (existingLigador) {
      res.status(400).json({ error: 'Username já existe' });
      return;
    }

    // Hash da senha
    const bcrypt = await import('bcryptjs');
    const password_hash = await bcrypt.hash(password, 10);

    // Criar ligador
    const { data: ligador, error } = await supabaseAdmin
      .from('ligadores')
      .insert({
        username,
        nome,
        password_hash,
        cnpjs_diarios: cnpjs_diarios || 0,
        ativo: true
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Remover password_hash da resposta
    const { password_hash: _, ...ligadorResponse } = ligador;
    res.status(201).json(ligadorResponse);
  } catch (error) {
    console.error('Erro ao criar ligador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/admin/ligadores/:id - Atualizar ligador
router.put('/ligadores/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { username, nome, password, cnpjs_diarios, ativo } = req.body;

    const updateData: any = {};

    if (username) updateData.username = username;
    if (nome) updateData.nome = nome;
    if (cnpjs_diarios !== undefined) updateData.cnpjs_diarios = cnpjs_diarios;
    if (ativo !== undefined) updateData.ativo = ativo;

    // Se senha foi fornecida, fazer hash
    if (password) {
      const bcrypt = await import('bcryptjs');
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    updateData.updated_at = new Date().toISOString();

    const { data: ligador, error } = await supabaseAdmin
      .from('ligadores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!ligador) {
      res.status(404).json({ error: 'Ligador não encontrado' });
      return;
    }

    // Remover password_hash da resposta
    const { password_hash: _, ...ligadorResponse } = ligador;
    res.json(ligadorResponse);
  } catch (error) {
    console.error('Erro ao atualizar ligador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/ligadores/:id - Deletar ligador
router.delete('/ligadores/:id', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('ligadores')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ message: 'Ligador deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar ligador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;