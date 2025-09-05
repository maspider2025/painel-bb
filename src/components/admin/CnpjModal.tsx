import React from 'react'
import { X, Building2, MapPin, Phone, Mail, Users, Calendar, FileText, DollarSign } from 'lucide-react'

interface CnpjData {
  id: string
  numero: string
  cnpj_formatado?: string
  razao_social: string
  nome_fantasia?: string
  situacao_cadastral?: string
  data_situacao_cadastral?: string
  data_inicio_atividade?: string
  atividade_principal?: any
  atividades_secundarias?: any[]
  natureza_juridica?: any
  porte?: any
  capital_social?: string
  endereco_completo?: string
  telefone?: string
  telefone2?: string
  email?: string
  socios?: any[]
  dados_completos?: {
    cnpj_raiz?: string
    razao_social?: string
    capital_social?: string
    responsavel_federativo?: string
    atualizado_em?: string
    porte?: {
      id?: string
      descricao?: string
    }
    natureza_juridica?: {
      id?: string
      descricao?: string
    }
    qualificacao_responsavel?: {
      id?: string
      descricao?: string
    }
    socios?: any[]
    simples?: any
    estabelecimento?: {
      cnpj?: string
      cnpj_raiz?: string
      cnpj_ordem?: string
      cnpj_digito_verificador?: string
      tipo?: string
      nome_fantasia?: string
      situacao_cadastral?: string
      data_situacao_cadastral?: string
      data_inicio_atividade?: string
      nome_cidade_exterior?: string
      tipo_logradouro?: string
      logradouro?: string
      numero?: string
      complemento?: string
      bairro?: string
      cep?: string
      ddd1?: string
      telefone1?: string
      ddd2?: string
      telefone2?: string
      ddd_fax?: string
      fax?: string
      email?: string
      situacao_especial?: string
      data_situacao_especial?: string
      atualizado_em?: string
      atividade_principal?: {
        id?: string
        secao?: string
        divisao?: string
        grupo?: string
        classe?: string
        subclasse?: string
        descricao?: string
      }
      atividades_secundarias?: any[]
      pais?: {
        id?: string
        iso2?: string
        iso3?: string
        nome?: string
        comex_id?: string
      }
      estado?: {
        id?: number
        nome?: string
        sigla?: string
        ibge_id?: number
      }
      cidade?: {
        id?: number
        nome?: string
        ibge_id?: number
        siafi_id?: string
      }
      motivo_situacao_cadastral?: any
      inscricoes_estaduais?: any[]
    }
  }
  api_status?: string
  status: string
  ligador_id?: string
  ligador?: {
    nome: string
  }
}

interface CnpjModalProps {
  cnpj: CnpjData | null
  isOpen: boolean
  onClose: () => void
}

const CnpjModal: React.FC<CnpjModalProps> = ({ cnpj, isOpen, onClose }) => {
  if (!isOpen || !cnpj) return null

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não informado'
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  const formatCurrency = (value?: string) => {
    if (!value) return 'Não informado'
    try {
      const num = parseFloat(value)
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(num)
    } catch {
      return value
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'ativa':
        return 'text-green-600 bg-green-100'
      case 'suspensa':
        return 'text-yellow-600 bg-yellow-100'
      case 'baixada':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const hasApiData = cnpj.api_status === 'success' && cnpj.dados_completos

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {cnpj.cnpj_formatado || cnpj.numero}
              </h2>
              <p className="text-sm text-gray-500">
                {cnpj.razao_social}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status da API */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status dos Dados:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                cnpj.api_status === 'success' 
                  ? 'text-green-600 bg-green-100' 
                  : cnpj.api_status === 'error'
                  ? 'text-red-600 bg-red-100'
                  : 'text-gray-600 bg-gray-100'
              }`}>
                {cnpj.api_status === 'success' ? 'Dados Completos' : 
                 cnpj.api_status === 'error' ? 'Erro na API' : 'Dados Básicos'}
              </span>
            </div>
            {cnpj.ligador && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Ligador:</span> {cnpj.ligador.nome}
              </div>
            )}
          </div>

          {hasApiData ? (
            // Dados completos da API
            <div className="space-y-8">
              {/* Informações Gerais da Empresa */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                    Informações Gerais
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">CNPJ</label>
                      <p className="text-gray-900 font-mono">{cnpj.dados_completos?.estabelecimento?.cnpj || cnpj.numero}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">CNPJ Raiz</label>
                      <p className="text-gray-900 font-mono">{cnpj.dados_completos?.cnpj_raiz || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Ordem</label>
                      <p className="text-gray-900">{cnpj.dados_completos?.estabelecimento?.cnpj_ordem || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Dígito Verificador</label>
                      <p className="text-gray-900">{cnpj.dados_completos?.estabelecimento?.cnpj_digito_verificador || 'Não informado'}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tipo</label>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        cnpj.dados_completos?.estabelecimento?.tipo === 'Matriz' 
                          ? 'text-blue-600 bg-blue-100' 
                          : 'text-purple-600 bg-purple-100'
                      }`}>
                        {cnpj.dados_completos?.estabelecimento?.tipo || 'Não informado'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-green-600" />
                    Dados da Empresa
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Razão Social</label>
                      <p className="text-gray-900">{cnpj.dados_completos?.razao_social || cnpj.razao_social}</p>
                    </div>
                    
                    {cnpj.dados_completos?.estabelecimento?.nome_fantasia && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Nome Fantasia</label>
                        <p className="text-gray-900">{cnpj.dados_completos.estabelecimento.nome_fantasia}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Situação Cadastral</label>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        getStatusColor(cnpj.dados_completos?.estabelecimento?.situacao_cadastral)
                      }`}>
                        {cnpj.dados_completos?.estabelecimento?.situacao_cadastral || 'Não informado'}
                      </span>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Data da Situação</label>
                      <p className="text-gray-900">{formatDate(cnpj.dados_completos?.estabelecimento?.data_situacao_cadastral)}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Início da Atividade</label>
                      <p className="text-gray-900">{formatDate(cnpj.dados_completos?.estabelecimento?.data_inicio_atividade)}</p>
                    </div>
                    
                    {cnpj.dados_completos?.capital_social && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Capital Social</label>
                        <p className="text-gray-900">{formatCurrency(cnpj.dados_completos.capital_social)}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.estabelecimento?.situacao_especial && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Situação Especial</label>
                        <p className="text-gray-900">{cnpj.dados_completos.estabelecimento.situacao_especial}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.estabelecimento?.data_situacao_especial && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Data Situação Especial</label>
                        <p className="text-gray-900">{formatDate(cnpj.dados_completos.estabelecimento.data_situacao_especial)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Natureza Jurídica e Porte */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-purple-600" />
                    Natureza Jurídica e Porte
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {cnpj.dados_completos?.natureza_juridica && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Código Natureza Jurídica</label>
                        <p className="text-gray-900 font-mono">{typeof cnpj.dados_completos.natureza_juridica === 'object' ? (cnpj.dados_completos.natureza_juridica as any).codigo : cnpj.dados_completos.natureza_juridica}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.natureza_juridica && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Natureza Jurídica</label>
                        <p className="text-gray-900">{typeof cnpj.dados_completos.natureza_juridica === 'object' ? cnpj.dados_completos.natureza_juridica.descricao : cnpj.dados_completos.natureza_juridica}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.porte && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Código Porte</label>
                        <p className="text-gray-900 font-mono">{typeof cnpj.dados_completos.porte === 'object' ? cnpj.dados_completos.porte.id || (cnpj.dados_completos.porte as any).codigo : cnpj.dados_completos.porte}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.porte && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Porte da Empresa</label>
                        <p className="text-gray-900">{typeof cnpj.dados_completos.porte === 'object' ? cnpj.dados_completos.porte.descricao : cnpj.dados_completos.porte}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.responsavel_federativo && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Responsável Federativo</label>
                        <p className="text-gray-900">{cnpj.dados_completos.responsavel_federativo}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Regime Tributário */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-orange-600" />
                    Regime Tributário
                  </h3>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {cnpj.dados_completos?.simples && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Optante pelo Simples</label>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                            cnpj.dados_completos.simples.optante ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                          }`}>
                            {cnpj.dados_completos.simples.optante ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        
                        {cnpj.dados_completos.simples.data_opcao && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Data Opção Simples</label>
                            <p className="text-gray-900">{formatDate(cnpj.dados_completos.simples.data_opcao)}</p>
                          </div>
                        )}
                        
                        {cnpj.dados_completos.simples.data_exclusao && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Data Exclusão Simples</label>
                            <p className="text-gray-900">{formatDate(cnpj.dados_completos.simples.data_exclusao)}</p>
                          </div>
                        )}
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700">Optante pelo MEI</label>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                            cnpj.dados_completos.simples.mei ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                          }`}>
                            {cnpj.dados_completos.simples.mei ? 'Sim' : 'Não'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Atividades Econômicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Atividades Econômicas
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Atividade Principal */}
                  {cnpj.dados_completos?.estabelecimento?.atividade_principal && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-3">Atividade Principal</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Código CNAE</label>
                          <p className="text-gray-900 font-mono">{typeof cnpj.dados_completos.estabelecimento.atividade_principal === 'object' ? (cnpj.dados_completos.estabelecimento.atividade_principal as any).codigo : cnpj.dados_completos.estabelecimento.atividade_principal}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Descrição</label>
                          <p className="text-gray-900">{typeof cnpj.dados_completos.estabelecimento.atividade_principal === 'object' ? cnpj.dados_completos.estabelecimento.atividade_principal.descricao : cnpj.dados_completos.estabelecimento.atividade_principal}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Atividades Secundárias */}
                  {cnpj.dados_completos?.estabelecimento?.atividades_secundarias && cnpj.dados_completos.estabelecimento.atividades_secundarias.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-3">Atividades Secundárias</h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {cnpj.dados_completos.estabelecimento.atividades_secundarias.map((atividade, index) => (
                          <div key={index} className="border-b border-blue-200 pb-2 last:border-b-0">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Código CNAE</label>
                              <p className="text-gray-900 font-mono text-sm">{typeof atividade === 'object' ? atividade.codigo : atividade}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Descrição</label>
                              <p className="text-gray-900 text-sm">{typeof atividade === 'object' ? atividade.descricao : atividade}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Endereço Completo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-red-600" />
                  Endereço Completo
                </h3>
                
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cnpj.dados_completos?.estabelecimento?.logradouro && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Logradouro</label>
                        <p className="text-gray-900">{cnpj.dados_completos.estabelecimento.logradouro}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.estabelecimento?.numero && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Número</label>
                        <p className="text-gray-900">{cnpj.dados_completos.estabelecimento.numero}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.estabelecimento?.complemento && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Complemento</label>
                        <p className="text-gray-900">{cnpj.dados_completos.estabelecimento.complemento}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.estabelecimento?.bairro && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Bairro</label>
                        <p className="text-gray-900">{cnpj.dados_completos.estabelecimento.bairro}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.estabelecimento?.cidade && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Cidade</label>
                        <p className="text-gray-900">{typeof cnpj.dados_completos.estabelecimento.cidade === 'object' ? cnpj.dados_completos.estabelecimento.cidade.nome : cnpj.dados_completos.estabelecimento.cidade}</p>
                      </div>
                    )}
                    
                    {(cnpj.dados_completos?.estabelecimento as any)?.uf && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">UF</label>
                        <p className="text-gray-900 font-mono">{typeof (cnpj.dados_completos.estabelecimento as any).uf === 'object' ? (cnpj.dados_completos.estabelecimento as any).uf.sigla || (cnpj.dados_completos.estabelecimento as any).uf.nome : (cnpj.dados_completos.estabelecimento as any).uf}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.estabelecimento?.cep && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">CEP</label>
                        <p className="text-gray-900 font-mono">{cnpj.dados_completos.estabelecimento.cep}</p>
                      </div>
                    )}
                    
                    {(cnpj.dados_completos?.estabelecimento?.ddd1 || cnpj.dados_completos?.estabelecimento?.telefone1) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Telefone Principal</label>
                        <p className="text-gray-900 font-mono">
                          {cnpj.dados_completos.estabelecimento.ddd1 && cnpj.dados_completos.estabelecimento.telefone1 
                            ? `(${cnpj.dados_completos.estabelecimento.ddd1}) ${cnpj.dados_completos.estabelecimento.telefone1}`
                            : cnpj.dados_completos.estabelecimento.telefone1 || cnpj.dados_completos.estabelecimento.ddd1
                          }
                        </p>
                      </div>
                    )}
                    
                    {(cnpj.dados_completos?.estabelecimento?.ddd2 || cnpj.dados_completos?.estabelecimento?.telefone2) && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Telefone Secundário</label>
                        <p className="text-gray-900 font-mono">
                          {cnpj.dados_completos.estabelecimento.ddd2 && cnpj.dados_completos.estabelecimento.telefone2 
                            ? `(${cnpj.dados_completos.estabelecimento.ddd2}) ${cnpj.dados_completos.estabelecimento.telefone2}`
                            : cnpj.dados_completos.estabelecimento.telefone2 || cnpj.dados_completos.estabelecimento.ddd2
                          }
                        </p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.estabelecimento?.email && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">E-mail</label>
                        <p className="text-gray-900">{cnpj.dados_completos.estabelecimento.email}</p>
                      </div>
                    )}
                    
                    {cnpj.dados_completos?.estabelecimento?.inscricoes_estaduais && cnpj.dados_completos.estabelecimento.inscricoes_estaduais.length > 0 && (
                      <div className="col-span-full">
                        <label className="text-sm font-medium text-gray-700">Inscrições Estaduais</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {cnpj.dados_completos.estabelecimento.inscricoes_estaduais.map((inscricao, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">
                              {typeof inscricao === 'object' ? `${inscricao.inscricao_estadual || inscricao.numero || inscricao} (${inscricao.estado || inscricao.uf || ''})` : inscricao}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Endereço Formatado */}
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <label className="text-sm font-medium text-gray-700">Endereço Completo</label>
                    <p className="text-gray-900 font-medium">
                      {[
                        cnpj.dados_completos?.estabelecimento?.logradouro,
                        cnpj.dados_completos?.estabelecimento?.numero,
                        cnpj.dados_completos?.estabelecimento?.complemento
                      ].filter(Boolean).join(', ')}
                      {(cnpj.dados_completos?.estabelecimento as any)?.bairro && (
                        <><br />{(cnpj.dados_completos.estabelecimento as any).bairro} - {typeof (cnpj.dados_completos?.estabelecimento as any)?.cidade === 'object' ? (cnpj.dados_completos.estabelecimento as any).cidade.nome : (cnpj.dados_completos?.estabelecimento as any)?.cidade}/{typeof (cnpj.dados_completos?.estabelecimento as any)?.uf === 'object' ? (cnpj.dados_completos.estabelecimento as any).uf.sigla || (cnpj.dados_completos.estabelecimento as any).uf.nome : (cnpj.dados_completos?.estabelecimento as any)?.uf}</>
                      )}
                      {cnpj.dados_completos?.estabelecimento?.cep && (
                        <><br />CEP: {cnpj.dados_completos.estabelecimento.cep}</>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sócios Completos */}
              {cnpj.dados_completos?.socios && cnpj.dados_completos.socios.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-purple-600" />
                    Sócios ({cnpj.dados_completos.socios.length})
                  </h3>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {cnpj.dados_completos.socios.map((socio, index) => (
                      <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="col-span-full">
                            <label className="text-sm font-medium text-gray-700">Nome/Razão Social</label>
                            <p className="text-gray-900 font-semibold text-lg">{socio.nome}</p>
                          </div>
                          
                          {socio.cpf_cnpj_socio && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">CPF/CNPJ</label>
                              <p className="text-gray-900 font-mono">{socio.cpf_cnpj_socio}</p>
                            </div>
                          )}
                          
                          {socio.qualificacao_socio && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Código Qualificação</label>
                              <p className="text-gray-900 font-mono">{typeof socio.qualificacao_socio === 'object' ? socio.qualificacao_socio.id : socio.qualificacao_socio}</p>
                            </div>
                          )}
                          
                          {socio.qualificacao_socio && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Qualificação</label>
                              <p className="text-gray-900">{typeof socio.qualificacao_socio === 'object' ? socio.qualificacao_socio.descricao : socio.qualificacao_socio}</p>
                            </div>
                          )}
                          
                          {socio.pais && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">País</label>
                              <p className="text-gray-900">{typeof socio.pais === 'object' ? socio.pais.nome : socio.pais}</p>
                            </div>
                          )}
                          
                          {socio.faixa_etaria && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Faixa Etária</label>
                              <p className="text-gray-900">{typeof socio.faixa_etaria === 'object' ? socio.faixa_etaria.descricao || socio.faixa_etaria.nome : socio.faixa_etaria}</p>
                            </div>
                          )}
                          
                          {socio.data_entrada && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Data de Entrada</label>
                              <p className="text-gray-900">{formatDate(socio.data_entrada)}</p>
                            </div>
                          )}
                          
                          {socio.cpf_representante_legal && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">CPF Representante Legal</label>
                              <p className="text-gray-900 font-mono">{socio.cpf_representante_legal}</p>
                            </div>
                          )}
                          
                          {socio.nome_representante && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Nome Representante Legal</label>
                              <p className="text-gray-900">{socio.nome_representante}</p>
                            </div>
                          )}
                          
                          {socio.qualificacao_representante && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Qualificação Representante</label>
                              <p className="text-gray-900">{typeof socio.qualificacao_representante === 'object' ? socio.qualificacao_representante.descricao : socio.qualificacao_representante}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Informações Adicionais da API */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                  Informações Adicionais
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Motivo Situação Cadastral */}
                  {cnpj.dados_completos?.estabelecimento?.motivo_situacao_cadastral && (
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-800 mb-3">Motivo Situação Cadastral</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Código</label>
                          <p className="text-gray-900 font-mono">{typeof cnpj.dados_completos.estabelecimento.motivo_situacao_cadastral === 'object' ? cnpj.dados_completos.estabelecimento.motivo_situacao_cadastral.codigo : cnpj.dados_completos.estabelecimento.motivo_situacao_cadastral}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Descrição</label>
                          <p className="text-gray-900">{typeof cnpj.dados_completos.estabelecimento.motivo_situacao_cadastral === 'object' ? cnpj.dados_completos.estabelecimento.motivo_situacao_cadastral.descricao : cnpj.dados_completos.estabelecimento.motivo_situacao_cadastral}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Outras Informações */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Outras Informações</h4>
                    <div className="space-y-3">
                      {(cnpj.dados_completos?.estabelecimento as any)?.matriz_filial && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Matriz/Filial</label>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                            (cnpj.dados_completos.estabelecimento as any).matriz_filial === 'Matriz' 
                              ? 'text-blue-600 bg-blue-100' 
                              : 'text-green-600 bg-green-100'
                          }`}>
                            {(cnpj.dados_completos.estabelecimento as any).matriz_filial}
                          </span>
                        </div>
                      )}
                      
                      {(cnpj.dados_completos as any)?.updated_at && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Última Atualização API</label>
                          <p className="text-gray-900 text-sm">{formatDate((cnpj.dados_completos as any).updated_at)}</p>
                        </div>
                      )}
                      
                      {cnpj.dados_completos?.estabelecimento?.cnpj && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">CNPJ Formatado</label>
                          <p className="text-gray-900 font-mono text-lg">{cnpj.dados_completos.estabelecimento.cnpj}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Dados básicos (sem API)
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Dados Básicos</h3>
              <p className="text-gray-600 mb-4">
                Este CNPJ possui apenas informações básicas.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">CNPJ:</span>
                    <span className="ml-2 text-gray-900">{cnpj.numero}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Razão Social:</span>
                    <span className="ml-2 text-gray-900">{cnpj.razao_social}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      cnpj.status === 'disponivel' ? 'text-green-600 bg-green-100' :
                      cnpj.status === 'atribuido' ? 'text-blue-600 bg-blue-100' :
                      'text-gray-600 bg-gray-100'
                    }`}>
                      {cnpj.status === 'disponivel' ? 'Disponível' :
                       cnpj.status === 'atribuido' ? 'Atribuído' : cnpj.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CnpjModal