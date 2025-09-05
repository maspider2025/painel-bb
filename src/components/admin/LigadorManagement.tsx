import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Activity, RefreshCw } from 'lucide-react';

interface Ligador {
  id: string;
  username: string;
  nome: string;
  ativo: boolean;
  cnpjs_diarios: number;
  created_at: string;
}

interface LigadorStats {
  total_atribuicoes: number;
  pendentes: number;
  em_andamento: number;
  finalizadas: number;
  hoje: number;
}

const LigadorManagement: React.FC = () => {
  const [ligadores, setLigadores] = useState<Ligador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLigador, setEditingLigador] = useState<Ligador | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [ligadorStats, setLigadorStats] = useState<Record<string, LigadorStats>>({});
  
  const [formData, setFormData] = useState({
    username: '',
    nome: '',
    password: '',
    cnpjs_diarios: 200,
    ativo: true
  });

  useEffect(() => {
    fetchLigadores();
  }, []);

  const fetchLigadores = async () => {
    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch('/api/admin/ligadores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLigadores(data.data || []);
        
        // Buscar estatísticas para cada ligador
        for (const ligador of data.data || []) {
          fetchLigadorStats(ligador.id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar ligadores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLigadorStats = async (ligadorId: string) => {
    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch(`/api/admin/ligadores/${ligadorId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLigadorStats(prev => ({
          ...prev,
          [ligadorId]: data.data
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do ligador:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('bb_token');
      const url = editingLigador 
        ? `/api/admin/ligadores/${editingLigador.id}`
        : '/api/admin/ligadores';
      
      const method = editingLigador ? 'PUT' : 'POST';
      const body = editingLigador && !formData.password 
        ? { ...formData, password: undefined }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: editingLigador ? 'Ligador atualizado com sucesso' : 'Ligador criado com sucesso' 
        });
        fetchLigadores();
        handleCloseModal();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar ligador' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar ligador' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este ligador?')) {
      return;
    }

    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch(`/api/admin/ligadores/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Ligador deletado com sucesso' });
        fetchLigadores();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Erro ao deletar ligador' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao deletar ligador' });
    }
  };

  const handleReset = async (id: string) => {
    if (!confirm('Tem certeza que deseja resetar os CNPJs deste ligador?')) {
      return;
    }

    try {
      const token = localStorage.getItem('bb_token');
      const response = await fetch(`/api/admin/ligadores/${id}/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchLigadores();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao resetar ligador' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao resetar ligador' });
    }
  };

  const handleOpenModal = (ligador?: Ligador) => {
    if (ligador) {
      setEditingLigador(ligador);
      setFormData({
        username: ligador.username,
        nome: ligador.nome,
        password: '',
        cnpjs_diarios: ligador.cnpjs_diarios,
        ativo: ligador.ativo
      });
    } else {
      setEditingLigador(null);
      setFormData({
        username: '',
        nome: '',
        password: '',
        cnpjs_diarios: 200,
        ativo: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingLigador(null);
    setFormData({
      username: '',
      nome: '',
      password: '',
      cnpjs_diarios: 200,
      ativo: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Ligadores</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Ligador
        </button>
      </div>

      {/* Mensagens */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Lista de Ligadores */}
      <div className="bg-white shadow rounded-lg">
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
                    Ligador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CNPJs/Dia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estatísticas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ligadores.map((ligador) => {
                  const stats = ligadorStats[ligador.id];
                  return (
                    <tr key={ligador.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ligador.username}</div>
                          <div className="text-sm text-gray-500">{ligador.nome}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          ligador.ativo 
                            ? 'text-green-800 bg-green-100' 
                            : 'text-red-800 bg-red-100'
                        }`}>
                          {ligador.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ligador.cnpjs_diarios}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stats ? (
                          <div className="space-y-1">
                            <div>Total: {stats.total_atribuicoes}</div>
                            <div>Hoje: {stats.hoje}</div>
                            <div>Finalizadas: {stats.finalizadas}</div>
                          </div>
                        ) : (
                          <div className="animate-pulse">Carregando...</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleOpenModal(ligador)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReset(ligador.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Resetar CNPJs"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ligador.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {ligadores.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Nenhum ligador cadastrado
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingLigador ? 'Editar Ligador' : 'Novo Ligador'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Senha {editingLigador && '(deixe em branco para manter)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required={!editingLigador}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">CNPJs por Dia</label>
                <input
                  type="number"
                  value={formData.cnpjs_diarios}
                  onChange={(e) => setFormData({ ...formData, cnpjs_diarios: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="1000"
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                  Ativo
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingLigador ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LigadorManagement;