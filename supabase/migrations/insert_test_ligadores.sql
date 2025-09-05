-- Inserir ligadores de teste para funcionalidade de distribuição manual
INSERT INTO ligadores (username, password_hash, nome, ativo, cnpjs_diarios) VALUES
('ligador1', '$2a$10$example.hash.for.password123', 'João Silva', true, 200),
('ligador2', '$2a$10$example.hash.for.password456', 'Maria Santos', true, 150),
('ligador3', '$2a$10$example.hash.for.password789', 'Pedro Costa', true, 180)
ON CONFLICT (username) DO NOTHING;

-- Verificar se os ligadores foram inseridos
SELECT id, username, nome, ativo, cnpjs_diarios FROM ligadores WHERE ativo = true ORDER BY nome