-- Adicionar foreign key constraints para estabelecer relacionamentos entre tabelas

-- Foreign key de cnpj_atribuicoes.ligador_id para ligadores.id
ALTER TABLE cnpj_atribuicoes 
ADD CONSTRAINT fk_cnpj_atribuicoes_ligador 
FOREIGN KEY (ligador_id) REFERENCES ligadores(id) ON DELETE CASCADE;

-- Foreign key de cnpj_atribuicoes.cnpj_id para cnpjs.id
ALTER TABLE cnpj_atribuicoes 
ADD CONSTRAINT fk_cnpj_atribuicoes_cnpj 
FOREIGN KEY (cnpj_id) REFERENCES cnpjs(id) ON DELETE CASCADE;

-- Verificar se as constraints foram criadas
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('cnpj_atribuicoes');