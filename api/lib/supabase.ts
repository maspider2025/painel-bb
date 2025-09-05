import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vokukjbejfgupjxwcuvl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZva3VramJlamZndXBqeHdjdXZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzE0OCwiZXhwIjoyMDcyNTkzMTQ4fQ.QgAkXSmzBENdaGg0Wddkno7jYMIyRBsopVxavkdy7uw'

// Cliente Supabase com service role para operações administrativas no backend
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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
  anotacoes?: string
  created_at?: string
  updated_at?: string
}