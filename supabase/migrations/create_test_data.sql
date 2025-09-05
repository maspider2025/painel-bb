-- Criar dados de teste para o ligador

-- Inserir alguns CNPJs de teste
INSERT INTO cnpjs (numero, razao_social, status, disponivel) VALUES
('11.222.333/0001-44', 'Empresa Teste 1 LTDA', 'atribuido', false),
('22.333.444/0001-55', 'Empresa Teste 2 S.A.', 'atribuido', false),
('33.444.555/0001-66', 'Empresa Teste 3 ME', 'disponivel', true)
ON CONFLICT (numero) DO NOTHING;

-- Buscar o ID do ligador de teste
DO $$
DECLARE
    ligador_test_id UUID;
    cnpj1_id UUID;
    cnpj2_id UUID;
BEGIN
    -- Buscar ID do ligador
    SELECT id INTO ligador_test_id FROM ligadores WHERE username = 'ligador1';
    
    -- Buscar IDs dos CNPJs
    SELECT id INTO cnpj1_id FROM cnpjs WHERE numero = '11.222.333/0001-44';
    SELECT id INTO cnpj2_id FROM cnpjs WHERE numero = '22.333.444/0001-55';
    
    -- Criar atribuições se o ligador existir
    IF ligador_test_id IS NOT NULL AND cnpj1_id IS NOT NULL THEN
        INSERT INTO cnpj_atribuicoes (ligador_id, cnpj_id, status, data_atribuicao)
        VALUES (ligador_test_id, cnpj1_id, 'pendente', CURRENT_DATE)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF ligador_test_id IS NOT NULL AND cnpj2_id IS NOT NULL THEN
        INSERT INTO cnpj_atribuicoes (ligador_id, cnpj_id, status, data_atribuicao)
        VALUES (ligador_test_id, cnpj2_id, 'pendente', CURRENT_DATE)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Verificar se as atribuições foram criadas
SELECT 
    l.username as ligador,
    c.numero as cnpj,
    ca.status,
    ca.data_atribuicao
FROM cnpj_atribuicoes ca
JOIN ligadores l ON ca.ligador_id = l.id
JOIN cnpjs c ON ca.cnpj_id = c.id
WHERE l.username = 'ligador1';