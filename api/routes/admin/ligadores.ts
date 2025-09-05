import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { supabaseAdmin } from '../../lib/supabase';

interface AuthRequest extends express.Request {
  user?: {
    id: string;
    email?: string;
    username?: string;
    nome?: string;
    role: 'admin' | 'ligador';
  };
}

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);
router.use(requireAdmin);

// Listar todos os ligadores
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { data: ligadores, error } = await supabaseAdmin
      .from('ligadores')
      .select('id, username, nome, ativo, cnpjs_diarios, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar ligadores' });
    }

    res.json({ ligadores });
  } catch (error) {
    console.error('Erro ao listar ligadores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar novo ligador
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { username, nome, password, cnpjs_diarios = 200 } = req.body;

    if (!username || !nome || !password) {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }

    // Verificar se username já existe
    const { data: existingLigador } = await supabaseAdmin
      .from('ligadores')
      .select('id')
      .eq('username', username)
      .single();

    if (existingLigador) {
      return res.status(400).json({ error: 'Username já existe' });
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(password, 10);

    // Criar ligador
    const { data: ligador, error } = await supabaseAdmin
      .from('ligadores')
      .insert({
        username,
        nome,
        password_hash,
        cnpjs_diarios,
        ativo: true
      })
      .select('id, username, nome, ativo, cnpjs_diarios, created_at')
      .single();

    if (error) {
      console.error('Erro ao criar ligador:', error);
      return res.status(500).json({ error: 'Erro ao criar ligador' });
    }

    res.status(201).json({ ligador });
  } catch (error) {
    console.error('Erro ao criar ligador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar ligador
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { nome, ativo, cnpjs_diarios, password } = req.body;

    const updateData: any = {};
    
    if (nome !== undefined) updateData.nome = nome;
    if (ativo !== undefined) updateData.ativo = ativo;
    if (cnpjs_diarios !== undefined) updateData.cnpjs_diarios = cnpjs_diarios;
    
    // Se senha foi fornecida, fazer hash
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const { data: ligador, error } = await supabaseAdmin
      .from('ligadores')
      .update(updateData)
      .eq('id', id)
      .select('id, username, nome, ativo, cnpjs_diarios, updated_at')
      .single();

    if (error) {
      console.error('Erro ao atualizar ligador:', error);
      return res.status(500).json({ error: 'Erro ao atualizar ligador' });
    }

    if (!ligador) {
      return res.status(404).json({ error: 'Ligador não encontrado' });
    }

    res.json({ ligador });
  } catch (error) {
    console.error('Erro ao atualizar ligador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar ligador
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Verificar se ligador tem CNPJs atribuídos
    const { data: atribuicoes } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select('id')
      .eq('ligador_id', id);

    if (atribuicoes && atribuicoes.length > 0) {
      // Liberar CNPJs atribuídos
      const { error: updateCnpjsError } = await supabaseAdmin
        .from('cnpjs')
        .update({ status: 'disponivel', disponivel: true })
        .in('id', atribuicoes.map(a => a.id));

      // Remover atribuições
      await supabaseAdmin
        .from('cnpj_atribuicoes')
        .delete()
        .eq('ligador_id', id);
    }

    // Deletar ligador
    const { error } = await supabaseAdmin
      .from('ligadores')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar ligador:', error);
      return res.status(500).json({ error: 'Erro ao deletar ligador' });
    }

    res.json({ message: 'Ligador removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar ligador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter estatísticas de um ligador específico
router.get('/:id/stats', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Buscar estatísticas das atribuições do ligador
    const { data: atribuicoes } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select('status')
      .eq('ligador_id', id);

    if (!atribuicoes) {
      return res.json({
        cnpjs_atribuidos: 0,
        cnpjs_pendentes: 0,
        cnpjs_finalizados: 0,
        taxa_sucesso: 0
      });
    }

    const total = atribuicoes.length;
    const pendentes = atribuicoes.filter(a => a.status === 'pendente').length;
    const finalizados = atribuicoes.filter(a => a.status === 'agendou').length;
    const taxaSucesso = total > 0 ? Math.round((finalizados / total) * 100) : 0;

    const stats = {
      cnpjs_atribuidos: total,
      cnpjs_pendentes: pendentes,
      cnpjs_finalizados: finalizados,
      taxa_sucesso: taxaSucesso
    };

    res.json({ data: stats });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do ligador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Resetar CNPJs de um ligador (para nova distribuição)
router.post('/:id/reset', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Buscar CNPJs atuais do ligador
    const { data: atribuicoesAtuais } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select('cnpj_id')
      .eq('ligador_id', id);

    if (atribuicoesAtuais && atribuicoesAtuais.length > 0) {
      // Liberar CNPJs atuais
      await supabaseAdmin
        .from('cnpjs')
        .update({ status: 'disponivel', disponivel: true })
        .in('id', atribuicoesAtuais.map(a => a.cnpj_id));

      // Remover atribuições atuais
      await supabaseAdmin
        .from('cnpj_atribuicoes')
        .delete()
        .eq('ligador_id', id);
    }

    // Buscar dados do ligador para saber quantos CNPJs atribuir
    const { data: ligador } = await supabaseAdmin
      .from('ligadores')
      .select('cnpjs_diarios')
      .eq('id', id)
      .single();

    const quantidadeCnpjs = ligador?.cnpjs_diarios || 200;

    // Buscar novos CNPJs disponíveis
    const { data: novos_cnpjs } = await supabaseAdmin
      .from('cnpjs')
      .select('id')
      .eq('status', 'disponivel')
      .eq('disponivel', true)
      .limit(quantidadeCnpjs);

    if (novos_cnpjs && novos_cnpjs.length > 0) {
      // Criar novas atribuições
      const novasAtribuicoes = novos_cnpjs.map(cnpj => ({
        ligador_id: id,
        cnpj_id: cnpj.id,
        status: 'pendente'
      }));

      await supabaseAdmin
        .from('cnpj_atribuicoes')
        .insert(novasAtribuicoes);

      // Atualizar status dos CNPJs
      await supabaseAdmin
        .from('cnpjs')
        .update({ status: 'atribuido', disponivel: false })
        .in('id', novos_cnpjs.map(c => c.id));
    }

    res.json({ 
      message: 'CNPJs resetados com sucesso',
      novos_cnpjs: novos_cnpjs?.length || 0
    });
  } catch (error) {
    console.error('Erro ao resetar CNPJs:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;