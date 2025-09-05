-- Migração para garantir CNPJs únicos por atribuição
-- Remove o constraint atual e adiciona um novo que garante um CNPJ por atribuição

-- Primeiro, remover o constraint atual UNIQUE(cnpj_id, ligador_id)
ALTER TABLE cnpj_atribuicoes DROP CONSTRAINT IF EXISTS cnpj_atribuicoes_cnpj_id_ligador_id_key;

-- Adicionar constraint UNIQUE apenas no cnpj_id para garantir que cada CNPJ seja atribuído apenas uma vez
ALTER TABLE cnpj_atribuicoes ADD CONSTRAINT cnpj_atribuicoes_cnpj_id_unique UNIQUE (cnpj_id);

-- Adicionar índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_cnpj_atribuicoes_ligador_id ON cnpj_atribuicoes(ligador_id);
CREATE INDEX IF NOT EXISTS idx_cnpj_atribuicoes_status ON cnpj_atribuicoes(status);

-- Comentário explicativo
COMMENT ON CONSTRAINT cnpj_atribuicoes_cnpj_id_unique ON cnpj_atribuicoes IS 'Garante que cada CNPJ seja atribuído apenas uma vez, evitando duplicatas entre ligadores';