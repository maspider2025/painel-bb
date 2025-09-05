import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [role, setRole] = useState<'admin' | 'ligador'>('admin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({
        email: role === 'admin' ? email : undefined,
        username: role === 'ligador' ? username : undefined,
        password,
        role
      });
      
      // Redirecionar baseado no role
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/ligador/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro no login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sistema BB PJ</h2>
            <p className="text-gray-600">Faça login para continuar</p>
          </div>

          {/* Seletor de Role */}
          <div className="mb-6">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  role === 'admin'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Administrador
              </button>
              <button
                type="button"
                onClick={() => setRole('ligador')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  role === 'ligador'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Ligador
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email (Admin) ou Username (Ligador) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {role === 'admin' ? 'Email' : 'Username'}
              </label>
              <input
                type={role === 'admin' ? 'email' : 'text'}
                value={role === 'admin' ? email : username}
                onChange={(e) => {
                  if (role === 'admin') {
                    setEmail(e.target.value);
                  } else {
                    setUsername(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={role === 'admin' ? 'admin@bb.com' : 'seu_username'}
                required
              />
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite sua senha"
                required
              />
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Informações de Teste */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 mb-2">Credenciais de teste:</p>
            <p className="text-xs text-gray-500">
              <strong>Admin:</strong> admin@bb.com.br / admin123<br/>
              <strong>Ligador:</strong> ligador1 / ligador123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;