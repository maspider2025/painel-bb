import express, { Router } from 'express'
import { authenticateToken, requireAdmin } from '../../middleware/auth'
import { supabaseAdmin } from '../../lib/supabase'
import multer from 'multer'
import * as XLSX from 'xlsx'
import cnpjApiService from '../../services/cnpjApiService.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);
router.use(requireAdmin);

// Listar CNPJs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = '1', limit = '10', status, search } = req.query
    
    // Primeiro, buscar todos os CNPJs sem filtro de status
    let baseQuery = supabaseAdmin
      .from('cnpjs')
      .select(`
        id,
        numero,
        razao_social,
        status,
        disponivel,
        created_at,
        updated_at,
        dados_completos,
        api_status
      `)
      .order('created_at', { ascending: false })
    
    if (search) {
      baseQuery = baseQuery.or(`numero.ilike.%${search}%,razao_social.ilike.%${search}%`)
    }

    const { data: allCnpjs, error: cnpjsError } = await baseQuery

    if (cnpjsError) {
      console.error('Erro ao buscar CNPJs:', cnpjsError)
      return res.status(500).json({ error: 'Erro ao buscar CNPJs' })
    }

    // Buscar todas as atribuições dos CNPJs encontrados
    const cnpjIds = allCnpjs?.map(cnpj => cnpj.id) || []
    let atribuicoes: any[] = []

    if (cnpjIds.length > 0) {
      const { data: atribuicoesData, error: atribuicoesError } = await supabaseAdmin
        .from('cnpj_atribuicoes')
        .select(`
          id,
          cnpj_id,
          status,
          anotacoes,
          data_atribuicao,
          updated_at,
          ligadores(
            id,
            nome,
            username
          )
        `)
        .in('cnpj_id', cnpjIds)
        .order('updated_at', { ascending: false })
      
      if (atribuicoesError) {
        console.error('Erro ao buscar atribuições:', atribuicoesError)
      } else {
        atribuicoes = atribuicoesData || []
      }
    }

    // Processar dados para mostrar status e informações atualizadas
    let processedCnpjs = allCnpjs?.map(cnpj => {
      // Buscar atribuições deste CNPJ específico
      const cnpjAtribuicoes = atribuicoes.filter(attr => attr.cnpj_id === cnpj.id)
      
      // Pegar a atribuição mais recente (já ordenadas por updated_at DESC)
      const atribuicao = cnpjAtribuicoes[0]
      
      return {
        ...cnpj,
        // Status atual (da atribuição se existir, senão do CNPJ)
        status_atual: atribuicao?.status || cnpj.status,
        // Anotações do ligador
        anotacoes: atribuicao?.anotacoes || null,
        // Informações do ligador
        ligador: atribuicao?.ligadores ? {
          id: atribuicao.ligadores.id,
          nome: atribuicao.ligadores.nome,
          username: atribuicao.ligadores.username
        } : null,
        // Data da última atualização
        ultima_atualizacao: atribuicao?.updated_at || cnpj.updated_at,
        // Data de atribuição
        data_atribuicao: atribuicao?.data_atribuicao || null
      }
    }) || []

    // Aplicar filtro de status após processar os dados
    if (status) {
      processedCnpjs = processedCnpjs.filter(cnpj => cnpj.status_atual === status)
    }

    // Aplicar paginação após filtrar
    const offset = (Number(page) - 1) * Number(limit)
    const paginatedCnpjs = processedCnpjs.slice(offset, offset + Number(limit))

    res.json({ cnpjs: paginatedCnpjs })
  } catch (error) {
    console.error('Erro interno:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Importar CNPJs via CSV/Excel
router.post('/import', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não fornecido' })
    }
    
    let cnpjsData: any[] = []
    
    // Processar arquivo Excel/CSV
    if (req.file.mimetype.includes('sheet') || req.file.originalname.endsWith('.xlsx') || req.file.originalname.endsWith('.xls')) {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      cnpjsData = XLSX.utils.sheet_to_json(worksheet)
    } else if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
      const csvText = req.file.buffer.toString('utf-8')
      const workbook = XLSX.read(csvText, { type: 'string' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      cnpjsData = XLSX.utils.sheet_to_json(worksheet)
    } else if (req.file.mimetype === 'text/plain' || req.file.originalname.endsWith('.txt')) {
      // Processar arquivo TXT (assumir formato delimitado por vírgula ou quebra de linha)
      const txtContent = req.file.buffer.toString('utf-8')
      const lines = txtContent.split('\n').filter(line => line.trim())
      
      cnpjsData = lines.map((line, index) => {
        const parts = line.split(',').map(part => part.trim())
        if (parts.length >= 2) {
          return {
            cnpj: parts[0],
            razao_social: parts[1]
          }
        } else {
          // Se não tem vírgula, assumir que é só o CNPJ
          return {
            cnpj: line.trim(),
            razao_social: `Empresa ${index + 1}`
          }
        }
      })
    } else if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
      // PDF não é suportado ainda, mas aceitar o arquivo
      return res.status(400).json({ 
        error: 'Arquivos PDF serão suportados em breve. Por favor, use CSV, TXT ou Excel por enquanto.' 
      })
    } else {
      return res.status(400).json({ error: 'Formato de arquivo não suportado. Use CSV, TXT, PDF ou Excel.' })
    }
    
    // Processar e validar CNPJs
    const cnpjsBasicos = cnpjsData.map(row => ({
      numero: String(row.cnpj || row.numero || row.CNPJ || '').replace(/[^0-9]/g, ''),
      razao_social_arquivo: String(row.razao_social || row.empresa || row.nome || ''),
    })).filter(cnpj => cnpj.numero.length === 14)
    
    if (cnpjsBasicos.length === 0) {
      return res.status(400).json({ error: 'Nenhum CNPJ válido encontrado no arquivo' })
    }
    
    console.log(`📥 Importando ${cnpjsBasicos.length} CNPJs e buscando dados da API externa...`)
    
    // Buscar dados da API externa para cada CNPJ
    const cnpjsComDados = []
    const errosApi = []
    
    for (let i = 0; i < cnpjsBasicos.length; i++) {
      const cnpjBasico = cnpjsBasicos[i]
      
      try {
        console.log(`🔍 Buscando dados do CNPJ ${i + 1}/${cnpjsBasicos.length}: ${cnpjBasico.numero}`)
        
        // Buscar dados na API externa
        const apiData = await cnpjApiService.fetchCNPJData(cnpjBasico.numero)
        const dadosProcessados = cnpjApiService.processApiData(apiData, cnpjBasico.numero)
        
        // Preparar dados para inserção no banco
        const cnpjCompleto = {
          numero: cnpjBasico.numero,
          cnpj_formatado: dadosProcessados.cnpj_formatado,
          razao_social: dadosProcessados.razao_social,
          nome_fantasia: dadosProcessados.nome_fantasia,
          situacao_cadastral: dadosProcessados.situacao_cadastral,
          data_situacao_cadastral: dadosProcessados.data_situacao_cadastral,
          data_inicio_atividade: dadosProcessados.data_inicio_atividade,
          atividade_principal: dadosProcessados.atividade_principal,
          atividades_secundarias: dadosProcessados.atividades_secundarias,
          natureza_juridica: dadosProcessados.natureza_juridica,
          porte: dadosProcessados.porte,
          capital_social: dadosProcessados.capital_social,
          endereco_completo: dadosProcessados.endereco_completo,
          telefone: dadosProcessados.telefone,
          telefone2: dadosProcessados.telefone2,
          email: dadosProcessados.email,
          socios: dadosProcessados.socios,
          dados_completos: dadosProcessados.dados_completos,
          api_status: 'success',
          status: 'disponivel',
          disponivel: true
        }
        
        cnpjsComDados.push(cnpjCompleto)
        
        // Delay entre requisições para respeitar rate limit
        if (i < cnpjsBasicos.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error) {
        console.error(`❌ Erro ao buscar CNPJ ${cnpjBasico.numero}:`, error.message)
        
        // Inserir CNPJ mesmo sem dados da API
        const cnpjSemApi = {
          numero: cnpjBasico.numero,
          razao_social: cnpjBasico.razao_social_arquivo || 'Não informado',
          api_status: 'error',
          status: 'disponivel',
          disponivel: true
        }
        
        cnpjsComDados.push(cnpjSemApi)
        errosApi.push({
          cnpj: cnpjBasico.numero,
          erro: error.message
        })
      }
    }
    
    // Inserir CNPJs no banco (ignorar duplicatas)
    const { data, error } = await supabaseAdmin
      .from('cnpjs')
      .upsert(cnpjsComDados, { onConflict: 'numero', ignoreDuplicates: true })
      .select()
    
    if (error) {
      console.error('❌ Erro ao inserir CNPJs no banco:', error)
      return res.status(500).json({ error: 'Erro ao inserir CNPJs no banco' })
    }
    
    const sucessos = cnpjsComDados.filter(c => c.api_status === 'success').length
    
    res.json({ 
      message: 'CNPJs importados com sucesso',
      imported: data?.length || 0,
      total_processed: cnpjsBasicos.length,
      api_sucessos: sucessos,
      api_erros: errosApi.length,
      erros_detalhes: errosApi
    })
  } catch (error) {
    console.error('Erro na importação:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Rota de teste para debug
router.post('/test-body', express.json(), authenticateToken, async (req, res) => {
  console.log('🧪 TESTE - Headers:', req.headers)
  console.log('🧪 TESTE - Content-Type:', req.headers['content-type'])
  console.log('🧪 TESTE - Body:', req.body)
  console.log('🧪 TESTE - Body stringified:', JSON.stringify(req.body))
  res.json({ received: req.body, success: true })
})

// Handler para OPTIONS (CORS preflight)
router.options('/test-distribute', (req, res) => {
  console.log('🧪 OPTIONS - CORS preflight para test-distribute')
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.sendStatus(200)
})

// Rota de teste específica para distribuição
router.post('/test-distribute', (req, res, next) => {
  console.log('🧪 MIDDLEWARE - Raw headers:', req.headers)
  console.log('🧪 MIDDLEWARE - Content-Length:', req.headers['content-length'])
  console.log('🧪 MIDDLEWARE - Content-Type:', req.headers['content-type'])
  
  // Aplicar express.json() manualmente
  express.json()(req, res, (err) => {
    if (err) {
      console.error('🧪 ERRO no express.json():', err)
      return res.status(400).json({ error: 'JSON parsing error' })
    }
    
    console.log('🧪 APÓS express.json() - Body:', req.body)
    console.log('🧪 APÓS express.json() - Body type:', typeof req.body)
    
    // Aplicar authenticateToken
    authenticateToken(req, res, (authErr) => {
      if (authErr) {
        console.error('🧪 ERRO na autenticação:', authErr)
        return res.status(401).json({ error: 'Authentication error' })
      }
      
      console.log('🧪 TESTE DISTRIBUIÇÃO - Headers:', req.headers)
      console.log('🧪 TESTE DISTRIBUIÇÃO - Content-Type:', req.headers['content-type'])
      console.log('🧪 TESTE DISTRIBUIÇÃO - Body:', req.body)
      console.log('🧪 TESTE DISTRIBUIÇÃO - distribuicoes:', req.body?.distribuicoes)
      
      res.json({ 
        message: 'Teste de distribuição funcionando!',
        received_distribuicoes: req.body?.distribuicoes,
        success: true 
      })
    })
  })
})

// Distribuir CNPJs com configuração manual - ALGORITMO INTELIGENTE SEM DUPLICATAS
router.post('/distribute-manual', express.json(), authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Distribuição manual - Headers:', req.headers)
    console.log('🔍 Distribuição manual - Body:', req.body)
    
    const { distribuicoes } = req.body
    
    if (!distribuicoes || !Array.isArray(distribuicoes) || distribuicoes.length === 0) {
      return res.status(400).json({ error: 'Configurações de distribuição são obrigatórias' })
    }
    
    // Validar estrutura das distribuições
    for (const dist of distribuicoes) {
      if (!dist.ligador_id || !dist.quantidade || dist.quantidade < 1) {
        return res.status(400).json({ error: 'Cada distribuição deve ter ligador_id e quantidade válidos' })
      }
    }
    
    // Verificar se há CNPJs disponíveis suficientes
    const totalSolicitado = distribuicoes.reduce((sum, dist) => sum + dist.quantidade, 0)
    
    // ALGORITMO INTELIGENTE: Buscar TODOS os CNPJs disponíveis de uma vez
    const { data: poolCnpjsDisponiveis, error: poolError } = await supabaseAdmin
      .from('cnpjs')
      .select('id, numero, razao_social')
      .eq('status', 'disponivel')
      .order('created_at', { ascending: true }) // Ordem consistente
    
    if (poolError) {
      console.error('❌ Erro ao buscar pool de CNPJs:', poolError)
      return res.status(500).json({ error: 'Erro ao buscar CNPJs disponíveis' })
    }
    
    const cnpjsDisponiveis = poolCnpjsDisponiveis?.length || 0
    
    if (cnpjsDisponiveis < totalSolicitado) {
      return res.status(400).json({ 
        error: `CNPJs insuficientes. Disponíveis: ${cnpjsDisponiveis}, Solicitados: ${totalSolicitado}` 
      })
    }
    
    console.log(`🎯 Iniciando distribuição inteligente: ${cnpjsDisponiveis} CNPJs disponíveis para ${distribuicoes.length} ligadores`)
    
    // DISTRIBUIÇÃO SEQUENCIAL SEM DUPLICATAS
    let cnpjIndex = 0
    const resultados = []
    const todasAtribuicoes = []
    const todosIdsParaAtualizar = []
    
    for (const { ligador_id, quantidade } of distribuicoes) {
      console.log(`👤 Processando ligador: ${ligador_id} - Quantidade: ${quantidade}`)
      
      // Verificar se ainda há CNPJs suficientes no pool
      const cnpjsRestantes = poolCnpjsDisponiveis.length - cnpjIndex
      const quantidadeReal = Math.min(quantidade, cnpjsRestantes)
      
      if (quantidadeReal === 0) {
        console.log(`⚠️ Nenhum CNPJ restante para ligador ${ligador_id}`)
        resultados.push({ 
          ligador_id, 
          quantidade_solicitada: quantidade, 
          quantidade_distribuida: 0, 
          erro: 'Pool de CNPJs esgotado' 
        })
        continue
      }
      
      // Pegar CNPJs sequenciais do pool (sem duplicatas)
      const cnpjsParaEsseLigador = poolCnpjsDisponiveis.slice(cnpjIndex, cnpjIndex + quantidadeReal)
      cnpjIndex += quantidadeReal
      
      console.log(`📋 Atribuindo ${quantidadeReal} CNPJs únicos para ligador ${ligador_id} (índices ${cnpjIndex - quantidadeReal} a ${cnpjIndex - 1})`)
      
      // Preparar atribuições para este ligador
      const atribuicoesLigador = cnpjsParaEsseLigador.map(cnpj => ({
        ligador_id: ligador_id,
        cnpj_id: cnpj.id,
        status: 'pendente',
        data_atribuicao: new Date().toISOString()
      }))
      
      // Adicionar às listas de operações em lote
      todasAtribuicoes.push(...atribuicoesLigador)
      todosIdsParaAtualizar.push(...cnpjsParaEsseLigador.map(c => c.id))
      
      resultados.push({ 
        ligador_id, 
        quantidade_solicitada: quantidade, 
        quantidade_distribuida: quantidadeReal,
        cnpjs_atribuidos: cnpjsParaEsseLigador.map(c => c.numero)
      })
      
      console.log(`✅ ${quantidadeReal} CNPJs únicos preparados para ligador ${ligador_id}`)
    }
    
    // OPERAÇÕES EM LOTE PARA EVITAR CONDIÇÕES DE CORRIDA
    console.log(`💾 Executando operações em lote: ${todasAtribuicoes.length} atribuições`)
    
    // Inserir todas as atribuições de uma vez
    const { error: atribuicaoError } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .insert(todasAtribuicoes)
    
    if (atribuicaoError) {
      console.error('❌ Erro ao criar atribuições em lote:', atribuicaoError)
      return res.status(500).json({ error: 'Erro ao criar atribuições: ' + atribuicaoError.message })
    }
    
    // Atualizar status de todos os CNPJs de uma vez
    const { error: updateError } = await supabaseAdmin
      .from('cnpjs')
      .update({ status: 'atribuido' })
      .in('id', todosIdsParaAtualizar)
    
    if (updateError) {
      console.error('❌ Erro ao atualizar status dos CNPJs:', updateError)
      return res.status(500).json({ error: 'Erro ao atualizar status: ' + updateError.message })
    }
    
    const totalDistribuido = todasAtribuicoes.length
    console.log(`🎉 Distribuição inteligente concluída! ${totalDistribuido} CNPJs únicos distribuídos sem duplicatas`)
    
    res.json({ 
      message: `CNPJs distribuídos com sucesso! Total: ${totalDistribuido} (sem duplicatas)`,
      distributed: totalDistribuido,
      algoritmo: 'distribuicao_inteligente_sem_duplicatas',
      resultados: resultados
    })
  } catch (error) {
    console.error('❌ Erro na distribuição manual:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Distribuir CNPJs automaticamente (rota original mantida para compatibilidade)
router.post('/distribute', express.json(), authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Headers recebidos:', req.headers)
    console.log('🔍 Content-Type:', req.headers['content-type'])
    console.log('🔍 Body completo:', req.body)
    console.log('🔍 Body stringified:', JSON.stringify(req.body))
    
    const { distribuicoes } = req.body
    
    if (!distribuicoes || !Array.isArray(distribuicoes) || distribuicoes.length === 0) {
      console.log('❌ Validação falhou - distribuicoes:', distribuicoes)
      console.log('❌ Tipo de distribuicoes:', typeof distribuicoes)
      return res.status(400).json({ error: 'Configurações de distribuição são obrigatórias' })
    }
    
    // Validar estrutura das distribuições
    for (const dist of distribuicoes) {
      if (!dist.ligador_id || !dist.quantidade || dist.quantidade < 1) {
        return res.status(400).json({ error: 'Cada distribuição deve ter ligador_id e quantidade válidos' })
      }
    }
    
    let totalDistributed = 0
    const resultados = []
    
    console.log(`🎯 Iniciando distribuição para ${distribuicoes.length} configurações`)
    
    for (const { ligador_id, quantidade } of distribuicoes) {
      console.log(`👤 Processando ligador: ${ligador_id} - Quantidade: ${quantidade}`)
      
      // Buscar CNPJs disponíveis OU atribuídos (permitir redistribuição)
      const { data: cnpjsDisponiveis, error: cnpjError } = await supabaseAdmin
        .from('cnpjs')
        .select('id, status')
        .or('status.eq.disponivel,status.eq.atribuido')
        .limit(quantidade)
      
      if (cnpjError) {
        console.error(`❌ Erro ao buscar CNPJs para ligador ${ligador_id}:`, cnpjError)
        resultados.push({ ligador_id, quantidade_solicitada: quantidade, quantidade_distribuida: 0, erro: 'Erro ao buscar CNPJs' })
        continue
      }
      
      if (!cnpjsDisponiveis?.length) {
        console.log(`⚠️ Nenhum CNPJ disponível para ligador ${ligador_id}`)
        resultados.push({ ligador_id, quantidade_solicitada: quantidade, quantidade_distribuida: 0, erro: 'Nenhum CNPJ disponível' })
        continue
      }
      
      const quantidadeReal = Math.min(quantidade, cnpjsDisponiveis.length)
      const cnpjsParaDistribuir = cnpjsDisponiveis.slice(0, quantidadeReal)
      
      console.log(`📋 Distribuindo ${quantidadeReal} CNPJs para ligador ${ligador_id}`)
      
      // Remover atribuições existentes desses CNPJs (permitir redistribuição)
      const { error: deleteError } = await supabaseAdmin
        .from('cnpj_atribuicoes')
        .delete()
        .in('cnpj_id', cnpjsParaDistribuir.map(c => c.id))
      
      if (deleteError) {
        console.log(`⚠️ Aviso ao remover atribuições existentes:`, deleteError)
      }
      
      // Criar novas atribuições
      const atribuicoes = cnpjsParaDistribuir.map(cnpj => ({
        ligador_id: ligador_id,
        cnpj_id: cnpj.id,
        status: 'pendente'
      }))
      
      const { error: atribuicaoError } = await supabaseAdmin
        .from('cnpj_atribuicoes')
        .insert(atribuicoes)
      
      if (atribuicaoError) {
        console.error(`❌ Erro ao criar atribuições para ligador ${ligador_id}:`, atribuicaoError)
        resultados.push({ ligador_id, quantidade_solicitada: quantidade, quantidade_distribuida: 0, erro: 'Erro ao criar atribuições' })
        continue
      }
      
      // Atualizar status dos CNPJs
      const { error: updateError } = await supabaseAdmin
        .from('cnpjs')
        .update({ status: 'atribuido' })
        .in('id', cnpjsParaDistribuir.map(c => c.id))
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar status dos CNPJs para ligador ${ligador_id}:`, updateError)
        resultados.push({ ligador_id, quantidade_solicitada: quantidade, quantidade_distribuida: 0, erro: 'Erro ao atualizar status' })
      } else {
        totalDistributed += quantidadeReal
        resultados.push({ ligador_id, quantidade_solicitada: quantidade, quantidade_distribuida: quantidadeReal })
        console.log(`✅ ${quantidadeReal} CNPJs distribuídos para ligador ${ligador_id}`)
      }
    }
    
    console.log(`🎉 Distribuição concluída! Total distribuído: ${totalDistributed} CNPJs`)
    
    res.json({ 
      message: `CNPJs distribuídos com sucesso! Total: ${totalDistributed}`,
      distributed: totalDistributed,
      resultados: resultados
    })
  } catch (error) {
    console.error('❌ Erro na distribuição:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Buscar todos os ligadores cadastrados
router.get('/ligadores', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Buscando todos os ligadores cadastrados...')
    
    const { data: ligadores, error } = await supabaseAdmin
      .from('ligadores')
      .select('id, nome, username, ativo, cnpjs_diarios')
      .eq('ativo', true)
      .order('nome')
    
    if (error) {
      console.error('❌ Erro ao buscar ligadores:', error)
      return res.status(500).json({ error: 'Erro ao buscar ligadores' })
    }
    
    console.log(`✅ Encontrados ${ligadores?.length || 0} ligadores ativos`)
    
    res.json({
      data: ligadores || [],
      total: ligadores?.length || 0
    })
  } catch (error) {
    console.error('❌ Erro interno ao buscar ligadores:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Obter estatísticas
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Buscar estatísticas considerando os status das atribuições
    const { count: totalCnpjs } = await supabaseAdmin
      .from('cnpjs')
      .select('*', { count: 'exact', head: true })
    
    // Primeiro, vamos verificar todos os CNPJs e seus status
    const { data: allCnpjs } = await supabaseAdmin
      .from('cnpjs')
      .select('id, numero, status, disponivel')
      .limit(10)
    
    console.log('🔍 Primeiros 10 CNPJs:', allCnpjs)
    
    const { count: cnpjsDisponiveis } = await supabaseAdmin
      .from('cnpjs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'disponivel')
      .eq('disponivel', true)
    
    // CNPJs atribuídos (com status 'atribuido' na tabela cnpjs)
    const { count: cnpjsAtribuidos } = await supabaseAdmin
      .from('cnpjs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'atribuido')
    
    // Estatísticas por status das atribuições
    const { count: atribuicoesPendentes } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente')
    
    const { count: atribuicoesMordidas } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'mordido')
    
    const { count: atribuicoesNaoTemBB } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'nao_tem_bb')
    
    const { count: atribuicoesNaoAtende } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'nao_atende')
    
    const { count: atribuicoesAgendou } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'agendou')
    
    const stats = {
      total: totalCnpjs || 0,
      disponivel: cnpjsDisponiveis || 0,
      atribuido: cnpjsAtribuidos || 0,
      finalizado: 0, // Para compatibilidade com o frontend
      // Estatísticas detalhadas por status das atribuições
      pendentes: atribuicoesPendentes || 0,
      mordidos: atribuicoesMordidas || 0,
      nao_tem_bb: atribuicoesNaoTemBB || 0,
      nao_atende: atribuicoesNaoAtende || 0,
      agendou: atribuicoesAgendou || 0
    }
    
    console.log('📊 Estatísticas calculadas:', stats)
    res.json({ data: stats })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Rota para resetar CNPJs para teste (temporária)
router.post('/reset-for-test', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Resetando CNPJs para teste...')
    
    // Resetar os primeiros 5 CNPJs para disponível
    const { data: cnpjsToReset, error: fetchError } = await supabaseAdmin
      .from('cnpjs')
      .select('id')
      .limit(5)
    
    if (fetchError) {
      return res.status(500).json({ error: 'Erro ao buscar CNPJs' })
    }
    
    if (!cnpjsToReset?.length) {
      return res.status(400).json({ error: 'Nenhum CNPJ encontrado' })
    }
    
    // Atualizar status para disponível
    const { error: updateError } = await supabaseAdmin
      .from('cnpjs')
      .update({ status: 'disponivel', disponivel: true })
      .in('id', cnpjsToReset.map(c => c.id))
    
    if (updateError) {
      return res.status(500).json({ error: 'Erro ao atualizar CNPJs' })
    }
    
    // Remover atribuições existentes desses CNPJs
    const { error: deleteError } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .delete()
      .in('cnpj_id', cnpjsToReset.map(c => c.id))
    
    console.log('✅ CNPJs resetados para teste:', cnpjsToReset.length)
    
    res.json({ 
      message: `${cnpjsToReset.length} CNPJs resetados para disponível`,
      count: cnpjsToReset.length
    })
  } catch (error) {
    console.error('❌ Erro ao resetar CNPJs:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Rota para limpar todos os CNPJs do sistema
router.post('/clear-all', authenticateToken, async (req, res) => {
  try {
    console.log('🗑️ Iniciando limpeza completa de todos os CNPJs do sistema...')
    
    // 1. Deletar todas as atribuições de CNPJs
    const { error: deleteAtribuicoesError } = await supabaseAdmin
      .from('cnpj_atribuicoes')
      .delete()
      .gt('created_at', '1900-01-01') // Deletar todos os registros
    
    if (deleteAtribuicoesError) {
      console.error('❌ Erro ao deletar atribuições:', deleteAtribuicoesError)
      return res.status(500).json({ error: 'Erro ao deletar atribuições de CNPJs' })
    }
    
    console.log('✅ Todas as atribuições de CNPJs foram removidas')
    
    // 2. Deletar todos os CNPJs
    const { error: deleteCnpjsError } = await supabaseAdmin
      .from('cnpjs')
      .delete()
      .gt('created_at', '1900-01-01') // Deletar todos os registros
    
    if (deleteCnpjsError) {
      console.error('❌ Erro ao deletar CNPJs:', deleteCnpjsError)
      return res.status(500).json({ error: 'Erro ao deletar CNPJs' })
    }
    
    console.log('✅ Todos os CNPJs foram removidos do sistema')
    
    // 3. Verificar se existe tabela de histórico de ligações e limpar se necessário
    try {
      const { error: deleteHistoricoError } = await supabaseAdmin
        .from('historico_ligacoes')
        .delete()
        .gt('created_at', '1900-01-01') // Deletar todos os registros
      
      if (deleteHistoricoError && !deleteHistoricoError.message?.includes('relation "public.historico_ligacoes" does not exist')) {
        console.log('⚠️ Aviso ao limpar histórico de ligações:', deleteHistoricoError)
      } else {
        console.log('✅ Histórico de ligações limpo (se existia)')
      }
    } catch (historicoError) {
      console.log('⚠️ Tabela de histórico não existe ou erro ao limpar:', historicoError)
    }
    
    console.log('🎉 Limpeza completa realizada com sucesso!')
    
    res.json({ 
      message: 'Todos os CNPJs e atribuições foram removidos do sistema com sucesso!',
      success: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erro na limpeza completa:', error)
    res.status(500).json({ error: 'Erro interno do servidor durante a limpeza' })
  }
})

// Rota para atualizar CNPJs existentes com dados da API
router.post('/update-existing', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { cnpjs } = req.body // Array de números de CNPJ ou 'all' para todos
    
    let cnpjsParaAtualizar = []
    
    if (cnpjs === 'all') {
      // Buscar todos os CNPJs que não têm dados da API
      const { data, error } = await supabaseAdmin
        .from('cnpjs')
        .select('numero')
        .or('api_status.is.null,api_status.eq.error')
      
      if (error) {
        return res.status(500).json({ error: 'Erro ao buscar CNPJs para atualizar' })
      }
      
      cnpjsParaAtualizar = data.map(c => c.numero)
    } else if (Array.isArray(cnpjs)) {
      cnpjsParaAtualizar = cnpjs.filter(cnpj => cnpj && cnpj.length === 14)
    } else {
      return res.status(400).json({ error: 'Parâmetro cnpjs deve ser um array ou "all"' })
    }
    
    if (cnpjsParaAtualizar.length === 0) {
      return res.json({ message: 'Nenhum CNPJ para atualizar', updated: 0 })
    }
    
    console.log(`🔄 Atualizando ${cnpjsParaAtualizar.length} CNPJs com dados da API...`)
    
    const cnpjsAtualizados = []
    const errosApi = []
    
    for (let i = 0; i < cnpjsParaAtualizar.length; i++) {
      const numeroCnpj = cnpjsParaAtualizar[i]
      
      try {
        console.log(`🔍 Atualizando CNPJ ${i + 1}/${cnpjsParaAtualizar.length}: ${numeroCnpj}`)
        
        // Buscar dados na API externa
        const apiData = await cnpjApiService.fetchCNPJData(numeroCnpj)
        const dadosProcessados = cnpjApiService.processApiData(apiData, numeroCnpj)
        
        // Atualizar dados no banco
        const { data, error } = await supabaseAdmin
          .from('cnpjs')
          .update({
            cnpj_formatado: dadosProcessados.cnpj_formatado,
            razao_social: dadosProcessados.razao_social,
            nome_fantasia: dadosProcessados.nome_fantasia,
            situacao_cadastral: dadosProcessados.situacao_cadastral,
            data_situacao_cadastral: dadosProcessados.data_situacao_cadastral,
            data_inicio_atividade: dadosProcessados.data_inicio_atividade,
            atividade_principal: dadosProcessados.atividade_principal,
            atividades_secundarias: dadosProcessados.atividades_secundarias,
            natureza_juridica: dadosProcessados.natureza_juridica,
            porte: dadosProcessados.porte,
            capital_social: dadosProcessados.capital_social,
            endereco_completo: dadosProcessados.endereco_completo,
            telefone: dadosProcessados.telefone,
            telefone2: dadosProcessados.telefone2,
            email: dadosProcessados.email,
            socios: dadosProcessados.socios,
            dados_completos: dadosProcessados.dados_completos,
            api_status: 'success',
            updated_at: new Date().toISOString()
          })
          .eq('numero', numeroCnpj)
          .select()
        
        if (error) {
          throw new Error(`Erro ao atualizar no banco: ${error.message}`)
        }
        
        cnpjsAtualizados.push(numeroCnpj)
        
        // Delay entre requisições para respeitar rate limit
        if (i < cnpjsParaAtualizar.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error) {
        console.error(`❌ Erro ao atualizar CNPJ ${numeroCnpj}:`, error.message)
        
        // Marcar como erro no banco
        await supabaseAdmin
          .from('cnpjs')
          .update({
            api_status: 'error',
            updated_at: new Date().toISOString()
          })
          .eq('numero', numeroCnpj)
        
        errosApi.push({
          cnpj: numeroCnpj,
          erro: error.message
        })
      }
    }
    
    res.json({
      message: 'Atualização de CNPJs concluída',
      total_processados: cnpjsParaAtualizar.length,
      sucessos: cnpjsAtualizados.length,
      erros: errosApi.length,
      cnpjs_atualizados: cnpjsAtualizados,
      erros_detalhes: errosApi
    })
    
  } catch (error) {
    console.error('❌ Erro na atualização de CNPJs:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router