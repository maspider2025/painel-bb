-- Inserir dados de teste para admin e ligador
-- Senha 'admin123' hasheada: $2a$10$1Od25fjJbYuLWYBCPjYrs.njULilvaGP9HHm9rF9yWMzWDzgLzZxu
-- Senha 'ligador123' hasheada: $2a$10$uNh64RSPN5deDLg8y.OpS.OBbMFxfiolXiIgBTKDrNzuPPtD0Xxt2

-- Deletar dados existentes para recriar com hashes corretos
DELETE FROM admins WHERE email = 'admin@bb.com.br';
DELETE FROM ligadores WHERE username = 'ligador1';

-- Inserir admin de teste
INSERT INTO admins (email, password_hash, nome) 
VALUES ('admin@bb.com.br', '$2a$10$1Od25fjJbYuLWYBCPjYrs.njULilvaGP9HHm9rF9yWMzWDzgLzZxu', 'Administrador');

-- Inserir ligador de teste
INSERT INTO ligadores (username, password_hash, nome, ativo, cnpjs_diarios) 
VALUES ('ligador1', '$2a$10$uNh64RSPN5deDLg8y.OpS.OBbMFxfiolXiIgBTKDrNzuPPtD0Xxt2', 'Ligador Teste', true, 200);

-- Garantir permissões para as tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ligadores TO authenticated;
GRANT SELECT ON admins TO anon;
GRANT SELECT ON ligadores TO anon;