import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vokukjbejfgupjxwcuvl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZva3VramJlamZndXBqeHdjdXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTcxNDgsImV4cCI6MjA3MjU5MzE0OH0.8ry9hA1lz_0qOoVNM0N59T1-sCk7J72OWK_8GOoThdA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas do banco
export interface Admin {
  id: string
  email: string
  password_hash: string
  nome: string
  created_at?: string
  updated_at?: string
}

export interface Ligador {
  id: string
  username: string
  password_hash: string
  nome: string
  ativo?: boolean
  cnpjs_diarios?: number
  created_at?: string
  updated_at?: string
}

export interface CNPJ {
  id: string
  numero: string
  razao_social?: string
  status?: 'disponivel' | 'atribuido' | 'finalizado'
  disponivel?: boolean
  created_at?: string
  updated_at?: string
}

export interface CNPJAtribuicao {
  id: string
  ligador_id: string
  cnpj_id: string
  data_atribuicao?: string
  status?: 'pendente' | 'mordido' | 'nao_tem_bb' | 'nao_atende' | 'agendou'
  anotacoes?: string
  created_at?: string
  updated_at?: string
}

export interface HistoricoLigacao {
  id: string
  atribuicao_id: string
  status_anterior?: string
  status_novo: string
  observacoes?: string
  created_at?: string
}

// Funções auxiliares para autenticação
export const authHelpers = {
  async signInAdmin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  async signInLigador(username: string, password: string) {
    // Para ligadores, usamos username como email temporariamente
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${username}@ligador.local`,
      password
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
}