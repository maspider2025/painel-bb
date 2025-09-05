-- Consultar todos os ligadores existentes
SELECT id, username, nome, ativo, cnpjs_diarios, created_at 
FROM ligadores 
ORDER BY created_at;

-- Verificar especificamente se ligador1 existe
SELECT id, username, nome, ativo 
FROM ligadores 
WHERE username = 'ligador1';