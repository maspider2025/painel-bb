-- Configurar RLS e permissões para as tabelas

-- Habilitar RLS nas tabelas
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE ligadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cnpjs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cnpj_atribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_ligacoes ENABLE ROW LEVEL SECURITY;

-- Conceder permissões básicas para o role anon (acesso público limitado)
GRANT SELECT ON admins TO anon;
GRANT SELECT ON ligadores TO anon;
GRANT SELECT ON cnpjs TO anon;
GRANT SELECT ON cnpj_atribuicoes TO anon;
GRANT SELECT ON historico_ligacoes TO anon;

-- Conceder permissões completas para o role authenticated (usuários logados)
GRANT ALL PRIVILEGES ON admins TO authenticated;
GRANT ALL PRIVILEGES ON ligadores TO authenticated;
GRANT ALL PRIVILEGES ON cnpjs TO authenticated;
GRANT ALL PRIVILEGES ON cnpj_atribuicoes TO authenticated;
GRANT ALL PRIVILEGES ON historico_ligacoes TO authenticated;

-- Políticas RLS para admins (apenas eles mesmos podem ver/editar)
CREATE POLICY "Admins can view their own data" ON admins
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can update their own data" ON admins
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas RLS para ligadores (apenas eles mesmos podem ver/editar)
CREATE POLICY "Ligadores can view their own data" ON ligadores
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Ligadores can update their own data" ON ligadores
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas RLS para CNPJs (todos podem ver, apenas authenticated podem modificar)
CREATE POLICY "Anyone can view CNPJs" ON cnpjs
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can modify CNPJs" ON cnpjs
    FOR ALL USING (auth.role() = 'authenticated');

-- Políticas RLS para atribuições (ligadores veem apenas suas atribuições)
CREATE POLICY "Ligadores can view their own assignments" ON cnpj_atribuicoes
    FOR SELECT USING (auth.uid()::text = ligador_id::text);

CREATE POLICY "Ligadores can update their own assignments" ON cnpj_atribuicoes
    FOR UPDATE USING (auth.uid()::text = ligador_id::text);

CREATE POLICY "Authenticated users can create assignments" ON cnpj_atribuicoes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para histórico (ligadores veem apenas seu histórico)
CREATE POLICY "Users can view related history" ON historico_ligacoes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cnpj_atribuicoes ca 
            WHERE ca.id = atribuicao_id 
            AND ca.ligador_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Authenticated users can create history" ON historico_ligacoes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');