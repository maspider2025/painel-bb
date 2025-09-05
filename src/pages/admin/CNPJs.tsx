import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Upload, 
  Download, 
  FileText, 
  Search, 
  Filter,
  RefreshCw,
  ArrowLeft,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import CnpjModal from '../../components/admin/CnpjModal'

interface CNPJ {
  id: string
  numero: string
  razao_social: string
  status: 'disponivel' | 'atribuido' | 'mordido' | 'nao_tem_bb' | 'nao_atende' | 'agendou'
  status_atual: 'disponivel' | 'atribuido' | 'mordido' | 'nao_tem_bb' | 'nao_atende' | 'agendou'
  ligador?: {
    id: string
    nome: string
    username: string
  }
  anotacoes?: string
  created_at: string
  updated_at: string
  ultima_atualizacao: string
  data_atribuicao?: string
}

interface Ligador {
  id: string
  nome: string
  email: string
  telefone?: string
  status: string
}

interface DistribuicaoConfig {
  ligador_id: string
  quantidade: number
}

interface Stats {
  total: number
  disponiveis: number
  atribuidos: number
  mordidos: number
  nao_tem_bb: number
  nao_atende: number
  agendou: number
}

const CNPJs: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cnpjs, setCnpjs] = useState<CNPJ[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    disponiveis: 0,
    atribuidos: 0,
    mordidos: 0,
    nao_tem_bb: 0,
    nao_atende: 0,
    agendou: 0
  })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 50
  
  // Estados para distribuição manual
  const [showDistributeModal, setShowDistributeModal] = useState(false)
  const [ligadores, setLigadores] = useState<Ligador[]>([])
  const [distribuicaoConfig, setDistribuicaoConfig] = useState<DistribuicaoConfig[]>([])
  const [isDistributing, setIsDistributing] = useState(false)
  
  // Estados para limpeza
  const [isClearing, setIsClearing] = useState(false)
  
  // Estados para modal de CNPJ
  const [selectedCnpj, setSelectedCnpj] = useState<CNPJ | null>(null)
  const [showCnpjModal, setShowCnpjModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [currentPage, searchTerm, statusFilter])

  const handleCnpjClick = (cnpj: CNPJ) => {
    setSelectedCnpj(cnpj)
    setShowCnpjModal(true)
  }

  const closeCnpjModal = () => {
    setSelectedCnpj(null)
    setShowCnpjModal(false)
  }

  const loadData = async () => {
    try {
      const token = localStorage.getItem('bb_token')
      if (!token) {
        navigate('/admin/login')
        return
      }

      // Carregar CNPJs com paginação e filtros
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const cnpjsResponse = await fetch(`http://localhost:3001/api/admin/cnpjs?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (cnpjsResponse.ok) {
        const cnpjsData = await cnpjsResponse.json()
        console.log('🔍 Dados recebidos da API:', cnpjsData)
        console.log('📊 Estrutura completa:', JSON.stringify(cnpjsData, null, 2))
        
        // Verificar se cnpjsData e cnpjsData.cnpjs existem
        if (cnpjsData && cnpjsData.cnpjs && Array.isArray(cnpjsData.cnpjs)) {
          console.log('📊 Primeiro CNPJ:', cnpjsData.cnpjs[0])
          setCnpjs(cnpjsData.cnpjs)
          setTotalPages(Math.ceil((cnpjsData.total || cnpjsData.cnpjs.length) / itemsPerPage))
        } else {
          console.error('❌ Estrutura de dados inválida:', cnpjsData)
          setCnpjs([])
          setTotalPages(1)
        }
      }

      // Carregar estatísticas
      const statsResponse = await fetch('http://localhost:3001/api/admin/cnpjs/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = [
      'text/csv',
      'text/plain',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato de arquivo não suportado. Use CSV, TXT, PDF ou Excel.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const token = localStorage.getItem('bb_token')
      const response = await fetch('http://localhost:3001/api/admin/cnpjs/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`${data.imported} CNPJs importados com sucesso!`)
        loadData()
      } else {
        toast.error(data.error || 'Erro ao importar CNPJs')
      }
    } catch (error) {
      toast.error('Erro de conexão')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const fetchLigadores = async () => {
    try {
      const token = localStorage.getItem('bb_token')
      const response = await fetch('http://localhost:3001/api/admin/cnpjs/ligadores', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Ligadores carregados:', data)
        setLigadores(data.data || [])
      } else {
        console.error('Erro ao buscar ligadores:', response.status)
        toast.error('Erro ao carregar ligadores')
      }
    } catch (error) {
      console.error('Erro ao buscar ligadores:', error)
      toast.error('Erro de conexão ao carregar ligadores')
    }
  }

  const openDistributeModal = async () => {
    await fetchLigadores()
    setDistribuicaoConfig([])
    setShowDistributeModal(true)
  }

  const handleDistribute = async () => {
    // Validação 1: Verificar se há ligadores selecionados
    if (distribuicaoConfig.length === 0) {
      toast.error('Selecione pelo menos um ligador')
      return
    }

    // Validação 2: Verificar se há CNPJs disponíveis suficientes
    const totalSolicitado = getTotalSolicitado()
    if (totalSolicitado > stats.disponiveis) {
      toast.error(`Quantidade solicitada (${totalSolicitado}) excede CNPJs disponíveis (${stats.disponiveis})`)
      return
    }

    // Validação 3: Verificar se todas as quantidades são válidas
    const configInvalida = distribuicaoConfig.find(config => 
      !config.quantidade || config.quantidade < 1 || config.quantidade > stats.disponiveis
    )
    if (configInvalida) {
      toast.error('Todas as quantidades devem ser entre 1 e ' + stats.disponiveis)
      return
    }

    // Validação 4: Verificar se todos os ligadores são válidos
    const ligadorInvalido = distribuicaoConfig.find(config => 
      !ligadores.find(l => l.id === config.ligador_id)
    )
    if (ligadorInvalido) {
      toast.error('Ligador inválido selecionado')
      return
    }

    // Payload para a nova rota de distribuição manual
    const payload = { distribuicoes: distribuicaoConfig }
    
    console.log('🔍 Frontend - Payload para distribuição manual:', payload)
     
    setIsDistributing(true)
    try {
      const token = localStorage.getItem('bb_token')
      
      // Usando nova rota de distribuição manual
      const url = '/api/admin/cnpjs/distribute-manual'
      
      console.log('📤 Enviando para rota de distribuição manual:', url)
      console.log('📤 Payload:', JSON.stringify(payload))
      
      const response = await fetch(`http://localhost:3001${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      console.log('📥 Response status:', response.status)
      
      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || 'CNPJs distribuídos com sucesso!')
        loadData()
        setShowDistributeModal(false)
        setDistribuicaoConfig([])
      } else {
        toast.error(data.error || 'Erro ao distribuir CNPJs')
      }
    } catch (error) {
      console.error('❌ Erro na distribuição manual:', error)
      toast.error('Erro de conexão com o servidor')
    } finally {
      setIsDistributing(false)
    }
  }

  const toggleLigador = (ligadorId: string) => {
    const exists = distribuicaoConfig.find(config => config.ligador_id === ligadorId)
    if (exists) {
      setDistribuicaoConfig(prev => prev.filter(config => config.ligador_id !== ligadorId))
    } else {
      setDistribuicaoConfig(prev => [...prev, { ligador_id: ligadorId, quantidade: 1 }])
    }
  }

  const updateQuantidade = (ligadorId: string, quantidade: number) => {
    if (quantidade < 1) return
    setDistribuicaoConfig(prev => 
      prev.map(config => 
        config.ligador_id === ligadorId 
          ? { ...config, quantidade }
          : config
      )
    )
  }

  const getTotalSolicitado = () => {
    return distribuicaoConfig.reduce((sum, config) => sum + config.quantidade, 0)
  }

  const handleClearAllCNPJs = async () => {
    const confirmFirst = window.confirm(
      '⚠️ ATENÇÃO: Esta ação irá remover TODOS os CNPJs do sistema!\n\n' +
      'Isso inclui:\n' +
      '• Todos os CNPJs cadastrados\n' +
      '• Todas as atribuições de ligadores\n' +
      '• Todo o histórico relacionado\n\n' +
      'Esta ação NÃO PODE ser desfeita!\n\n' +
      'Tem certeza que deseja continuar?'
    )
    
    if (!confirmFirst) return
    
    const confirmSecond = window.confirm(
      '🚨 CONFIRMAÇÃO FINAL\n\n' +
      'Você está prestes a DELETAR TODOS OS DADOS de CNPJs do sistema.\n\n' +
      'Digite "CONFIRMAR" para prosseguir ou cancele para abortar.'
    )
    
    if (!confirmSecond) return
    
    setIsClearing(true)
    try {
      const token = localStorage.getItem('bb_token')
      const response = await fetch('http://localhost:3001/api/admin/cnpjs/clear-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Todos os CNPJs foram removidos do sistema!')
        loadData() // Recarregar dados
      } else {
        toast.error(data.error || 'Erro ao limpar CNPJs')
      }
    } catch (error) {
      console.error('Erro ao limpar CNPJs:', error)
      toast.error('Erro de conexão com o servidor')
    } finally {
      setIsClearing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'disponivel':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'atribuido':
        return <Users className="h-4 w-4 text-blue-500" />
      case 'mordido':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'nao_tem_bb':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'nao_atende':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'agendou':
        return <CheckCircle className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Disponível'
      case 'atribuido': return 'Atribuído'
      case 'mordido': return 'Mordido'
      case 'nao_tem_bb': return 'Não tem BB'
      case 'nao_atende': return 'Não atende'
      case 'agendou': return 'Agendou'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return 'bg-gray-100 text-gray-800'
      case 'atribuido': return 'bg-blue-100 text-blue-800'
      case 'mordido': return 'bg-green-100 text-green-800'
      case 'nao_tem_bb': return 'bg-red-100 text-red-800'
      case 'nao_atende': return 'bg-orange-100 text-orange-800'
      case 'agendou': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Gerenciar CNPJs</h1>
            </div>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.pdf,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{ backgroundColor: '#003366' }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                style={{ backgroundColor: '#FFD700' }}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Enviando...' : 'Importar CNPJs'}
              </button>
              <button
                onClick={openDistributeModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                style={{ backgroundColor: '#003366' }}
              >
                <Users className="h-4 w-4 mr-2" />
                Distribuir CNPJs
              </button>
              <button
                onClick={handleClearAllCNPJs}
                disabled={isClearing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                style={{ backgroundColor: '#dc2626' }}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                {isClearing ? 'Limpando...' : 'Limpar Todos os CNPJs'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4" style={{ borderLeftColor: '#003366' }}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8" style={{ color: '#003366' }} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de CNPJs
                    </dt>
                    <dd className="text-lg font-medium" style={{ color: '#003366' }}>
                      {(stats?.total ?? 0).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-green-500">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Disponíveis</p>
                  <p className="text-lg font-semibold" style={{ color: '#003366' }}>{(stats?.disponiveis ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4" style={{ borderLeftColor: '#003366' }}>
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-5 w-5" style={{ color: '#003366' }} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Atribuídos</p>
                  <p className="text-lg font-semibold" style={{ color: '#003366' }}>{(stats?.atribuidos ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-red-500">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Mordidos</p>
                  <p className="text-lg font-semibold" style={{ color: '#003366' }}>{(stats?.mordidos ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-gray-500">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Não tem BB</p>
                  <p className="text-lg font-semibold" style={{ color: '#003366' }}>{(stats?.nao_tem_bb ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-orange-500">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Não atende</p>
                  <p className="text-lg font-semibold" style={{ color: '#003366' }}>{(stats?.nao_atende ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-purple-500">
            <div className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Agendou</p>
                  <p className="text-lg font-semibold" style={{ color: '#003366' }}>{(stats?.agendou ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de CNPJs */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">CNPJs</h3>
              <button
                onClick={loadData}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar CNPJ ou razão social..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md"
                >
                  <option value="all">Todos os status</option>
                  <option value="disponivel">Disponível</option>
                  <option value="atribuido">Atribuído</option>
                  <option value="mordido">Mordido</option>
                  <option value="nao_tem_bb">Não tem BB</option>
                  <option value="nao_atende">Não atende</option>
                  <option value="agendou">Agendou</option>
                </select>
              </div>
            </div>

            {/* Tabela */}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Razão Social
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ligador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atualizado em
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cnpjs.map((cnpj) => (
                    <tr key={cnpj.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleCnpjClick(cnpj)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600 hover:text-blue-800">
                        {cnpj.numero}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cnpj.razao_social}</div>
                        {cnpj.anotacoes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {cnpj.anotacoes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(cnpj.status_atual)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cnpj.status_atual)}`}>
                            {getStatusText(cnpj.status_atual)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cnpj.ligador?.nome || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cnpj.ultima_atualizacao).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próximo
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, stats.total)}
                      </span>{' '}
                      de <span className="font-medium">{stats.total}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + Math.max(1, currentPage - 2)
                        if (page > totalPages) return null
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? 'z-10 bg-yellow-50 border-yellow-500 text-yellow-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próximo
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}

            {cnpjs.length === 0 && (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum CNPJ encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Comece importando uma lista de CNPJs.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Distribuição Manual */}
      {showDistributeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Configurar Distribuição Manual</h2>
              <button
                onClick={() => setShowDistributeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">CNPJs Disponíveis</div>
                <div className="text-2xl font-bold text-blue-900">{stats.disponiveis}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600 font-medium">CNPJs Atribuídos</div>
                <div className="text-2xl font-bold text-green-900">{stats.atribuidos}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 font-medium">Total de CNPJs</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Selecionado</div>
                <div className="text-2xl font-bold text-purple-900">{getTotalSolicitado()}</div>
              </div>
            </div>

            {/* Validação de quantidade */}
            {getTotalSolicitado() > stats.disponiveis && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700 font-medium">
                    Quantidade selecionada ({getTotalSolicitado()}) excede CNPJs disponíveis ({stats.disponiveis})
                  </span>
                </div>
              </div>
            )}

            {/* Lista de Ligadores */}
            <div className="space-y-3 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Selecionar Ligadores</h3>
              {ligadores.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum ligador encontrado</p>
                </div>
              ) : (
                ligadores.map((ligador) => {
                  const config = distribuicaoConfig.find(c => c.ligador_id === ligador.id)
                  const isSelected = !!config
                  
                  return (
                    <div key={ligador.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleLigador(ligador.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{ligador.nome}</div>
                          <div className="text-sm text-gray-500">{ligador.email}</div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">Quantidade:</label>
                          <input
                            type="number"
                            min="1"
                            max={stats.disponiveis}
                            value={config?.quantidade || 1}
                            onChange={(e) => updateQuantidade(ligador.id, parseInt(e.target.value) || 1)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDistributeModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDistribute}
                disabled={isDistributing || distribuicaoConfig.length === 0 || getTotalSolicitado() > stats.disponiveis}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDistributing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Distribuindo...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Confirmar Distribuição
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de CNPJ */}
      {showCnpjModal && selectedCnpj && (
        <CnpjModal
          cnpj={selectedCnpj}
          isOpen={showCnpjModal}
          onClose={closeCnpjModal}
        />
      )}
    </div>
  )
}

export default CNPJs