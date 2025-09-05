import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, PhoneOff, Mail, MailX, MapPin, Building2, User, Calendar, CheckCircle, XCircle, Clock, AlertCircle, AlertTriangle, LogOut, RefreshCw, Save, Edit3, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface CNPJ {
  id: string
  cnpj_id: string
  cnpj: string
  cnpj_formatado?: string
  razao_social: string
  nome_fantasia?: string
  situacao_cadastral?: string
  data_situacao_cadastral?: string
  data_inicio_atividade?: string
  atividade_principal?: any
  atividades_secundarias?: any
  natureza_juridica?: any
  porte?: any
  capital_social?: number
  endereco_completo?: string
  telefone?: string
  telefone2?: string
  email?: string
  dados_completos?: any
  situacao_especial?: string
  data_situacao_especial?: string
  atualizado_em?: string
  endereco?: string
  status: 'pendente' | 'mordido' | 'nao_tem_bb' | 'nao_atende' | 'agendou'
  anotacoes?: string
  data_atribuicao: string
}

interface Stats {
  total: number
  pendentes: number
  mordido: number
  nao_tem_bb: number
  nao_atende: number
  agendou: number
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [cnpjs, setCnpjs] = useState<CNPJ[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pendentes: 0,
    mordido: 0,
    nao_tem_bb: 0,
    nao_atende: 0,
    agendou: 0
  })
  const [loading, setLoading] = useState(true)
  const [expandedCnpj, setExpandedCnpj] = useState<string | null>(null)
  const [tempStatus, setTempStatus] = useState<string>('')
  const [tempAnotacoes, setTempAnotacoes] = useState<string>('')

  const user = JSON.parse(localStorage.getItem('bb_user') || '{}')

  useEffect(() => {
    loadCnpjs()
    loadStats()
  }, [])

  const loadCnpjs = async () => {
    try {
      const token = localStorage.getItem('bb_token')
      const response = await fetch('http://localhost:3001/api/ligador/cnpjs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCnpjs(data.cnpjs)
      } else {
        toast.error('Erro ao carregar CNPJs')
      }
    } catch (error) {
      toast.error('Erro ao carregar CNPJs')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('bb_token')
      const response = await fetch('http://localhost:3001/api/ligador/cnpjs/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('bb_token')
    localStorage.removeItem('bb_user')
    navigate('/ligador/login')
  }

  const handleOpenCnpj = (cnpj: CNPJ) => {
    if (expandedCnpj === cnpj.id) {
      setExpandedCnpj(null)
    } else {
      setExpandedCnpj(cnpj.id)
      setTempStatus(cnpj.status)
      setTempAnotacoes(cnpj.anotacoes || '')
    }
  }

  const handleSaveStatus = async (cnpjId: string) => {
    try {
      const token = localStorage.getItem('bb_token')
      const response = await fetch(`http://localhost:3001/api/ligador/cnpjs/${cnpjId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: tempStatus,
          anotacoes: tempAnotacoes
        })
      })
      
      if (response.ok) {
        toast.success('Status atualizado com sucesso')
        loadCnpjs()
        loadStats()
        setExpandedCnpj(null)
      } else {
        toast.error('Erro ao atualizar status')
      }
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const handleRenovarCnpjs = async () => {
    try {
      const token = localStorage.getItem('bb_token')
      const response = await fetch('http://localhost:3001/api/ligador/cnpjs/renovar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`${data.novos_cnpjs} novos CNPJs atribuídos`)
        loadCnpjs()
        loadStats()
      } else {
        toast.error('Erro ao renovar CNPJs')
      }
    } catch (error) {
      toast.error('Erro ao renovar CNPJs')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'mordido': return 'bg-red-100 text-red-800'
      case 'nao_tem_bb': return 'bg-gray-100 text-gray-800'
      case 'nao_atende': return 'bg-orange-100 text-orange-800'
      case 'agendou': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente'
      case 'mordido': return 'Mordido'
      case 'nao_tem_bb': return 'Não tem BB'
      case 'nao_atende': return 'Não atende +4x'
      case 'agendou': return 'Agendou'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bb-background">
      {/* Header */}
      <header className="bb-glass sticky top-0 z-50 border-b border-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-0 sm:h-20">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center mr-4 bb-glow" style={{ background: 'var(--bb-gradient-primary)' }}>
                <User className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bb-gradient-text">Dashboard do Ligador</h1>
                <p className="text-sm sm:text-base font-medium" style={{ color: 'var(--bb-blue-primary)' }}>Bem-vindo, {user.nome}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={handleRenovarCnpjs}
                className="bb-button-secondary px-4 sm:px-6 py-2 sm:py-3 text-sm font-bold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                <span>Renovar CNPJs</span>
              </button>
              <button
                onClick={handleLogout}
                className="bb-button-outline px-4 sm:px-6 py-2 sm:py-3 text-sm font-bold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bb-card bb-glass p-4 sm:p-5 bb-animate-fade-in hover:scale-105 transition-all duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 bb-glow" style={{ background: 'var(--bb-gradient-primary)' }}>
                <span className="text-white text-sm sm:text-base font-bold">T</span>
              </div>
              <div className="w-full">
                <dt className="text-xs sm:text-sm font-semibold bb-text-primary truncate mb-1">Total</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-bold bb-gradient-text">{stats.total}</dd>
              </div>
            </div>
          </div>
          <div className="bb-card bb-glass p-4 sm:p-5 bb-animate-fade-in hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 bb-glow" style={{ background: 'var(--bb-gradient-secondary)' }}>
                <span className="text-white text-sm sm:text-base font-bold">P</span>
              </div>
              <div className="w-full">
                <dt className="text-xs sm:text-sm font-semibold bb-text-primary truncate mb-1">Pendentes</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-bold bb-gradient-text">{stats.pendentes}</dd>
              </div>
            </div>
          </div>
          <div className="bb-card bb-glass p-4 sm:p-5 bb-animate-fade-in hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 bb-glow bg-red-500">
                <span className="text-white text-sm sm:text-base font-bold">M</span>
              </div>
              <div className="w-full">
                <dt className="text-xs sm:text-sm font-semibold bb-text-primary truncate mb-1">Mordido</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{stats.mordido}</dd>
              </div>
            </div>
          </div>
          <div className="bb-card bb-glass p-4 sm:p-5 bb-animate-fade-in hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 bb-glow bg-gray-500">
                <span className="text-white text-sm sm:text-base font-bold">N</span>
              </div>
              <div className="w-full">
                <dt className="text-xs sm:text-sm font-semibold bb-text-primary truncate mb-1">Não tem BB</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600">{stats.nao_tem_bb}</dd>
              </div>
            </div>
          </div>
          <div className="bb-card bb-glass p-4 sm:p-5 bb-animate-fade-in hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.4s' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 bb-glow bg-orange-500">
                <span className="text-white text-sm sm:text-base font-bold">4</span>
              </div>
              <div className="w-full">
                <dt className="text-xs sm:text-sm font-semibold bb-text-primary truncate mb-1">Não atende +4x</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{stats.nao_atende}</dd>
              </div>
            </div>
          </div>
          <div className="bb-card bb-glass p-4 sm:p-5 bb-animate-fade-in hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.5s' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 bb-glow bg-green-500">
                <span className="text-white text-sm sm:text-base font-bold">A</span>
              </div>
              <div className="w-full">
                <dt className="text-xs sm:text-sm font-semibold bb-text-primary truncate mb-1">Agendou</dt>
                <dd className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{stats.agendou}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de CNPJs */}
        <div className="bb-card bb-glass overflow-hidden">
          <div className="px-4 sm:px-6 py-5 sm:py-6 border-b border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-lg sm:text-xl font-bold bb-gradient-text">CNPJs Atribuídos</h3>
                <p className="mt-1 text-sm sm:text-base font-medium" style={{ color: 'var(--bb-blue-primary)' }}>
                  Lista de todos os CNPJs sob sua responsabilidade
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium text-green-600">Online</span>
              </div>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <h4 className="text-base font-medium text-gray-700 mb-4">
              Meus CNPJs ({cnpjs.length})
            </h4>
            
            {cnpjs.length === 0 ? (
              <div className="text-center py-12 bb-animate-fade-in">
                <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mb-4 bb-glow" style={{ background: 'var(--bb-gradient-primary)' }}>
                  <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold bb-gradient-text mb-2">Nenhum CNPJ encontrado</h3>
                <p className="text-sm sm:text-base font-medium" style={{ color: 'var(--bb-blue-primary)' }}>Não há CNPJs atribuídos para você no momento.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {cnpjs.map((cnpj, index) => (
                  <div key={cnpj.id} className="bb-card bb-glass p-4 sm:p-6 hover:scale-[1.02] transition-all duration-300 bb-animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    {/* Linha principal do CNPJ */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center flex-shrink-0 bb-glow" style={{ background: 'var(--bb-gradient-primary)' }}>
                            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm sm:text-base font-bold bb-text-primary truncate">{cnpj.cnpj}</p>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1 line-clamp-2">{cnpj.razao_social}</p>
                            {cnpj.nome_fantasia && (
                              <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">{cnpj.nome_fantasia}</p>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(cnpj.status)} bb-glow`}>
                            {getStatusLabel(cnpj.status)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                          onClick={() => handleOpenCnpj(cnpj)}
                          className="bb-button-primary w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 py-2 bb-animate-slide-in"
                          style={{ animationDelay: `${(index * 0.1) + 0.2}s` }}
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          {expandedCnpj === cnpj.id ? 'Fechar' : 'Ver detalhes'}
                        </button>
                      </div>
                    </div>

                    {/* Aba expansível */}
                    {expandedCnpj === cnpj.id && (
                      <div className="border-t border-white/20 mt-4 pt-4 bb-animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                          {/* Informações Gerais */}
                          <div className="bb-card bb-glass p-4 sm:p-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center bb-glow" style={{ background: 'var(--bb-gradient-primary)' }}>
                                <Building2 className="h-4 w-4 text-white" />
                              </div>
                              <h4 className="text-base sm:text-lg font-bold bb-gradient-text">Informações Gerais</h4>
                            </div>
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center">
                                <span className="text-xs sm:text-sm font-bold bb-text-primary min-w-[100px]">CNPJ:</span>
                                <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1 sm:mt-0">{cnpj.cnpj}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-start">
                                <span className="text-xs sm:text-sm font-bold bb-text-primary min-w-[100px] flex-shrink-0">Razão Social:</span>
                                <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1 sm:mt-0 break-words">{cnpj.razao_social}</span>
                              </div>
                              {cnpj.nome_fantasia && (
                                <div className="flex flex-col sm:flex-row sm:items-start">
                                  <span className="text-xs sm:text-sm font-bold bb-text-primary min-w-[100px] flex-shrink-0">Nome Fantasia:</span>
                                  <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1 sm:mt-0 break-words">{cnpj.nome_fantasia}</span>
                                </div>
                              )}
                              <div className="flex flex-col sm:flex-row sm:items-center">
                                <span className="text-xs sm:text-sm font-bold bb-text-primary min-w-[100px]">Status:</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold mt-1 sm:mt-0 ${getStatusColor(cnpj.status)} bb-glow`}>
                                  {getStatusLabel(cnpj.status)}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center">
                                <span className="text-xs sm:text-sm font-bold bb-text-primary min-w-[100px]">Atribuído em:</span>
                                <span className="text-xs sm:text-sm font-medium text-gray-700 mt-1 sm:mt-0">{new Date(cnpj.data_atribuicao).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Informações de contato */}
                          <div className="bb-card bb-glass p-4 sm:p-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center bb-glow" style={{ background: 'var(--bb-gradient-secondary)' }}>
                                <Phone className="h-4 w-4 text-white" />
                              </div>
                              <h4 className="text-base sm:text-lg font-bold bb-gradient-text">Informações de Contato</h4>
                            </div>
                            <div className="space-y-3">
                              {cnpj.telefone ? (
                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/50">
                                  <div className="h-6 w-6 rounded-full flex items-center justify-center bg-green-100">
                                    <Phone className="h-3 w-3 text-green-600" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">{cnpj.telefone}</span>
                                    <span className="text-xs text-gray-500">Telefone Principal</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                                  <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gray-100">
                                    <PhoneOff className="h-3 w-3 text-gray-400" />
                                  </div>
                                  <span className="text-xs sm:text-sm font-medium text-gray-400">Telefone não informado</span>
                                </div>
                              )}
                              {cnpj.telefone2 && (
                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/50">
                                  <div className="h-6 w-6 rounded-full flex items-center justify-center bg-green-100">
                                    <Phone className="h-3 w-3 text-green-600" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-xs sm:text-sm font-medium text-gray-700">{cnpj.telefone2}</span>
                                    <span className="text-xs text-gray-500">Telefone Secundário</span>
                                  </div>
                                </div>
                              )}
                              {cnpj.email ? (
                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/50">
                                  <div className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-100">
                                    <Mail className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <span className="text-xs sm:text-sm font-medium text-gray-700 break-all">{cnpj.email}</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                                  <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gray-100">
                                    <XCircle className="h-3 w-3 text-gray-400" />
                                  </div>
                                  <span className="text-xs sm:text-sm font-medium text-gray-400">Email não informado</span>
                                </div>
                              )}
                              {(cnpj.endereco_completo || cnpj.endereco) ? (
                                <div className="flex items-start space-x-3 p-3 rounded-lg bg-white/50">
                                  <div className="h-6 w-6 rounded-full flex items-center justify-center bg-purple-100 flex-shrink-0 mt-0.5">
                                    <MapPin className="h-3 w-3 text-purple-600" />
                                  </div>
                                  <span className="text-xs sm:text-sm font-medium text-gray-700 break-words">{cnpj.endereco_completo || cnpj.endereco}</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                                  <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gray-100">
                                    <MapPin className="h-3 w-3 text-gray-400" />
                                  </div>
                                  <span className="text-xs sm:text-sm font-medium text-gray-400">Endereço não informado</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Informações Empresariais */}
                          {(cnpj.situacao_cadastral || cnpj.atividade_principal || cnpj.natureza_juridica || cnpj.porte) && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="h-6 w-6 rounded-full flex items-center justify-center bg-blue-100">
                                  <Building2 className="h-3 w-3 text-blue-600" />
                                </div>
                                <h4 className="text-sm font-semibold text-blue-800">Informações Empresariais</h4>
                              </div>
                              <div className="space-y-2">
                                {cnpj.situacao_cadastral && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-blue-600 font-medium">Situação:</span>
                                    <span className="text-xs text-blue-800 font-semibold">{cnpj.situacao_cadastral}</span>
                                  </div>
                                )}
                                {cnpj.atividade_principal && (
                                  <div className="flex flex-col space-y-1">
                                    <span className="text-xs text-blue-600 font-medium">Atividade Principal:</span>
                                    <span className="text-xs text-blue-800 break-words">{typeof cnpj.atividade_principal === 'object' ? cnpj.atividade_principal.descricao : cnpj.atividade_principal}</span>
                                  </div>
                                )}
                                {cnpj.natureza_juridica && (
                                  <div className="flex flex-col space-y-1">
                                    <span className="text-xs text-blue-600 font-medium">Natureza Jurídica:</span>
                                    <span className="text-xs text-blue-800">{typeof cnpj.natureza_juridica === 'object' ? cnpj.natureza_juridica.descricao : cnpj.natureza_juridica}</span>
                                  </div>
                                )}
                                {cnpj.porte && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-blue-600 font-medium">Porte:</span>
                                    <span className="text-xs text-blue-800 font-semibold">{typeof cnpj.porte === 'object' ? cnpj.porte.descricao : cnpj.porte}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Status e anotações */}
                          <div className="lg:col-span-2">
                            <div className="bb-card bb-glass p-4 sm:p-6">
                              <div className="flex items-center space-x-3 mb-4">
                                <div className="h-8 w-8 rounded-full flex items-center justify-center bb-glow" style={{ background: 'var(--bb-gradient-accent)' }}>
                                  <AlertTriangle className="h-4 w-4 text-white" />
                                </div>
                                <h4 className="text-base sm:text-lg font-bold bb-gradient-text">Status da Ligação</h4>
                              </div>
                              <div className="space-y-4 sm:space-y-6">
                                <div>
                                  <label className="block text-sm font-bold bb-text-primary mb-3">
                                    Status
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                      { value: 'pendente', label: 'Pendente', color: 'from-yellow-400 to-yellow-500' },
                                      { value: 'mordido', label: 'Mordido', color: 'from-red-400 to-red-500' },
                                      { value: 'nao_tem_bb', label: 'Não tem BB', color: 'from-gray-400 to-gray-500' },
                                      { value: 'nao_atende', label: 'Não atende +4x', color: 'from-orange-400 to-orange-500' },
                                      { value: 'agendou', label: 'Agendou', color: 'from-green-400 to-green-500' }
                                    ].map((option) => (
                                      <label key={option.value} className={`relative flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                                        tempStatus === option.value 
                                          ? `bg-gradient-to-r ${option.color} text-white bb-glow` 
                                          : 'bg-white/50 hover:bg-white/70'
                                      }`}>
                                        <input
                                          type="radio"
                                          name={`status-${cnpj.id}`}
                                          value={option.value}
                                          checked={tempStatus === option.value}
                                          onChange={(e) => setTempStatus(e.target.value)}
                                          className="sr-only"
                                        />
                                        <span className={`text-sm font-bold ${
                                          tempStatus === option.value ? 'text-white' : 'bb-text-primary'
                                        }`}>{option.label}</span>
                                        {tempStatus === option.value && (
                                          <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-white animate-pulse"></div>
                                        )}
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label htmlFor={`anotacoes-${cnpj.id}`} className="block text-sm font-bold bb-text-primary mb-3">
                                    Anotações
                                  </label>
                                  <textarea
                                    id={`anotacoes-${cnpj.id}`}
                                    rows={4}
                                    value={tempAnotacoes}
                                    onChange={(e) => setTempAnotacoes(e.target.value)}
                                    className="block w-full border-0 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm bg-white/70 backdrop-blur-sm p-4 font-medium"
                                    placeholder="Digite suas anotações sobre esta ligação..."
                                    style={{ minHeight: '100px' }}
                                  />
                                </div>

                                <button
                                  onClick={() => handleSaveStatus(cnpj.id)}
                                  className="w-full bb-button-primary py-3 sm:py-4 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 hover:scale-105 bb-glow flex items-center justify-center space-x-2"
                                >
                                  <span>Salvar Alterações</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard