-- Migration para adicionar campos da API externa de CNPJs
-- Adiciona campos para armazenar dados completos da API publica.cnpj.ws

ALTER TABLE cnpjs 
ADD COLUMN IF NOT EXISTS cnpj_formatado VARCHAR(18),
ADD COLUMN IF NOT EXISTS razao_social TEXT,
ADD COLUMN IF NOT EXISTS nome_fantasia TEXT,
ADD COLUMN IF NOT EXISTS situacao_cadastral VARCHAR(50),
ADD COLUMN IF NOT EXISTS data_situacao_cadastral DATE,
ADD COLUMN IF NOT EXISTS data_inicio_atividade DATE,
ADD COLUMN IF NOT EXISTS atividade_principal JSONB,
ADD COLUMN IF NOT EXISTS atividades_secundarias JSONB,
ADD COLUMN IF NOT EXISTS natureza_juridica JSONB,
ADD COLUMN IF NOT EXISTS porte JSONB,
ADD COLUMN IF NOT EXISTS capital_social DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS endereco_completo TEXT,
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20),
ADD COLUMN IF NOT EXISTS telefone2 VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS socios JSONB,
ADD COLUMN IF NOT EXISTS dados_completos JSONB,
ADD COLUMN IF NOT EXISTS api_atualizado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS api_status VARCHAR(20) DEFAULT 'pending';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cnpjs_cnpj_formatado ON cnpjs(cnpj_formatado);
CREATE INDEX IF NOT EXISTS idx_cnpjs_razao_social ON cnpjs(razao_social);
CREATE INDEX IF NOT EXISTS idx_cnpjs_situacao_cadastral ON cnpjs(situacao_cadastral);
CREATE INDEX IF NOT EXISTS idx_cnpjs_api_status ON cnpjs(api_status);

-- Comentários para documentação
COMMENT ON COLUMN cnpjs.cnpj_formatado IS 'CNPJ formatado com pontos e traços (XX.XXX.XXX/XXXX-XX)';
COMMENT ON COLUMN cnpjs.razao_social IS 'Razão social da empresa obtida da API';
COMMENT ON COLUMN cnpjs.nome_fantasia IS 'Nome fantasia da empresa';
COMMENT ON COLUMN cnpjs.situacao_cadastral IS 'Situação cadastral (Ativa, Baixada, etc.)';
COMMENT ON COLUMN cnpjs.data_situacao_cadastral IS 'Data da situação cadastral';
COMMENT ON COLUMN cnpjs.data_inicio_atividade IS 'Data de início das atividades';
COMMENT ON COLUMN cnpjs.atividade_principal IS 'Atividade principal da empresa (JSON com código e descrição)';
COMMENT ON COLUMN cnpjs.atividades_secundarias IS 'Lista de atividades secundárias (JSON array)';
COMMENT ON COLUMN cnpjs.natureza_juridica IS 'Natureza jurídica (JSON com código e descrição)';
COMMENT ON COLUMN cnpjs.porte IS 'Porte da empresa (JSON com código e descrição)';
COMMENT ON COLUMN cnpjs.capital_social IS 'Capital social da empresa';
COMMENT ON COLUMN cnpjs.endereco_completo IS 'Endereço completo formatado';
COMMENT ON COLUMN cnpjs.telefone IS 'Telefone principal';
COMMENT ON COLUMN cnpjs.telefone2 IS 'Telefone secundário';
COMMENT ON COLUMN cnpjs.email IS 'Email da empresa';
COMMENT ON COLUMN cnpjs.socios IS 'Lista de sócios da empresa (JSON array)';
COMMENT ON COLUMN cnpjs.dados_completos IS 'Dados completos retornados pela API (JSON)';
COMMENT ON COLUMN cnpjs.api_atualizado_em IS 'Data da última atualização via API';
COMMENT ON COLUMN cnpjs.api_status IS 'Status da busca na API: pending, success, error';

-- Atualizar CNPJs existentes com status pending para buscar dados da API
UPDATE cnpjs 
SET api_status = 'pending'
WHERE api_status IS NULL;

-- Criar função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_api_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.dados_completos IS NOT NULL AND NEW.dados_completos != OLD.dados_completos THEN
        NEW.api_atualizado_em = NOW();
        NEW.api_status = 'success';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar timestamp automaticamente
DROP TRIGGER IF EXISTS trigger_update_api_timestamp ON cnpjs;
CREATE TRIGGER trigger_update_api_timestamp
    BEFORE UPDATE ON cnpjs
    FOR EACH ROW
    EXECUTE FUNCTION update_api_timestamp();