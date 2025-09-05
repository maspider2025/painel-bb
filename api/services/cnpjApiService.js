import fetch from 'node-fetch';

class CNPJApiService {
  constructor() {
    this.baseUrl = 'https://publica.cnpj.ws/cnpj';
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimitDelay = 1000; // 1 segundo entre requisições
  }

  // Formatar CNPJ para o formato da API (apenas números)
  formatCNPJ(cnpj) {
    // Remove todos os caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    // A API externa espera apenas números, sem formatação
    if (cleanCNPJ.length === 14) {
      return cleanCNPJ;
    }
    
    return cnpj; // Retorna original se não tiver 14 dígitos
  }

  // Formatar CNPJ para exibição (com pontos e traços)
  formatCNPJForDisplay(cnpj) {
    // Remove todos os caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    // Adiciona formatação: XX.XXX.XXX/XXXX-XX
    if (cleanCNPJ.length === 14) {
      return cleanCNPJ.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        '$1.$2.$3/$4-$5'
      );
    }
    
    return cnpj; // Retorna original se não tiver 14 dígitos
  }

  // Buscar dados do CNPJ na API externa
  async fetchCNPJData(cnpj) {
    const cleanCNPJ = this.formatCNPJ(cnpj);
    const cacheKey = cleanCNPJ;

    // Verificar cache primeiro
    if (this.cache.has(cacheKey)) {
      console.log(`CNPJ ${cleanCNPJ} encontrado no cache`);
      return this.cache.get(cacheKey);
    }

    try {
      const url = `${this.baseUrl}/${cleanCNPJ}`;
      console.log(`Buscando dados do CNPJ: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Painel-BB/1.0'
        },
        timeout: 10000 // 10 segundos de timeout
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`CNPJ ${cleanCNPJ} não encontrado`);
        }
        if (response.status === 429) {
          throw new Error('Rate limit excedido. Tente novamente em alguns segundos.');
        }
        throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validar se os dados são válidos
      if (!data || !data.cnpj_raiz) {
        throw new Error('Dados inválidos retornados pela API');
      }

      // Armazenar no cache por 1 hora
      this.cache.set(cacheKey, data);
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, 60 * 60 * 1000);

      console.log(`Dados do CNPJ ${cleanCNPJ} obtidos com sucesso`);
      return data;

    } catch (error) {
      console.error(`Erro ao buscar CNPJ ${cleanCNPJ}:`, error.message);
      throw error;
    }
  }

  // Processar dados da API para formato do banco
  processApiData(apiData, originalCNPJ) {
    try {
      const estabelecimento = apiData.estabelecimento || {};
      const endereco = this.formatAddress(estabelecimento);
      
      return {
        cnpj: originalCNPJ,
        cnpj_formatado: this.formatCNPJForDisplay(originalCNPJ),
        razao_social: apiData.razao_social || 'Não informado',
        nome_fantasia: estabelecimento.nome_fantasia || null,
        situacao_cadastral: estabelecimento.situacao_cadastral || 'Não informado',
        data_situacao_cadastral: estabelecimento.data_situacao_cadastral || null,
        data_inicio_atividade: estabelecimento.data_inicio_atividade || null,
        atividade_principal: estabelecimento.atividade_principal ? {
          codigo: estabelecimento.atividade_principal.id,
          descricao: estabelecimento.atividade_principal.descricao
        } : null,
        atividades_secundarias: estabelecimento.atividades_secundarias || [],
        natureza_juridica: apiData.natureza_juridica ? {
          codigo: apiData.natureza_juridica.id,
          descricao: apiData.natureza_juridica.descricao
        } : null,
        porte: apiData.porte ? {
          codigo: apiData.porte.id,
          descricao: apiData.porte.descricao
        } : null,
        capital_social: apiData.capital_social || null,
        endereco_completo: endereco,
        telefone: this.formatPhone(estabelecimento.ddd1, estabelecimento.telefone1),
        telefone2: this.formatPhone(estabelecimento.ddd2, estabelecimento.telefone2),
        email: estabelecimento.email || null,
        socios: apiData.socios || [],
        dados_completos: apiData, // Armazenar dados completos da API
        atualizado_em: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao processar dados da API:', error);
      throw new Error('Erro ao processar dados do CNPJ');
    }
  }

  // Formatar endereço completo
  formatAddress(estabelecimento) {
    const parts = [];
    
    if (estabelecimento.tipo_logradouro && estabelecimento.logradouro) {
      parts.push(`${estabelecimento.tipo_logradouro} ${estabelecimento.logradouro}`);
    }
    
    if (estabelecimento.numero) {
      parts.push(estabelecimento.numero);
    }
    
    if (estabelecimento.complemento) {
      parts.push(estabelecimento.complemento);
    }
    
    if (estabelecimento.bairro) {
      parts.push(estabelecimento.bairro);
    }
    
    if (estabelecimento.cidade && estabelecimento.cidade.nome) {
      parts.push(estabelecimento.cidade.nome);
    }
    
    if (estabelecimento.estado && estabelecimento.estado.sigla) {
      parts.push(estabelecimento.estado.sigla);
    }
    
    if (estabelecimento.cep) {
      parts.push(`CEP: ${estabelecimento.cep}`);
    }
    
    return parts.join(', ');
  }

  // Formatar telefone
  formatPhone(ddd, telefone) {
    if (!ddd || !telefone) return null;
    return `(${ddd}) ${telefone}`;
  }

  // Buscar múltiplos CNPJs com rate limiting
  async fetchMultipleCNPJs(cnpjs) {
    const results = [];
    
    for (const cnpj of cnpjs) {
      try {
        // Aguardar delay entre requisições
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
        }
        
        const apiData = await this.fetchCNPJData(cnpj);
        const processedData = this.processApiData(apiData, cnpj);
        
        results.push({
          cnpj,
          success: true,
          data: processedData
        });
        
      } catch (error) {
        console.error(`Erro ao processar CNPJ ${cnpj}:`, error.message);
        results.push({
          cnpj,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Limpar cache
  clearCache() {
    this.cache.clear();
    console.log('Cache de CNPJs limpo');
  }

  // Obter estatísticas do cache
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default new CNPJApiService();