import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  FileText, 
  Upload, 
  Download, 
  BarChart3, 
  Settings,
  LogOut,
  Plus,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface Ligador {
  id: string
  username: string
  nome: string
  ativo: boolean
  cnpjs_atribuidos: number
  created_at: string
}

interface Stats {
  total_cnpjs: number
  cnpjs_disponiveis: number
  cnpjs_atribuidos: number
  total_ligadores: number
  ligadores_ativos: number
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [ligadores, setLigadores] = useState<Ligador[]>([])
  const [stats, setStats] = useState<Stats>({
    total_cnpjs: 0,
    cnpjs_disponiveis: 0,
    cnpjs_atribuidos: 0,
    total_ligadores: 0,
    ligadores_ativos: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const token = localStorage.getItem('bb_token')
      if (!token) {
        navigate('/admin/login')
        return
      }

      // Carregar estatísticas
      const statsResponse = await fetch('http://localhost:3001/api/admin/stats', {
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

      // Carregar ligadores
      const ligadoresResponse = await fetch('http://localhost:3001/api/admin/ligadores', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (ligadoresResponse.ok) {
        const ligadoresData = await ligadoresResponse.json()
        // Garantir que ligadoresData seja sempre um array
        const ligadoresArray = Array.isArray(ligadoresData) ? ligadoresData : []
        setLigadores(ligadoresArray)
      }
    } catch (error) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('bb_token')
    localStorage.removeItem('bb_user')
    navigate('/admin/login')
  }

  const toggleLigadorStatus = async (id: string, ativo: boolean) => {
    try {
      const token = localStorage.getItem('bb_token')
      const response = await fetch(`http://localhost:3001/api/admin/ligadores/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ativo: !ativo })
      })

      if (response.ok) {
        toast.success(`Ligador ${!ativo ? 'ativado' : 'desativado'} com sucesso`)
        loadData()
      } else {
        toast.error('Erro ao alterar status do ligador')
      }
    } catch (error) {
      toast.error('Erro de conexão')
    }
  }

  const filteredLigadores = (Array.isArray(ligadores) ? ligadores : []).filter(ligador => {
    const matchesSearch = ligador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ligador.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterActive === null || ligador.ativo === filterActive
    return matchesSearch && matchesFilter
  })

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
              <div className="h-8 w-8 bg-yellow-500 rounded-lg flex items-center justify-center mr-3">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Painel Administrativo</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/cnpjs')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                style={{ backgroundColor: '#FFD700' }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Gerenciar CNPJs
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{ backgroundColor: '#003366' }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4" style={{ borderLeftColor: '#FFD700' }}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8" style={{ color: '#FFD700' }} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de CNPJs
                    </dt>
                    <dd className="text-lg font-medium" style={{ color: '#003366' }}>
                      {(stats?.total_cnpjs || 0).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-green-500">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Download className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Disponíveis</dt>
                    <dd className="text-lg font-medium" style={{ color: '#003366' }}>{(stats?.cnpjs_disponiveis || 0).toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4" style={{ borderLeftColor: '#003366' }}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Upload className="h-8 w-8" style={{ color: '#003366' }} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Atribuídos</dt>
                    <dd className="text-lg font-medium" style={{ color: '#003366' }}>{(stats?.cnpjs_atribuidos || 0).toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border-l-4" style={{ borderLeftColor: '#003366' }}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8" style={{ color: '#003366' }} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Ligadores
                    </dt>
                    <dd className="text-lg font-medium" style={{ color: '#003366' }}>
                      {stats.total_ligadores}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Ativos</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.ligadores_ativos}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ligadores */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Ligadores</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/admin/ligadores/novo')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Ligador
                </button>
                <button
                  onClick={loadData}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
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
                    placeholder="Buscar ligador..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterActive === null ? 'all' : filterActive.toString()}
                  onChange={(e) => {
                    const value = e.target.value
                    setFilterActive(value === 'all' ? null : value === 'true')
                  }}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm rounded-md"
                >
                  <option value="all">Todos</option>
                  <option value="true">Ativos</option>
                  <option value="false">Inativos</option>
                </select>
              </div>
            </div>

            {/* Lista de Ligadores */}
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ligador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNPJs Atribuídos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLigadores.map((ligador) => (
                    <tr key={ligador.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ligador.nome}</div>
                          <div className="text-sm text-gray-500">@{ligador.username}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ligador.cnpjs_atribuidos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ligador.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {ligador.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ligador.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => toggleLigadorStatus(ligador.id, ligador.ativo)}
                          className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded ${
                            ligador.ativo
                              ? 'text-red-700 bg-red-100 hover:bg-red-200'
                              : 'text-green-700 bg-green-100 hover:bg-green-200'
                          }`}
                        >
                          {ligador.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLigadores.length === 0 && (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum ligador encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterActive !== null 
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Comece criando um novo ligador.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard