-- Corrigir senhas dos ligadores com hashes válidos
-- Hash para 'password123' (senha padrão para todos os ligadores)
UPDATE ligadores 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE username IN ('ligador2', 'ligador3');

-- Verificar se as atualizações foram aplicadas
SELECT id, username, nome, ativo, 
       CASE 
         WHEN password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' THEN 'Hash válido'
         ELSE 'Hash inválido'
       END as status_hash
FROM ligadores 
ORDER BY nome;