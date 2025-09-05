import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import { toast } from 'sonner'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Tentando login com:', formData);
      const response = await fetch('http://localhost:3001/api/auth/ligador/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('bb_token') || ''}`
        },
        body: JSON.stringify(formData)
      })

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        localStorage.setItem('bb_token', data.token);
        localStorage.setItem('bb_user', JSON.stringify(data.user));
        toast.success('Login realizado com sucesso!');
        
        // Pequeno delay para garantir que os tokens sejam salvos
        setTimeout(() => {
          navigate('/ligador/dashboard');
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        console.error('Login failed:', errorData);
        toast.error(errorData.message || errorData.error || 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro de conexão');
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bb-background min-h-screen flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bb-animate-fade-in">
        <div className="bb-card bb-glass p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto h-24 w-24 sm:h-28 sm:w-28 rounded-full flex items-center justify-center mb-6 bb-glow" style={{ background: 'var(--bb-gradient-primary)' }}>
              <User className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bb-gradient-text mb-3">
              Painel do Ligador
            </h1>
            <div className="h-1 w-20 mx-auto mb-4" style={{ background: 'var(--bb-gradient-secondary)' }}></div>
            <p className="text-sm sm:text-base text-gray-600">
              Faça login para acessar seus CNPJs
            </p>
          </div>
        
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="bb-animate-slide-in">
                <label htmlFor="username" className="block text-sm font-semibold bb-text-primary mb-2">
                  Usuário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5" style={{ color: 'var(--bb-blue-primary)' }} />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="bb-input w-full pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base font-medium"
                    placeholder="Digite seu usuário"
                  />
                </div>
              </div>
            
              <div className="bb-animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="password" className="block text-sm font-semibold bb-text-primary mb-2">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5" style={{ color: 'var(--bb-blue-primary)' }} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="bb-input w-full pl-12 pr-12 py-3 sm:py-4 text-sm sm:text-base font-medium"
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" style={{ color: 'var(--bb-blue-primary)' }} />
                    ) : (
                      <Eye className="h-5 w-5" style={{ color: 'var(--bb-blue-primary)' }} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bb-animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <button
                type="submit"
                disabled={loading}
                className="bb-button-primary w-full py-3 sm:py-4 px-6 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    <span>Entrar</span>
                    <svg className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </div>

          </form>
          
          <div className="text-center mt-6">
            <Link
              to="/admin/login"
              className="text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Acessar como Administrador
            </Link>
          </div>
        
          <div className="text-center mt-6 bb-animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4"></div>
            <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--bb-blue-primary)' }}>
              Sistema de Gestão de Ligadores
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Banco do Brasil S.A.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login