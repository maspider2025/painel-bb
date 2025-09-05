-- Atualizar senhas de todos os ligadores para 'ligador123'
-- Hash gerado para a senha 'ligador123'
UPDATE ligadores 
SET password_hash = '$2a$10$xSHUXIuucRWEyN8H5eBGNuEdje/3RbTzjuRDxeXdkUYBxdX0L44le'
WHERE username IN ('ligador1', 'ligador2', 'ligador3');

-- Verificar as atualizações
SELECT id, username, nome, ativo, 
       CASE 
         WHEN password_hash = '$2a$10$xSHUXIuucRWEyN8H5eBGNuEdje/3RbTzjuRDxeXdkUYBxdX0L44le' THEN 'Hash atualizado'
         ELSE 'Hash antigo'
       END as status_hash
FROM ligadores 
ORDER BY nome;