import React, { useState, useEffect } from 'react';
import { Upload, Download, Users, FileText, AlertCircle, CheckCircle, X, Settings } from 'lucide-react';
import CnpjModal from './CnpjModal';

interface CNPJ {
  id: string;
  cnpj: string;
  razao_social: string;
  status: 'disponivel' | 'atribuido' | 'finalizado';
  created_at: string;
}

interface CnpjStats {
  total: number;
  disponivel: number;
  atribuido: number;
  finalizado: number;
}

interface Ligador {
  id: string;
  nome: string;
  ativo: boolean;
}

interface DistribuicaoConfig {
  ligador_id: string;
  quantidade: number;
}

const CnpjManagement: React.FC = () => {
  const [cnpjs, setCnpjs] = useState<CNPJ[]>([]);
  const [stats, setStats] = useState<CnpjStats>({ total: 0, disponivel: 0, atribuido: 0, finalizado: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estados para distribuição manual
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [ligadores, setLigadores] = useState<Ligador[]>([]);
  const [distribuicaoConfig, setDistribuicaoConfig] = useState<DistribuicaoConfig[]>([]);
  const [isDistributing, setIsDistributing] = useState(false);
  const [selectedCnpj, setSelectedCnpj] = useState<any>(null);
  const [showCnpjModal, setShowCnpjModal] = useState(false);
  const [isUpdatingCnpjs, setIsUpdatingCnpjs] = useState(false);

  useEffect(() => {
    fetchCnpjs();
    fetchStats();
  }, []);

  const fetchCnpjs = async () => {
    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch('/api/admin/cnpjs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCnpjs(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch('/api/admin/cnpjs/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data || { total: 0, disponivel: 0, atribuido: 0, finalizado: 0 });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const fetchLigadores = async () => {
    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch('/api/admin/cnpjs/ligadores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Ligadores carregados:', data);
        setLigadores(data.data || []);
      } else {
        console.error('Erro ao buscar ligadores:', response.status);
        setMessage({ type: 'error', text: 'Erro ao carregar ligadores' });
      }
    } catch (error) {
      console.error('Erro ao buscar ligadores:', error);
      setMessage({ type: 'error', text: 'Erro de conexão ao carregar ligadores' });
    }
  };

  const openDistributeModal = async () => {
    await fetchLigadores();
    setDistribuicaoConfig([]);
    setShowDistributeModal(true);
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      setMessage({ type: 'error', text: 'Selecione um arquivo' });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch('/api/admin/cnpjs/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchCnpjs();
        fetchStats();
        setUploadFile(null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao importar arquivo' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao importar arquivo' });
    } finally {
      setIsUploading(false);
    }
  };

  const resetCnpjsForTest = async () => {
    try {
      const response = await fetch('/api/admin/cnpjs/reset-for-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao resetar CNPJs');
      }

      const result = await response.json();
      alert(`${result.message}`);
      fetchCnpjs();
      fetchStats();
    } catch (error) {
      console.error('Erro ao resetar CNPJs:', error);
      alert('Erro ao resetar CNPJs');
    }
  };

  const handleCnpjClick = (cnpj: CNPJ) => {
    // Adaptar o tipo CNPJ para CnpjData
    const adaptedCnpj = {
      ...cnpj,
      numero: cnpj.cnpj // Mapear cnpj para numero
    };
    setSelectedCnpj(adaptedCnpj as any);
    setShowCnpjModal(true);
  };

  const closeCnpjModal = () => {
    setSelectedCnpj(null);
    setShowCnpjModal(false);
  };

  const updateExistingCnpjs = async () => {
    setIsUpdatingCnpjs(true);
    try {
      const response = await fetch('/api/admin/cnpjs/update-existing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `CNPJs atualizados! Sucesso: ${result.success}, Erros: ${result.errors}` 
        });
        fetchCnpjs();
        fetchStats();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao atualizar CNPJs' });
      }
    } catch (error) {
      console.error('Erro ao atualizar CNPJs:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar CNPJs existentes' });
    } finally {
      setIsUpdatingCnpjs(false);
    }
  };

  const handleDistribute = async () => {
    // Validação 1: Verificar se há ligadores selecionados
    if (distribuicaoConfig.length === 0) {
      setMessage({ type: 'error', text: 'Selecione pelo menos um ligador' })
      return
    }

    // Validação 2: Verificar se há CNPJs disponíveis suficientes
    const totalSolicitado = getTotalSolicitado()
    if (totalSolicitado > stats.disponivel) {
      setMessage({ type: 'error', text: `Quantidade solicitada (${totalSolicitado}) excede CNPJs disponíveis (${stats.disponivel})` })
      return
    }

    // Validação 3: Verificar se todas as quantidades são válidas
    const configInvalida = distribuicaoConfig.find(config => 
      !config.quantidade || config.quantidade < 1 || config.quantidade > stats.disponivel
    )
    if (configInvalida) {
      setMessage({ type: 'error', text: 'Todas as quantidades devem ser entre 1 e ' + stats.disponivel })
      return
    }

    // Validação 4: Verificar se todos os ligadores são válidos
    const ligadorInvalido = distribuicaoConfig.find(config => 
      !ligadores.find(l => l.id === config.ligador_id)
    )
    if (ligadorInvalido) {
      setMessage({ type: 'error', text: 'Ligador inválido selecionado' })
      return
    }

    // Payload para a nova rota de distribuição manual
    const payload = { distribuicoes: distribuicaoConfig }
    
    console.log('🔍 Frontend - Payload para distribuição manual:', payload)
     
     setIsDistributing(true)
     try {
       const token = localStorage.getItem('bb_token')
       
       // Usando nova rota de distribuição manual
       const url = 'http://localhost:3001/api/admin/cnpjs/distribute-manual'
       
       console.log('📤 Enviando para rota de distribuição manual:', url)
       console.log('📤 Payload:', JSON.stringify(payload))
       
       const response = await fetch(url, {
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
        setMessage({ type: 'success', text: data.message });
        fetchStats();
        fetchCnpjs();
        setShowDistributeModal(false);
        setDistribuicaoConfig([]);
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao distribuir CNPJs' });
      }
    } catch (error) {
      console.error('❌ Erro na distribuição manual:', error)
      setMessage({ type: 'error', text: 'Erro de conexão com o servidor' });
    } finally {
      setIsDistributing(false);
    }
  };

  const toggleLigador = (ligadorId: string) => {
    const exists = distribuicaoConfig.find(config => config.ligador_id === ligadorId);
    if (exists) {
      setDistribuicaoConfig(prev => prev.filter(config => config.ligador_id !== ligadorId));
    } else {
      setDistribuicaoConfig(prev => [...prev, { ligador_id: ligadorId, quantidade: 1 }]);
    }
  };

  const updateQuantidade = (ligadorId: string, quantidade: number) => {
    if (quantidade < 1) return;
    setDistribuicaoConfig(prev => 
      prev.map(config => 
        config.ligador_id === ligadorId 
          ? { ...config, quantidade }
          : config
      )
    );
  };

  const getTotalSolicitado = () => {
    return distribuicaoConfig.reduce((sum, config) => sum + config.quantidade, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel': return 'text-green-600 bg-green-100';
      case 'atribuido': return 'text-blue-600 bg-blue-100';
      case 'finalizado': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Disponível';
      case 'atribuido': return 'Atribuído';
      case 'finalizado': return 'Finalizado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total CNPJs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disponíveis</p>
              <p className="text-2xl font-bold text-gray-900">{stats.disponivel}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Atribuídos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.atribuido}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Finalizados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.finalizado}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ações</h3>
        
        {/* Upload de arquivo */}
        <div className="flex items-center space-x-4 mb-4">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button
            onClick={handleFileUpload}
            disabled={!uploadFile || isUploading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Importando...' : 'Importar'}
          </button>
        </div>

        {/* Distribuir CNPJs */}
        <div className="flex space-x-4">
          <button
            onClick={openDistributeModal}
            disabled={stats.total === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar Distribuição
          </button>
          
          {/* Botão para atualizar CNPJs existentes */}
          <button
            onClick={updateExistingCnpjs}
            disabled={isUpdatingCnpjs || stats.total === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingCnpjs ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Atualizando...
              </>
            ) : (
              <>
                🔄 Atualizar CNPJs com API
              </>
            )}
          </button>
          
          {/* Botão temporário para resetar CNPJs */}
          <button
            onClick={resetCnpjsForTest}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            🔄 Resetar CNPJs (Teste)
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Modal de Distribuição */}
      {showDistributeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Configurar Distribuição de CNPJs</h3>
              <button
                onClick={() => setShowDistributeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>CNPJs Disponíveis:</strong> {stats.disponivel}
              </p>
              <p className="text-sm text-blue-800">
                <strong>CNPJs Atribuídos:</strong> {stats.atribuido}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Total de CNPJs:</strong> {stats.total}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Total Selecionado:</strong> {getTotalSolicitado()}
              </p>
              {getTotalSolicitado() > stats.disponivel && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ Quantidade selecionada ({getTotalSolicitado()}) excede CNPJs disponíveis ({stats.disponivel})!
                </p>
              )}
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  💡 <strong>Redistribuição:</strong> CNPJs já atribuídos serão redistribuídos automaticamente
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Selecione os Ligadores:</h4>
              
              {ligadores.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum ligador ativo encontrado</p>
              ) : (
                <div className="space-y-3">
                  {ligadores.map((ligador) => {
                    const config = distribuicaoConfig.find(c => c.ligador_id === ligador.id);
                    const isSelected = !!config;
                    
                    return (
                      <div key={ligador.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleLigador(ligador.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-3 text-sm font-medium text-gray-900">
                            {ligador.nome}
                          </label>
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600">Quantidade:</label>
                            <input
                              type="number"
                              min="1"
                              max={stats.disponivel}
                              value={config?.quantidade || 1}
                              onChange={(e) => updateQuantidade(ligador.id, parseInt(e.target.value) || 1)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDistributeModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDistribute}
                disabled={distribuicaoConfig.length === 0 || getTotalSolicitado() > stats.disponivel || isDistributing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDistributing ? 'Distribuindo...' : 'Confirmar Distribuição'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de CNPJs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">CNPJs Cadastrados</h3>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
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
                    Data Cadastro
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cnpjs.slice(0, 50).map((cnpj) => (
                  <tr 
                    key={cnpj.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleCnpjClick(cnpj)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">
                      {cnpj.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cnpj.razao_social || 'Não informado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getStatusColor(cnpj.status)
                      }`}>
                        {getStatusLabel(cnpj.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(cnpj.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cnpjs.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Nenhum CNPJ cadastrado
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Visualização do CNPJ */}
      {showCnpjModal && selectedCnpj && (
        <CnpjModal 
          cnpj={selectedCnpj} 
          isOpen={showCnpjModal} 
          onClose={closeCnpjModal} 
        />
      )}
    </div>
  );
};

export default CnpjManagement;