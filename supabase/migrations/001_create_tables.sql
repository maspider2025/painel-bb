-- Criação das tabelas do sistema BB PJ

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de ligadores
CREATE TABLE IF NOT EXISTS ligadores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de CNPJs
CREATE TABLE IF NOT EXISTS cnpjs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    razao_social VARCHAR(255),
    nome_fantasia VARCHAR(255),
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    porte_empresa VARCHAR(50),
    atividade_principal TEXT,
    situacao VARCHAR(50) DEFAULT 'disponivel',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de atribuições de CNPJs para ligadores
CREATE TABLE IF NOT EXISTS cnpj_atribuicoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj_id UUID REFERENCES cnpjs(id) ON DELETE CASCADE,
    ligador_id UUID REFERENCES ligadores(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pendente',
    anotacoes TEXT,
    data_atribuicao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_finalizacao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(cnpj_id, ligador_id)
);

-- Tabela de histórico de ligações
CREATE TABLE IF NOT EXISTS historico_ligacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    atribuicao_id UUID REFERENCES cnpj_atribuicoes(id) ON DELETE CASCADE,
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50),
    anotacoes TEXT,
    data_ligacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir admin padrão (senha: admin123)
INSERT INTO admins (username, password_hash, email) 
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@bb.com.br')
ON CONFLICT (username) DO NOTHING;

-- Inserir ligadores de teste
INSERT INTO ligadores (username, password_hash, nome, email, telefone) VALUES
('joao.silva', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'João Silva', 'joao.silva@bb.com.br', '(11) 99999-1111'),
('maria.santos', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Maria Santos', 'maria.santos@bb.com.br', '(11) 99999-2222'),
('pedro.oliveira', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pedro Oliveira', 'pedro.oliveira@bb.com.br', '(11) 99999-3333')
ON CONFLICT (username) DO NOTHING;

-- Inserir CNPJs de exemplo
INSERT INTO cnpjs (cnpj, razao_social, nome_fantasia, telefone, email, cidade, estado) VALUES
('11.222.333/0001-44', 'Empresa Exemplo LTDA', 'Exemplo Corp', '(11) 3333-4444', 'contato@exemplo.com.br', 'São Paulo', 'SP'),
('22.333.444/0001-55', 'Tecnologia Avançada S.A.', 'TechAdvanced', '(11) 4444-5555', 'info@techadvanced.com.br', 'São Paulo', 'SP'),
('33.444.555/0001-66', 'Comércio e Serviços ME', 'ComServ', '(11) 5555-6666', 'vendas@comserv.com.br', 'Rio de Janeiro', 'RJ')
ON CONFLICT (cnpj) DO NOTHING;