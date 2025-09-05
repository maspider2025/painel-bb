import { Router, Request } from 'express'
import { supabaseAdmin } from '../../lib/supabase'
import jwt from 'jsonwebtoken'

interface AuthRequest extends Request {
  user?: {
    id: string
    email?: string
    username?: string
    role: string
  }
}

// Middleware de autenticação
const authenticateToken = (req: AuthRequest, res: any, next: any) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' })
    }
    req.user = user
    next()
  })
}

const router = Router()

// Listar CNPJs do ligador
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const ligadorId = req.user?.id
    
    if (!ligadorId) {
      return res.status(401).json({ error: 'Token inválido' })
    }
    
    // Buscar CNPJs atribuídos ao ligador
    console.log('🔍 Buscando CNPJs para ligador:', ligadorId)
    const { data: atribuicoes, error } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select(`
        id,
        status,
        anotacoes,
        data_atribuicao,
        cnpjs (
          id,
          numero,
          cnpj_formatado,
          razao_social,
          nome_fantasia,
          situacao_cadastral,
          data_situacao_cadastral,
          data_inicio_atividade,
          atividade_principal,
          atividades_secundarias,
          natureza_juridica,
          porte,
          capital_social,
          endereco_completo,
          telefone,
          telefone2,
          email,
          dados_completos,
          api_atualizado_em
        )
      `)
      .eq('ligador_id', ligadorId)
      .order('data_atribuicao', { ascending: false })
    
    if (error) {
      console.error('❌ Erro ao buscar CNPJs:', error)
      return res.status(500).json({ error: 'Erro ao buscar CNPJs', details: error.message })
    }
    
    console.log('✅ CNPJs encontrados:', atribuicoes?.length || 0)
    
    // Formatar dados para o frontend
    const cnpjs = atribuicoes?.map((atribuicao: any) => ({
      id: atribuicao.id,
      cnpj_id: atribuicao.cnpjs?.id,
      cnpj: atribuicao.cnpjs?.numero,
      cnpj_formatado: atribuicao.cnpjs?.cnpj_formatado,
      razao_social: atribuicao.cnpjs?.razao_social,
      nome_fantasia: atribuicao.cnpjs?.nome_fantasia,
      situacao_cadastral: atribuicao.cnpjs?.situacao_cadastral,
      data_situacao_cadastral: atribuicao.cnpjs?.data_situacao_cadastral,
      data_inicio_atividade: atribuicao.cnpjs?.data_inicio_atividade,
      atividade_principal: atribuicao.cnpjs?.atividade_principal,
      atividades_secundarias: atribuicao.cnpjs?.atividades_secundarias,
      natureza_juridica: atribuicao.cnpjs?.natureza_juridica,
      porte: atribuicao.cnpjs?.porte,
      capital_social: atribuicao.cnpjs?.capital_social,
      endereco_completo: atribuicao.cnpjs?.endereco_completo,
      telefone: atribuicao.cnpjs?.telefone,
      telefone2: atribuicao.cnpjs?.telefone2,
      email: atribuicao.cnpjs?.email,
      dados_completos: atribuicao.cnpjs?.dados_completos,
      api_atualizado_em: atribuicao.cnpjs?.api_atualizado_em,
      endereco: atribuicao.cnpjs?.endereco_completo, // Compatibilidade com frontend
      status: atribuicao.status,
      anotacoes: atribuicao.anotacoes,
      data_atribuicao: atribuicao.data_atribuicao
    })) || []
    
    console.log('📋 Dados formatados para frontend:', cnpjs.length, 'CNPJs')
    
    res.json({ cnpjs })
  } catch (error) {
    console.error('Erro ao listar CNPJs do ligador:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Atualizar status de um CNPJ
router.put('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { status, anotacoes } = req.body
    const ligadorId = req.user?.id
    
    if (!ligadorId) {
      return res.status(401).json({ error: 'Token inválido' })
    }
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' })
    }
    
    // Verificar se a atribuição pertence ao ligador
    const { data: atribuicao, error: checkError } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select('id, cnpj_id')
      .eq('id', id)
      .eq('ligador_id', ligadorId)
      .single()
    
    if (checkError || !atribuicao) {
      return res.status(404).json({ error: 'CNPJ não encontrado' })
    }
    
    // Atualizar status e anotações
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }
    if (anotacoes !== undefined) {
      updateData.anotacoes = anotacoes
    }
    
    const { data: updatedAtribuicao, error } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .update(updateData)
      .eq('id', id)
      .select('id, status, anotacoes')
      .single()
    
    if (error) {
      return res.status(500).json({ error: 'Erro ao atualizar status' })
    }
    
    // Registrar no histórico
    await supabaseAdmin
      .from('historico_ligacoes')
      .insert({
        ligador_id: ligadorId,
        cnpj_id: atribuicao.cnpj_id,
        status_anterior: 'pendente', // Poderia buscar o status anterior se necessário
        status_novo: status,
        anotacoes: anotacoes || null
      })
    
    res.json({ atribuicao: updatedAtribuicao })
  } catch (error) {
    console.error('Erro ao atualizar status do CNPJ:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter estatísticas do ligador
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const ligadorId = req.user?.id
    
    if (!ligadorId) {
      return res.status(401).json({ error: 'Token inválido' })
    }
    
    // Buscar estatísticas das atribuições
    const { data: atribuicoes } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select('status')
      .eq('ligador_id', ligadorId)
    
    if (!atribuicoes) {
      return res.json({
        total: 0,
        pendentes: 0,
        mordido: 0,
        nao_tem_bb: 0,
        nao_atende: 0,
        agendou: 0
      })
    }
    
    const stats = {
      total: atribuicoes.length,
      pendentes: atribuicoes.filter(a => a.status === 'pendente').length,
      mordido: atribuicoes.filter(a => a.status === 'mordido').length,
      nao_tem_bb: atribuicoes.filter(a => a.status === 'nao_tem_bb').length,
      nao_atende: atribuicoes.filter(a => a.status === 'nao_atende').length,
      agendou: atribuicoes.filter(a => a.status === 'agendou').length
    }
    
    res.json(stats)
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Solicitar novos CNPJs (substituir finalizados)
router.post('/renovar', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const ligadorId = req.user?.id
    
    if (!ligadorId) {
      return res.status(401).json({ error: 'Token inválido' })
    }
    
    // Buscar CNPJs finalizados (não pendentes)
    const { data: atribuicoesFinalizadas } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select('id, cnpj_id')
      .eq('ligador_id', ligadorId)
      .neq('status', 'pendente')
    
    if (!atribuicoesFinalizadas || atribuicoesFinalizadas.length === 0) {
      return res.json({ message: 'Nenhum CNPJ para renovar', novos_cnpjs: 0 })
    }
    
    const quantidadeParaRenovar = atribuicoesFinalizadas.length
    
    // Liberar CNPJs finalizados
    await supabaseAdmin
      .from('cnpjs')
      .update({ status: 'disponivel', disponivel: true })
      .in('id', atribuicoesFinalizadas.map(a => a.cnpj_id))
    
    // Remover atribuições finalizadas
    await supabaseAdmin
      .from('cnpj_atribuicoes')
      .delete()
      .in('id', atribuicoesFinalizadas.map(a => a.id))
    
    // Buscar novos CNPJs disponíveis
    const { data: novosCnpjs } = await supabaseAdmin
      .from('cnpjs')
      .select('id')
      .eq('status', 'disponivel')
      .eq('disponivel', true)
      .limit(quantidadeParaRenovar)
    
    if (novosCnpjs && novosCnpjs.length > 0) {
      // Criar novas atribuições
      const novasAtribuicoes = novosCnpjs.map(cnpj => ({
        ligador_id: ligadorId,
        cnpj_id: cnpj.id,
        status: 'pendente'
      }))
      
      await supabaseAdmin
        .from('cnpj_atribuicoes')
        .insert(novasAtribuicoes)
      
      // Atualizar status dos CNPJs
      await supabaseAdmin
        .from('cnpjs')
        .update({ status: 'atribuido', disponivel: false })
        .in('id', novosCnpjs.map(c => c.id))
    }
    
    res.json({
      message: 'CNPJs renovados com sucesso',
      removidos: quantidadeParaRenovar,
      novos_cnpjs: novosCnpjs?.length || 0
    })
  } catch (error) {
    console.error('Erro ao renovar CNPJs:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router