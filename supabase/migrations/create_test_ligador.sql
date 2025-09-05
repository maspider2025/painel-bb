-- Inserir ligador de teste
INSERT INTO ligadores (username, password_hash, nome, ativo, cnpjs_diarios)
VALUES (
  'ligador1',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
  'Ligador Teste 1',
  true,
  200
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  nome = EXCLUDED.nome,
  ativo = EXCLUDED.ativo,
  cnpjs_diarios = EXCLUDED.cnpjs_diarios,
  updated_at = now();

-- Verificar se foi inserido
SELECT id, username, nome, ativo FROM ligadores WHERE username = 'ligador1';